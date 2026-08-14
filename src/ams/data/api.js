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

export async function signIn(email, password) {
  if (!isDemoMode()) return (await remote()).signIn(email, password);
  const db = await loadDb();
  const passwordHash = await hashPassword(password);
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== passwordHash) {
    throw new Error('Invalid email or password.');
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

export async function signUp({ name, email, password, role, phone }) {
  if (!isDemoMode()) return (await remote()).signUp({ name, email, password, role, phone });
  const db = await loadDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const needsApproval = role === 'teacher' || role === 'admin';
  const user = {
    id: newId('usr'),
    name,
    email,
    phone: phone || '',
    role,
    status: needsApproval ? 'pending' : 'active',
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await mutate((data) => data.users.push(user));
  if (!needsApproval) {
    setSession({ userId: user.id, signedInAt: new Date().toISOString() });
  }
  return { user: sanitizeUser(user), needsApproval };
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
  const { passwordHash, ...rest } = user;
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

/* ------------------------- Public site helpers -------------------------- */

// Called from the public Apply page; must never throw the page off course.
export async function submitApplication(form) {
  const record = {
    studentName: `${form.firstName} ${form.lastName}`.trim(),
    ...form,
    status: 'new',
    submittedAt: new Date().toISOString(),
  };
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
