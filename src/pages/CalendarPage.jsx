import { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { fetchSchoolEvents } from '../lib/events.js';

const GOOGLE_EMBED_SRC =
  'https://calendar.google.com/calendar/embed?src=7eb5a9b638028ced87f52d91048bc2a9bac6b47ee2d3191cb8e2647f3e1077d4%40group.calendar.google.com&ctz=Africa%2FNairobi';

const CATEGORY_COLORS = {
  exam: '#ef4444',
  holiday: '#f59e0b',
  parents: '#8b5cf6',
  sports: '#63b647',
  school: '#2c64ac',
};

const CATEGORY_LABELS = {
  exam: 'Exams & Assessments',
  holiday: 'Holidays',
  parents: 'Parents & Community',
  sports: 'Sports & Houses',
  school: 'School Activities',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function eventCoversDay(event, dayKey) {
  const start = event.date;
  const end = event.endDate || event.date;
  return dayKey >= start && dayKey <= end;
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(year, month, 1 - startOffset + i);
    cells.push(date);
  }
  return cells;
}

function MonthCalendar({ events, onSelectDay, selectedDay }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const todayKey = toKey(new Date());
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const changeMonth = (delta) => {
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 w-full">
        <button
          onClick={() => changeMonth(-1)}
          className="px-4 py-2 rounded-lg bg-ois-blue text-white hover:bg-ois-light-blue transition-colors"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="text-xl md:text-2xl font-bold text-ois-blue">{monthLabel}</h3>
        <button
          onClick={() => changeMonth(1)}
          className="px-4 py-2 rounded-lg bg-ois-blue text-white hover:bg-ois-light-blue transition-colors"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="cal-grid mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((date) => {
          const key = toKey(date);
          const outside = date.getMonth() !== cursor.month;
          const dayEvents = events.filter((event) => eventCoversDay(event, key));
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              className={`cal-cell${outside ? ' outside' : ''}${key === todayKey ? ' today' : ''}${
                key === selectedDay ? ' selected' : ''
              }`}
            >
              <span className="text-xs md:text-sm font-semibold text-gray-700">{date.getDate()}</span>
              <span className="flex gap-0.5 flex-wrap">
                {dayEvents.slice(0, 3).map((event) => (
                  <span key={event.id} className="cal-dot" style={{ background: CATEGORY_COLORS[event.category] || '#2c64ac' }}></span>
                ))}
              </span>
              {dayEvents.slice(0, 3).map((event) => (
                <span
                  key={event.id}
                  className="cal-event-chip"
                  style={{ background: CATEGORY_COLORS[event.category] || '#2c64ac' }}
                  title={event.title}
                >
                  {event.title}
                </span>
              ))}
              {dayEvents.length > 3 && (
                <span className="cal-event-chip" style={{ background: '#94a3b8' }}>
                  +{dayEvents.length - 3} more
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-6 justify-center">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: CATEGORY_COLORS[key] }}></span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EventList({ events, selectedDay, onClearDay }) {
  const todayKey = toKey(new Date());
  const shown = selectedDay
    ? events.filter((event) => eventCoversDay(event, selectedDay))
    : events.filter((event) => (event.endDate || event.date) >= todayKey).slice(0, 8);

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-ois-blue">
          {selectedDay
            ? `Events on ${new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}`
            : 'Upcoming Events'}
        </h3>
        {selectedDay && (
          <button onClick={onClearDay} className="text-sm text-ois-blue hover:underline">
            Show upcoming
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No events scheduled for this day.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((event) => {
            const start = new Date(`${event.date}T00:00:00`);
            return (
              <li key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="flex-shrink-0 text-white rounded-lg p-2 text-center w-14"
                  style={{ background: CATEGORY_COLORS[event.category] || '#2c64ac' }}
                >
                  <span className="block text-lg font-bold">{start.getDate()}</span>
                  <span className="block text-xs">{start.toLocaleString('en-US', { month: 'short' })}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800">{event.title}</h4>
                  <p className="text-sm text-gray-500">
                    {event.time}
                    {event.location ? ` • ${event.location}` : ''}
                  </p>
                  {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [tab, setTab] = useState('interactive');
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSchoolEvents().then((all) => {
      if (!cancelled) setEvents(all);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <TopBar />
      <Header active="calendar" />

      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-title">OIS School Calendar</div>
        <div className="calendar-desc">
          Stay up to date with all school events, holidays, and important dates. This calendar is updated in real time
          from our official OrchardsWood Google Calendar.
        </div>
        <div className="flex justify-center gap-3 pb-4">
          <button
            className={`cal-tab px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase bg-white/90 text-gray-700${
              tab === 'interactive' ? ' active' : ''
            }`}
            onClick={() => setTab('interactive')}
          >
            School Events
          </button>
          <button
            className={`cal-tab px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase bg-white/90 text-gray-700${
              tab === 'google' ? ' active' : ''
            }`}
            onClick={() => setTab('google')}
          >
            Google Calendar
          </button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="calendar-container">
        {tab === 'interactive' ? (
          <>
            <MonthCalendar events={events} onSelectDay={setSelectedDay} selectedDay={selectedDay} />
            <EventList events={events} selectedDay={selectedDay} onClearDay={() => setSelectedDay(null)} />
          </>
        ) : (
          <iframe
            title="OrchardsWood Google Calendar"
            className="calendar-embed"
            src={GOOGLE_EMBED_SRC}
            frameBorder="0"
            scrolling="no"
          ></iframe>
        )}
      </div>

      <Footer />
    </div>
  );
}
