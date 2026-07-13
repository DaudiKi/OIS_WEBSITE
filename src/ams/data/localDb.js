// Local (browser) database for the AMS. Acts as the default backend so the
// AMS is fully functional on static hosting with no server. A Supabase
// backend can be plugged in via public/ams-config.js without code changes.

import { AMS_DB_KEY } from '../../lib/events.js';

const SESSION_KEY = 'ois.ams.session.v1';
const DB_VERSION = 1;

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

  const classes = [
    { id: 'cls-1', name: 'Play Group', level: 'Play Group', teacherId: 'tch-3', room: 'Room 1' },
    { id: 'cls-2', name: 'Pre-School', level: 'Pre-School', teacherId: 'tch-3', room: 'Room 2' },
    { id: 'cls-3', name: 'Grade 1', level: 'Elementary', teacherId: 'tch-4', room: 'Room 3' },
    { id: 'cls-4', name: 'Grade 5', level: 'Elementary', teacherId: 'tch-1', room: 'Room 4' },
    { id: 'cls-5', name: 'Grade 9', level: 'High School', teacherId: 'tch-1', room: 'Learning Center A' },
  ];

  const students = [
    { id: 'std-1', firstName: 'Anna', lastName: 'Nakato', gender: 'Female', dob: '2019-03-14', classId: 'cls-2', parentName: 'Sarah Nakimuli', parentPhone: '+256701111111', parentEmail: 'sarah@example.com', status: 'active', admittedAt: now },
    { id: 'std-2', firstName: 'Brian', lastName: 'Okello', gender: 'Male', dob: '2018-07-02', classId: 'cls-3', parentName: 'James Okello', parentPhone: '+256702222222', parentEmail: 'james@example.com', status: 'active', admittedAt: now },
    { id: 'std-3', firstName: 'Cathy', lastName: 'Namuli', gender: 'Female', dob: '2014-01-25', classId: 'cls-4', parentName: 'Grace Namugwanya', parentPhone: '+256703333333', parentEmail: 'grace@example.com', status: 'active', admittedAt: now },
    { id: 'std-4', firstName: 'David', lastName: 'Kizito', gender: 'Male', dob: '2010-11-09', classId: 'cls-5', parentName: 'Michael Kizito', parentPhone: '+256704444444', parentEmail: 'michael@example.com', status: 'active', admittedAt: now },
    { id: 'std-5', firstName: 'Esther', lastName: 'Namatovu', gender: 'Female', dob: '2010-05-19', classId: 'cls-5', parentName: 'Ruth Namatovu', parentPhone: '+256705555555', parentEmail: 'ruth@example.com', status: 'active', admittedAt: now },
    { id: 'std-6', firstName: 'Frank', lastName: 'Mugisha', gender: 'Male', dob: '2014-09-30', classId: 'cls-4', parentName: 'Paul Mugisha', parentPhone: '+256706666666', parentEmail: 'paul@example.com', status: 'active', admittedAt: now },
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
  };
}

let dbCache = null;
let seedPromise = null;

export async function loadDb() {
  if (dbCache) return dbCache;
  try {
    const raw = localStorage.getItem(AMS_DB_KEY);
    if (raw) {
      dbCache = JSON.parse(raw);
      return dbCache;
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
