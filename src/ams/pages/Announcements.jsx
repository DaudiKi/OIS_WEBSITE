import { useEffect, useState } from 'react';
import { listAnnouncements, saveAnnouncement, deleteAnnouncement } from '../data/api.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const EMPTY_ANNOUNCEMENT = { title: '', body: '', audience: 'all' };

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const refresh = () =>
    listAnnouncements().then((rows) =>
      setAnnouncements(rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
    );
  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveAnnouncement({ ...editing, author: editing.author || user?.name || 'Administration' });
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (announcement) => {
    if (!window.confirm('Delete this announcement?')) return;
    await deleteAnnouncement(announcement.id);
    refresh();
  };

  if (!announcements) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
          <button className="ams-btn-primary" onClick={() => setEditing({ ...EMPTY_ANNOUNCEMENT })}>
            + New Announcement
          </button>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="ams-card">
          <EmptyState message="No announcements yet." />
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="ams-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{announcement.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {announcement.author} • {new Date(announcement.createdAt).toLocaleString()} •{' '}
                    <span className="capitalize">{announcement.audience === 'all' ? 'Everyone' : announcement.audience}</span>
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-3 flex-shrink-0">
                    <button className="text-ois-blue text-sm font-semibold hover:underline" onClick={() => setEditing({ ...announcement })}>
                      Edit
                    </button>
                    <button className="ams-btn-danger" onClick={() => remove(announcement)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mt-3 whitespace-pre-line">{announcement.body}</p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit Announcement' : 'New Announcement'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label">Title</label>
              <input required className="ams-input" value={editing.title} onChange={set('title')} />
            </div>
            <div>
              <label className="ams-label">Message</label>
              <textarea required className="ams-input" rows="5" value={editing.body} onChange={set('body')} />
            </div>
            <div>
              <label className="ams-label">Audience</label>
              <select className="ams-input" value={editing.audience} onChange={set('audience')}>
                <option value="all">Everyone</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
                <option value="students">Students</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
