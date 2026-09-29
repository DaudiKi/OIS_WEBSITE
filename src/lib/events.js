import { csvToObjects } from './csv.js';

// The public school calendar merges two sources:
//  1. The official CSV published with the site (public/ois_august_calendar.csv)
//  2. Events created in the AMS (stored in the AMS database), so that events
//     added by school staff show up on the public calendar immediately.

export const AMS_DB_KEY = 'ois.ams.db.v1';

function formatTime(time) {
  if (!time) return '';
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr ?? 0);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return 'All day';
  if (startTime === '00:00' && (endTime === '23:59' || !endTime)) return 'All day';
  if (!endTime) return formatTime(startTime);
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function categorizeEvent(title) {
  const t = title.toLowerCase();
  if (t.includes('exam') || t.includes('assessment') || t.includes('test')) return 'exam';
  if (t.includes('holiday') || t.includes('closed') || t.includes('no school')) return 'holiday';
  if (t.includes('parent') || t.includes('seminar') || t.includes('open day')) return 'parents';
  if (t.includes('sport') || t.includes('house') || t.includes('game')) return 'sports';
  return 'school';
}

let csvCache = null;

export async function fetchCsvEvents() {
  if (csvCache) return csvCache;
  try {
    const response = await fetch('ois_august_calendar.csv');
    if (!response.ok) return [];
    const text = await response.text();
    csvCache = csvToObjects(text).map((row, index) => ({
      id: `csv-${index}`,
      title: row['Subject'],
      date: row['Start Date'],
      endDate: row['End Date'] || row['Start Date'],
      time: formatTimeRange(row['Start Time'], row['End Time']),
      startTime: row['Start Time'],
      endTime: row['End Time'],
      description: row['Description'],
      location: row['Location'],
      category: categorizeEvent(row['Subject'] || ''),
      source: 'official',
    }));
    return csvCache;
  } catch {
    return [];
  }
}

export function readAmsEvents() {
  try {
    const db = JSON.parse(localStorage.getItem(AMS_DB_KEY) || 'null');
    if (!db || !Array.isArray(db.events)) return [];
    return db.events
      .filter((event) => event.published !== false)
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        endDate: event.endDate || event.date,
        time: formatTimeRange(event.startTime, event.endTime),
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description || '',
        location: event.location || '',
        category: event.category || categorizeEvent(event.title || ''),
        source: 'ams',
      }));
  } catch {
    return [];
  }
}

export async function fetchSchoolEvents() {
  const [csvEvents, amsEvents] = [await fetchCsvEvents(), readAmsEvents()];
  const merged = [...csvEvents];
  amsEvents.forEach((event) => {
    const duplicate = merged.some((e) => e.title === event.title && e.date === event.date);
    if (!duplicate) merged.push(event);
  });
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

export async function listUpcomingEvents(limit = 4) {
  const events = await fetchSchoolEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter((event) => new Date(`${event.endDate || event.date}T23:59:59`) >= today);
  const source = upcoming.length > 0 ? upcoming : events;
  return source.slice(0, limit);
}
