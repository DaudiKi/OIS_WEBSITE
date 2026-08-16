// AMS data API. All UI code talks to this facade. By default it runs on the
// browser-local database (demo mode — works on plain static hosting). When
// public/ams-config.js defines window.OIS_AMS_CONFIG = { supabaseUrl,
// supabaseAnonKey }, all calls are served by Supabase instead (see
// supabaseAdapter.js and supabase/schema.sql).

import {
  loadDb,
  mutate,
  newId,
  getSession,
  setSession,
  hashPassword,
  resetDemoData,
} from './localDb.js';

function supabaseConfig() {
  const cfg = typeof window !== 'undefined' ? window.OIS_AMS_CONFIG : null;
  if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) return cfg;
  return null;
}

export function isDemoMode() {
  return !supabaseConfig();
}

let adapterPromise = null;
async function remote() {
  if (!adapterPromise) {
    adapterPromise = import('./supabaseAdapter.js').then((mod) => mod.createAdapter(supabaseConfig()));
  }
  return adapterPromise;
}

/* ------------------------------- Auth ---------------------------------- */

// Students sign in with their student number (OIS0001) rather than an email.
// Mirrors studentNumberToEmail in supabaseAdapter.js and admin_create_user in
// the database — all three must build the same address.
const STUDENT_EMAIL_DOMAIN = 'students.ois.ug';

// Issued to a new student login when the school hasn't set its own default.
// Students are prompted to change it after first sign-in.
export const DEFAULT_STUDENT_PASSWORD = 'OIS2027';

export function studentNumberToEmail(identifier) {
  const compact = String(identifier || '').trim().replace(/[\s/-]/g, '');
  return /^OIS\d+$/i.test(compact) ? `${compact.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}` : null;
}

export async function signIn(identifier, password) {
  if (!isDemoMode()) return (await remote()).signIn(identifier, password);
  const db = await loadDb();
  const email = studentNumberToEmail(identifier) || identifier;
  const passwordHash = await hashPassword(password);
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== passwordHash) {
    throw new Error('Invalid login or password.');
  }
  if (user.status === 'pending') {
    throw new Error('Your account is awaiting approval by the school administrator.');
  }
  if (user.status === 'disabled') {
    throw new Error('This account has been disabled. Please contact the school office.');
  }
  const session = { userId: user.id, signedInAt: new Date().toISOString() };
  setSession(session);
  return sanitizeUser(user);
}

/**
 * Create an account. Only an administrator may do this — the AMS has no public
 * signup, so nobody outside the school can give themselves a login. Students
 * are identified by their student number instead of an email address.
 */
export async function adminCreateUser({ role, name, phone, email, studentId, password }) {
  if (!isDemoMode()) {
    return (await remote()).adminCreateUser({ role, name, phone, email, studentId, password });
  }

  const db = await loadDb();
  let resolvedEmail = (email || '').trim().toLowerCase();
  let studentNumber = null;

  if (role === 'student') {
    const student = db.students.find((s) => s.id === studentId);
    if (!student) throw new Error('Select which student this login belongs to.');
    if (db.users.some((u) => u.studentId === studentId && u.role === 'student')) {
      throw new Error('This student already has a login.');
    }
    studentNumber = student.studentNumber;
    resolvedEmail = `${studentNumber.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
  } else if (!resolvedEmail) {
    throw new Error('An email address is required for this role.');
  }

  const resolvedPassword =
    (password || '').trim() || db.settings?.students?.defaultPassword || DEFAULT_STUDENT_PASSWORD;
  if (resolvedPassword.length < 6) throw new Error('Password must be at least 6 characters.');
  if (db.users.some((u) => u.email.toLowerCase() === resolvedEmail)) {
    throw new Error(
      role === 'student' ? 'This student already has a login.' : 'An account with this email already exists.'
    );
  }

  const user = {
    id: newId('usr'),
    name,
    email: resolvedEmail,
    phone: phone || '',
    role,
    status: 'active',
    studentId: role === 'student' ? studentId : undefined,
    passwordHash: await hashPassword(resolvedPassword),
    createdAt: new Date().toISOString(),
  };
  await mutate((data) => data.users.push(user));
  return { ...sanitizeUser(user), password: resolvedPassword, studentNumber };
}

/** An administrator resetting somebody else's password. */
export async function adminSetPassword(userId, password) {
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (!isDemoMode()) return (await remote()).adminSetPassword(userId, password);
  const passwordHash = await hashPassword(password);
  return mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Account not found.');
    user.passwordHash = passwordHash;
    return true;
  });
}

/** A signed-in user changing their own password. */
export async function changePassword(newPassword) {
  if (newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
  if (!isDemoMode()) return (await remote()).changePassword(newPassword);
  const session = getSession();
  if (!session) throw new Error('You are not signed in.');
  const passwordHash = await hashPassword(newPassword);
  return mutate((db) => {
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) throw new Error('Account not found.');
    user.passwordHash = passwordHash;
    return true;
  });
}

export async function signOut() {
  if (!isDemoMode()) return (await remote()).signOut();
  setSession(null);
  return true;
}

export async function currentUser() {
  if (!isDemoMode()) return (await remote()).currentUser();
  const session = getSession();
  if (!session) return null;
  const db = await loadDb();
  const user = db.users.find((u) => u.id === session.userId);
  return user ? sanitizeUser(user) : null;
}

function sanitizeUser(user) {
  const rest = { ...user };
  delete rest.passwordHash;
  return rest;
}

/* ------------------------------- Users ---------------------------------- */

export async function listUsers() {
  if (!isDemoMode()) return (await remote()).list('profiles');
  const db = await loadDb();
  return db.users.map(sanitizeUser);
}

export async function updateUser(id, patch) {
  if (!isDemoMode()) return (await remote()).update('profiles', id, patch);
  return mutate((db) => {
    const user = db.users.find((u) => u.id === id);
    if (user) Object.assign(user, patch);
    return user ? sanitizeUser(user) : null;
  });
}

export async function deleteUser(id) {
  if (!isDemoMode()) return (await remote()).remove('profiles', id);
  return mutate((db) => {
    db.users = db.users.filter((u) => u.id !== id);
    return true;
  });
}

/* ------------------------- Generic collections -------------------------- */

const COLLECTIONS = {
  students: 'students',
  teachers: 'teachers',
  classes: 'classes',
  grades: 'grades',
  attendance: 'attendance',
  announcements: 'announcements',
  events: 'events',
  applications: 'applications',
  galleryItems: 'gallery_items',
};

async function listLocal(collection) {
  const db = await loadDb();
  return [...(db[collection] || [])];
}

// Demo-mode counterpart of the database's assign_student_number trigger, so a
// student added offline gets the same OIS0001-style number.
export function nextStudentNumber(students) {
  const highest = students.reduce((max, student) => {
    const digits = /^OIS(\d+)$/i.exec((student.studentNumber || '').trim());
    return digits ? Math.max(max, Number(digits[1])) : max;
  }, 0);
  return `OIS${String(highest + 1).padStart(4, '0')}`;
}

async function saveLocal(collection, prefix, record) {
  return mutate((db) => {
    const items = db[collection];
    if (record.id) {
      const index = items.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...record };
        return items[index];
      }
    }
    const created = { ...record, id: record.id || newId(prefix), createdAt: record.createdAt || new Date().toISOString() };
    if (collection === 'students') {
      created.studentNumber = (created.studentNumber || '').trim().toUpperCase() || nextStudentNumber(items);
    }
    items.push(created);
    return created;
  });
}

async function removeLocal(collection, id) {
  return mutate((db) => {
    db[collection] = db[collection].filter((item) => item.id !== id);
    return true;
  });
}

function collectionApi(collection, prefix) {
  return {
    async list() {
      if (!isDemoMode()) return (await remote()).list(COLLECTIONS[collection]);
      return listLocal(collection);
    },
    async save(record) {
      if (!isDemoMode()) return (await remote()).save(COLLECTIONS[collection], record);
      return saveLocal(collection, prefix, record);
    },
    async remove(id) {
      if (!isDemoMode()) return (await remote()).remove(COLLECTIONS[collection], id);
      return removeLocal(collection, id);
    },
  };
}

const studentsApi = collectionApi('students', 'std');
const teachersApi = collectionApi('teachers', 'tch');
const classesApi = collectionApi('classes', 'cls');
const gradesApi = collectionApi('grades', 'grd');
const announcementsApi = collectionApi('announcements', 'ann');
const eventsApi = collectionApi('events', 'evt');
const applicationsApi = collectionApi('applications', 'app');
const galleryApi = collectionApi('galleryItems', 'gal');

export const listStudents = studentsApi.list;
export const saveStudent = studentsApi.save;
export const deleteStudent = studentsApi.remove;

export const listTeachers = teachersApi.list;
export const saveTeacher = teachersApi.save;
export const deleteTeacher = teachersApi.remove;

export const listClasses = classesApi.list;
export const saveClass = classesApi.save;
export const deleteClass = classesApi.remove;

export const listGrades = gradesApi.list;
export const saveGrade = gradesApi.save;
export const deleteGrade = gradesApi.remove;

export const listAnnouncements = announcementsApi.list;
export const saveAnnouncement = announcementsApi.save;
export const deleteAnnouncement = announcementsApi.remove;

export const listEvents = eventsApi.list;
export const saveEvent = eventsApi.save;
export const deleteEvent = eventsApi.remove;

export const listApplications = applicationsApi.list;
export const saveApplication = applicationsApi.save;
export const deleteApplication = applicationsApi.remove;

export const listGalleryItems = galleryApi.list;
export const saveGalleryItem = galleryApi.save;
export const deleteGalleryItem = galleryApi.remove;

/* --------------------------- Attendance --------------------------------- */

export async function listAttendance({ classId, date } = {}) {
  if (!isDemoMode()) return (await remote()).listAttendance({ classId, date });
  const db = await loadDb();
  return db.attendance.filter(
    (record) => (!classId || record.classId === classId) && (!date || record.date === date)
  );
}

export async function saveAttendance(classId, date, records) {
  if (!isDemoMode()) return (await remote()).saveAttendance(classId, date, records);
  return mutate((db) => {
    db.attendance = db.attendance.filter((record) => !(record.classId === classId && record.date === date));
    records.forEach(({ studentId, status }) => {
      db.attendance.push({ id: newId('att'), classId, date, studentId, status });
    });
    return true;
  });
}

/* --------------------------- Terms & settings ---------------------------- */

const termsApi = collectionApi('terms', 'trm');
export const listTerms = termsApi.list;
export const saveTerm = termsApi.save;
export const deleteTerm = termsApi.remove;

export async function getSettings() {
  if (!isDemoMode()) return (await remote()).getSettings();
  const db = await loadDb();
  return db.settings;
}

export async function saveSettings(patch) {
  if (!isDemoMode()) return (await remote()).saveSettings(patch);
  return mutate((db) => {
    db.settings = { ...db.settings, ...patch };
    return db.settings;
  });
}

/* ----------------------------- Report cards ------------------------------ */

export async function listReports({ termId, studentId } = {}) {
  if (!isDemoMode()) return (await remote()).listReports({ termId, studentId });
  const db = await loadDb();
  return (db.reports || []).filter(
    (r) => (!termId || r.termId === termId) && (!studentId || r.studentId === studentId)
  );
}

export async function getReport(id) {
  if (!isDemoMode()) return (await remote()).getReport(id);
  const db = await loadDb();
  return (db.reports || []).find((r) => r.id === id) || null;
}

/** Save draft edits. Only permitted while a report is editable. */
export async function saveReport(record) {
  if (!isDemoMode()) return (await remote()).saveReport(record);
  return mutate((db) => {
    db.reports = db.reports || [];
    if (record.id) {
      const index = db.reports.findIndex((r) => r.id === record.id);
      if (index >= 0) {
        db.reports[index] = { ...db.reports[index], ...record, updatedAt: new Date().toISOString() };
        return db.reports[index];
      }
    }
    const created = {
      ...record,
      id: record.id || newId('rpt'),
      createdAt: new Date().toISOString(),
    };
    db.reports.push(created);
    return created;
  });
}

export async function deleteReport(id) {
  if (!isDemoMode()) return (await remote()).deleteReport(id);
  return mutate((db) => {
    db.reports = (db.reports || []).filter((r) => r.id !== id);
    return true;
  });
}

/**
 * Move a report through its lifecycle, stamping who did it and when.
 *
 *   draft ──submit──▶ submitted ──verify──▶ verified ──publish──▶ published
 *     ▲                    │                     │
 *     └──────── return ────┴─────────────────────┘
 *
 * Publishing is what makes a report visible to the student and their parents.
 */
const TRANSITIONS = {
  submit: { from: ['draft', 'returned'], to: 'submitted', stamp: 'submittedAt' },
  return: { from: ['submitted', 'verified'], to: 'returned', stamp: 'returnedAt' },
  verify: { from: ['submitted'], to: 'verified', stamp: 'verifiedAt' },
  publish: { from: ['verified'], to: 'published', stamp: 'publishedAt' },
  unpublish: { from: ['published'], to: 'verified', stamp: 'unpublishedAt' },
};

export async function transitionReport(id, action, { actor, note } = {}) {
  if (!isDemoMode()) return (await remote()).transitionReport(id, action, { actor, note });
  const rule = TRANSITIONS[action];
  if (!rule) throw new Error(`Unknown report action: ${action}`);

  return mutate((db) => {
    const report = (db.reports || []).find((r) => r.id === id);
    if (!report) throw new Error('Report not found.');
    if (!rule.from.includes(report.status)) {
      throw new Error(
        `A report that is "${report.status}" cannot be ${action === 'return' ? 'returned' : `${action}ed`}.`
      );
    }
    const at = new Date().toISOString();
    report.status = rule.to;
    report[rule.stamp] = at;
    if (action === 'return') report.returnNote = note || '';
    report.history = [...(report.history || []), { at, by: actor || 'Unknown', action, note: note || '' }];
    return report;
  });
}

/** Reports a given user is allowed to see, filtered by their role. */
export async function listReportsForUser(user, { termId } = {}) {
  const all = await listReports({ termId });
  if (!user) return [];
  if (user.role === 'admin') return all;

  if (user.role === 'teacher') {
    const [classes, students] = await Promise.all([listClasses(), listStudents()]);
    const mine = classes.filter(
      (c) => c.teacherId === user.teacherId || (c.supervisorIds || []).includes(user.teacherId)
    );
    const ids = new Set(mine.map((c) => c.id));
    const studentIds = new Set(students.filter((s) => ids.has(s.classId)).map((s) => s.id));
    return all.filter((r) => studentIds.has(r.studentId));
  }

  // Families only ever see published reports, and only their own.
  const own = user.role === 'student' ? [user.studentId] : user.childIds || [];
  return all.filter((r) => own.includes(r.studentId) && r.status === 'published');
}

/* --------------------------- Student lookup ------------------------------ */

/** Find one student by the number staff actually type, e.g. OIS0001. */
export async function findStudentByNumber(number) {
  const wanted = String(number || '').trim().toUpperCase();
  if (!wanted) return null;
  const students = await listStudents();
  return students.find((s) => (s.studentNumber || '').toUpperCase() === wanted) || null;
}

/**
 * Everything the school holds on one pupil, gathered for the student-number
 * lookup: their class, their teacher, and their academic record.
 */
export async function getStudentDossier(studentId) {
  const [students, classes, teachers, grades, terms, reports, attendance] = await Promise.all([
    listStudents(),
    listClasses(),
    listTeachers(),
    listGrades(),
    listTerms(),
    listReports({ studentId }),
    listAttendance(),
  ]);

  const student = students.find((s) => s.id === studentId);
  if (!student) return null;

  const studentClass = classes.find((c) => c.id === student.classId) || null;
  const mine = attendance.filter((a) => a.studentId === studentId);
  const present = mine.filter((a) => a.status === 'present' || a.status === 'late').length;

  return {
    student,
    studentClass,
    teacher: studentClass ? teachers.find((t) => t.id === studentClass.teacherId) || null : null,
    grades: grades
      .filter((g) => g.studentId === studentId)
      .sort((a, b) => String(b.recordedAt || '').localeCompare(String(a.recordedAt || ''))),
    reports: reports
      .map((r) => ({ ...r, term: terms.find((t) => t.id === r.termId) || null }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    attendance: {
      total: mine.length,
      present,
      absent: mine.filter((a) => a.status === 'absent').length,
      late: mine.filter((a) => a.status === 'late').length,
      excused: mine.filter((a) => a.status === 'excused').length,
      rate: mine.length ? Math.round((present / mine.length) * 100) : null,
    },
  };
}

/* ------------------------- Public site helpers -------------------------- */

// Called from the public Apply page; must never throw the page off course.
export async function submitApplication(form) {
  const record = {
    studentName: `${form.firstName} ${form.lastName}`.trim(),
    ...form,
    status: 'new',
    submittedAt: new Date().toISOString(),
  };
  // The visitor submitting this is anonymous and cannot read applications back,
  // so insert without requesting the created row. Going through the generic
  // save() would ask for a representation and fail the staff-only read policy.
  if (!isDemoMode()) return (await remote()).insertOnly(COLLECTIONS.applications, record);
  return saveApplication(record);
}

// Called from the public Gallery page.
export async function listPublicGalleryItems() {
  try {
    const items = await listGalleryItems();
    return items.filter((item) => item.published !== false);
  } catch {
    return [];
  }
}

/* ------------------------------ Dashboard ------------------------------- */

export async function getDashboardStats() {
  const [students, teachers, classes, applications, events, announcements] = await Promise.all([
    listStudents(),
    listTeachers(),
    listClasses(),
    listApplications(),
    listEvents(),
    listAnnouncements(),
  ]);
  const todayKey = new Date().toISOString().slice(0, 10);
  return {
    studentCount: students.length,
    teacherCount: teachers.length,
    classCount: classes.length,
    newApplications: applications.filter((a) => a.status === 'new').length,
    totalApplications: applications.length,
    upcomingEvents: events.filter((e) => (e.endDate || e.date) >= todayKey).length,
    announcements: announcements.slice(0, 5),
  };
}

export { resetDemoData };
