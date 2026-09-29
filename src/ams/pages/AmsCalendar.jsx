import { useEffect, useState } from 'react';
import { listEvents, saveEvent, deleteEvent } from '../data/api.js';
import { fetchCsvEvents, formatTimeRange } from '../../lib/events.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const EMPTY_EVENT = {
  title: '',
  date: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
  category: 'school',
  published: true,
};

const CATEGORIES = [
  { value: 'school', label: 'School Activity' },
  { value: 'exam', label: 'Exam / Assessment' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'parents', label: 'Parents & Community' },
  { value: 'sports', label: 'Sports & Houses' },
];

export default function AmsCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [official, setOfficial] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const refresh = () => listEvents().then((rows) => setEvents(rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''))));

  useEffect(() => {
    refresh();
    fetchCsvEvents().then(setOfficial);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveEvent({ ...editing, endDate: editing.endDate || editing.date });
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event) => {
    if (!window.confirm(`Delete event "${event.title}"?`)) return;
    await deleteEvent(event.id);
    refresh();
  };

  const togglePublish = async (event) => {
    await saveEvent({ ...event, published: event.published === false });
    refresh();
  };

  if (!events) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-xl">
          Events created here appear on the public website calendar when published. The official term calendar
          (imported from the school CSV) is shown below for reference.
        </p>
        {canEdit && (
          <button className="ams-btn-primary flex-shrink-0" onClick={() => setEditing({ ...EMPTY_EVENT })}>
            + Add Event
          </button>
        )}
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {events.length === 0 ? (
          <EmptyState message="No AMS events yet. Add your first event." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Time</th>
                <th>Location</th>
                <th>Visibility</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap">
                    {event.date}
                    {event.endDate && event.endDate !== event.date && <span className="text-gray-400"> → {event.endDate}</span>}
                  </td>
                  <td>
                    <span className="font-semibold text-gray-800">{event.title}</span>
                    {event.description && <span className="block text-xs text-gray-400 max-w-[280px] truncate">{event.description}</span>}
                  </td>
                  <td className="whitespace-nowrap">{formatTimeRange(event.startTime, event.endTime)}</td>
                  <td>{event.location || '—'}</td>
                  <td>
                    <button
                      onClick={() => canEdit && togglePublish(event)}
                      className={`ams-badge ${event.published !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                      title={canEdit ? 'Click to toggle' : undefined}
                    >
                      {event.published !== false ? 'Public' : 'Internal'}
                    </button>
                  </td>
                  {canEdit && (
                    <td className="whitespace-nowrap">
                      <button className="text-ois-blue text-sm font-semibold hover:underline mr-3" onClick={() => setEditing({ ...event })}>
                        Edit
                      </button>
                      <button className="ams-btn-danger" onClick={() => remove(event)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ams-card">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Official Term Calendar (read-only)</h3>
        {official.length === 0 ? (
          <p className="text-gray-400 text-sm">The official calendar could not be loaded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {official.map((event) => (
              <li key={event.id} className="py-2.5 flex items-start gap-4">
                <span className="text-sm font-semibold text-ois-blue whitespace-nowrap w-24 flex-shrink-0">{event.date}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-400">
                    {event.time}
                    {event.location ? ` • ${event.location}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Event' : 'Add Event'} onClose={() => setEditing(null)} wide>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="ams-label">Event Title</label>
              <input required className="ams-input" value={editing.title} onChange={set('title')} />
            </div>
            <div>
              <label className="ams-label">Start Date</label>
              <input required type="date" className="ams-input" value={editing.date} onChange={set('date')} />
            </div>
            <div>
              <label className="ams-label">End Date (optional)</label>
              <input type="date" className="ams-input" value={editing.endDate} onChange={set('endDate')} />
            </div>
            <div>
              <label className="ams-label">Start Time</label>
              <input type="time" className="ams-input" value={editing.startTime} onChange={set('startTime')} />
            </div>
            <div>
              <label className="ams-label">End Time</label>
              <input type="time" className="ams-input" value={editing.endTime} onChange={set('endTime')} />
            </div>
            <div>
              <label className="ams-label">Category</label>
              <select className="ams-input" value={editing.category} onChange={set('category')}>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ams-label">Location</label>
              <input className="ams-input" value={editing.location} onChange={set('location')} />
            </div>
            <div className="sm:col-span-2">
              <label className="ams-label">Description</label>
              <textarea className="ams-input" rows="3" value={editing.description} onChange={set('description')} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={editing.published !== false}
                onChange={(e) => setEditing((prev) => ({ ...prev, published: e.target.checked }))}
              />
              <label htmlFor="published" className="text-sm text-gray-600">
                Show on the public website calendar
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
