// Local (browser) database for the AMS. Acts as the default backend so the
// AMS is fully functional on static hosting with no server. A Supabase
// backend can be plugged in via public/ams-config.js without code changes.

import { AMS_DB_KEY } from '../../lib/events.js';
import { DEFAULT_GRADE_SCALE, DEFAULT_SUBJECTS } from './icce.js';

const SESSION_KEY = 'ois.ams.session.v1';
// Bumped to 2 when ICCE report cards, terms and settings were added; a lower
// stored version is reseeded so demo browsers pick up the new collections.
const DB_VERSION = 2;

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function hashPassword(password) {
  const data = new TextEncoder().encode(`ois-ams::${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Non-secure-context fallback (demo mode only)
  let hash = 0;
  for (const byte of data) hash = (hash * 31 + byte) | 0;
  return `fallback-${hash}`;
}

// Pre-computed SHA-256 hashes for the demo accounts (of "ois-ams::<password>")
// are generated at seed time instead, so seeding is async.

async function buildSeed() {
  const now = new Date().toISOString();

  const teachers = [
    { id: 'tch-1', name: 'Joshua Kisitu', email: 'j.kisitu@ois.ug', phone: '+256700000001', subject: 'Mathematics', role: 'Principal' },
    { id: 'tch-2', name: 'Herriet Makumbi', email: 'h.makumbi@ois.ug', phone: '+256700000002', subject: 'Bible Studies', role: 'Director' },
    { id: 'tch-3', name: 'Agnes Namutebi', email: 'a.namutebi@ois.ug', phone: '+256700000003', subject: 'English', role: 'Supervisor' },
    { id: 'tch-4', name: 'Peter Ssemakula', email: 'p.ssemakula@ois.ug', phone: '+256700000004', subject: 'Science', role: 'Monitor' },
  ];

  // A class may be supervised by more than one person (the sample report card
  // is signed "Ms. Nabbe Doreen & Mr. Isaac Muyimbwa"), so supervisorIds is a
  // list. teacherId is kept as the primary supervisor for older screens.
  const classes = [
    { id: 'cls-1', name: 'Play Group', level: 'Play Group', teacherId: 'tch-3', supervisorIds: ['tch-3'], room: 'Room 1' },
    { id: 'cls-2', name: 'Pre-School', level: 'Pre-School', teacherId: 'tch-3', supervisorIds: ['tch-3'], room: 'Room 2' },
    { id: 'cls-3', name: 'Grade 1', level: 'Elementary', teacherId: 'tch-4', supervisorIds: ['tch-4'], room: 'Room 3' },
    { id: 'cls-4', name: 'Grade 5', level: 'Elementary', teacherId: 'tch-1', supervisorIds: ['tch-1', 'tch-3'], room: 'Room 4' },
    { id: 'cls-5', name: 'Grade 9', level: 'High School', teacherId: 'tch-1', supervisorIds: ['tch-1', 'tch-4'], room: 'Learning Center A' },
  ];

  const students = [
    { id: 'std-1', studentNumber: 'OIS0001', firstName: 'Anna', lastName: 'Nakato', gender: 'Female', dob: '2019-03-14', classId: 'cls-2', parentName: 'Sarah Nakimuli', parentPhone: '+256701111111', parentEmail: 'sarah@example.com', status: 'active', photo: '', icceLevel: '', admittedAt: now },
    { id: 'std-2', studentNumber: 'OIS0002', firstName: 'Brian', lastName: 'Okello', gender: 'Male', dob: '2018-07-02', classId: 'cls-3', parentName: 'James Okello', parentPhone: '+256702222222', parentEmail: 'james@example.com', status: 'active', photo: '', icceLevel: '', admittedAt: now },
    { id: 'std-3', studentNumber: 'OIS0003', firstName: 'Cathy', lastName: 'Namuli', gender: 'Female', dob: '2014-01-25', classId: 'cls-4', parentName: 'Grace Namugwanya', parentPhone: '+256703333333', parentEmail: 'grace@example.com', status: 'active', photo: '', icceLevel: '', admittedAt: now },
    { id: 'std-4', studentNumber: 'OIS0004', firstName: 'David', lastName: 'Kizito', gender: 'Male', dob: '2010-11-09', classId: 'cls-5', parentName: 'Michael Kizito', parentPhone: '+256704444444', parentEmail: 'michael@example.com', status: 'active', photo: '', icceLevel: 'General', admittedAt: now },
    { id: 'std-5', studentNumber: 'OIS0005', firstName: 'Esther', lastName: 'Namatovu', gender: 'Female', dob: '2010-05-19', classId: 'cls-5', parentName: 'Ruth Namatovu', parentPhone: '+256705555555', parentEmail: 'ruth@example.com', status: 'active', photo: '', icceLevel: 'General', admittedAt: now },
    { id: 'std-6', studentNumber: 'OIS0006', firstName: 'Frank', lastName: 'Mugisha', gender: 'Male', dob: '2014-09-30', classId: 'cls-4', parentName: 'Paul Mugisha', parentPhone: '+256706666666', parentEmail: 'paul@example.com', status: 'active', photo: '', icceLevel: '', admittedAt: now },
  ];

  const grades = [
    { id: 'grd-1', studentId: 'std-3', subject: 'Mathematics', term: 'Term 2 2025', score: 88, maxScore: 100, comment: 'Excellent progress', recordedAt: now },
    { id: 'grd-2', studentId: 'std-3', subject: 'English', term: 'Term 2 2025', score: 76, maxScore: 100, comment: 'Good, keep reading', recordedAt: now },
    { id: 'grd-3', studentId: 'std-4', subject: 'Science', term: 'Term 2 2025', score: 91, maxScore: 100, comment: 'Outstanding', recordedAt: now },
    { id: 'grd-4', studentId: 'std-5', subject: 'Mathematics', term: 'Term 2 2025', score: 69, maxScore: 100, comment: 'Improving steadily', recordedAt: now },
  ];

  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const attendance = [
    { id: 'att-1', studentId: 'std-3', classId: 'cls-4', date: dateKey, status: 'present' },
    { id: 'att-2', studentId: 'std-6', classId: 'cls-4', date: dateKey, status: 'absent' },
  ];

  const announcements = [
    {
      id: 'ann-1',
      title: 'Welcome back to Term 2',
      body: 'All students report back in full uniform. Classes begin at 8:00 AM sharp.',
      audience: 'all',
      createdAt: now,
      author: 'Administration',
    },
    {
      id: 'ann-2',
      title: 'School Photo Day',
      body: 'Professional school photos will be taken on 28 August. All students must wear complete formal school uniform.',
      audience: 'all',
      createdAt: now,
      author: 'Administration',
    },
  ];

  const events = [
    {
      id: 'evt-1',
      title: 'Staff Planning Meeting',
      date: dateKey,
      endDate: dateKey,
      startTime: '16:00',
      endTime: '17:30',
      location: 'Staff Room',
      description: 'Weekly staff planning and coordination meeting.',
      category: 'school',
      published: false,
      createdAt: now,
    },
  ];

  const users = [
    {
      id: 'usr-admin',
      name: 'OIS Administrator',
      email: 'admin@ois.ug',
      role: 'admin',
      status: 'active',
      passwordHash: await hashPassword('admin123'),
      createdAt: now,
    },
    {
      id: 'usr-teacher',
      name: 'Joshua Kisitu',
      email: 'j.kisitu@ois.ug',
      role: 'teacher',
      status: 'active',
      teacherId: 'tch-1',
      passwordHash: await hashPassword('teacher123'),
      createdAt: now,
    },
    {
      id: 'usr-parent',
      name: 'Michael Kizito',
      email: 'parent@ois.ug',
      role: 'parent',
      status: 'active',
      childIds: ['std-4'],
      passwordHash: await hashPassword('parent123'),
      createdAt: now,
    },
    {
      id: 'usr-student',
      name: 'David Kizito',
      email: 'student@ois.ug',
      role: 'student',
      status: 'active',
      studentId: 'std-4',
      passwordHash: await hashPassword('student123'),
      createdAt: now,
    },
  ];

  const year = new Date().getFullYear();
  const terms = [
    { id: 'trm-1', name: 'Term One', number: 1, year, startDate: `${year}-02-03`, endDate: `${year}-05-02`, status: 'closed' },
    { id: 'trm-2', name: 'Term Two', number: 2, year, startDate: `${year}-05-26`, endDate: `${year}-08-29`, status: 'open' },
    { id: 'trm-3', name: 'Term Three', number: 3, year, startDate: `${year}-09-15`, endDate: `${year}-12-05`, status: 'planned' },
  ];

  const settings = {
    school: {
      name: 'OrchardsWood International School',
      address: 'Wavamunno Rd., Kampala, Uganda',
      email: 'orchardswoodis@gmail.com',
      phone: '+256 780394344',
      website: 'www.ois.ug',
      motto: 'Equipping this generation for Life',
    },
    gradeScale: DEFAULT_GRADE_SCALE.map((band) => ({ ...band })),
    subjects: [...DEFAULT_SUBJECTS],
    traitFooter:
      "This progress report for the student's academic, social, and personal skills reflects a " +
      'joint evaluation by the teachers throughout the school term. Please note that each student ' +
      'matures at their own rate and ability. The school staff has endeavored to produce a report ' +
      'that reflects markers of progress by the students. If you have any questions, please ' +
      'contact the school office.',
  };

  // One fully worked report (published) and one mid-term draft, so every role
  // has something realistic to look at in demo mode.
  const fullTraits = {
    'Follows directions': 4, 'Works well independently': 4, 'Does not disturb others': 4,
    'Take care of materials': 3, 'Completes work required': 4, 'Achieve computer assignments': 3,
    'Is courteous': 4, 'Gets along well with others': 4, 'Exhibits self-control': 4,
    'Shows respect for others': 4, 'Responds well to correction': 3, 'Promotes school spirit': 4,
    'Ability to establish own goals': 4, 'Successfully reaches goals': 4, 'Display flexibility': 3,
    'Shows creativity': 4, 'General overall progress': 4, 'Attitude towards computer learning': 3,
  };

  const reports = [
    {
      id: 'rpt-1',
      studentId: 'std-4',
      termId: 'trm-2',
      status: 'published',
      subjects: [
        { name: 'Maths', scores: [92.7, 95.5, 94, 96.5] },
        { name: 'English', scores: [95.5, 99, 98, 92] },
        { name: 'Science', scores: [97.5, 94, 97.5, 92.5] },
        { name: 'Social Studies', scores: [97.5, 100, 92.5, 100] },
        { name: 'Word Building', scores: [99.5, 98.5, 100] },
        { name: 'Basic Literature 9', scores: [100] },
        { name: 'SA Science', scores: [97, 100] },
      ],
      traits: fullTraits,
      bibleMemory: ['Isaiah 58:8-12', 'Proverbs 3:1-12', 'Psalms 121:1-8'],
      comments:
        'David shows responsibility for his learning. He also follows instructions whenever they are given.',
      attendance: { present: 58, absent: 2, late: 1 },
      submittedAt: now,
      verifiedAt: now,
      publishedAt: now,
      submittedBy: 'tch-1',
      verifiedBy: 'usr-admin',
      history: [
        { at: now, by: 'Joshua Kisitu', action: 'submitted', note: '' },
        { at: now, by: 'OIS Administrator', action: 'verified', note: '' },
        { at: now, by: 'OIS Administrator', action: 'published', note: '' },
      ],
      createdAt: now,
    },
    {
      id: 'rpt-2',
      studentId: 'std-5',
      termId: 'trm-2',
      status: 'draft',
      subjects: [
        { name: 'Maths', scores: [88, 91.5] },
        { name: 'English', scores: [94, 90] },
        { name: 'Science', scores: [86.5] },
        { name: 'Social Studies', scores: [92] },
        { name: 'Word Building', scores: [95, 97] },
        { name: 'Literature', scores: [] },
        { name: 'Bible Reading', scores: [] },
      ],
      traits: {},
      bibleMemory: ['', '', ''],
      comments: '',
      attendance: { present: 55, absent: 5, late: 2 },
      history: [],
      createdAt: now,
    },
  ];

  return {
    version: DB_VERSION,
    seededAt: now,
    users,
    teachers,
    classes,
    students,
    grades,
    attendance,
    announcements,
    events,
    applications: [],
    galleryItems: [],
    terms,
    reports,
    settings,
  };
}

let dbCache = null;
let seedPromise = null;

export async function loadDb() {
  if (dbCache) return dbCache;
  try {
    const raw = localStorage.getItem(AMS_DB_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      // Databases seeded before report cards existed are missing collections.
      // Reseed rather than half-migrate, since this is demo data only.
      if ((stored.version || 1) >= DB_VERSION) {
        dbCache = stored;
        return dbCache;
      }
    }
  } catch {
    // fall through to reseed
  }
  if (!seedPromise) {
    seedPromise = buildSeed().then((seed) => {
      dbCache = seed;
      persist();
      return dbCache;
    });
  }
  return seedPromise;
}

export function persist() {
  if (!dbCache) return;
  try {
    localStorage.setItem(AMS_DB_KEY, JSON.stringify(dbCache));
  } catch {
    // Storage may be unavailable (private mode); the app keeps working in memory.
  }
}

export async function mutate(fn) {
  const db = await loadDb();
  const result = fn(db);
  persist();
  return result;
}

export function newId(prefix) {
  return uid(prefix);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function resetDemoData() {
  localStorage.removeItem(AMS_DB_KEY);
  dbCache = null;
  seedPromise = null;
  return loadDb();
}
