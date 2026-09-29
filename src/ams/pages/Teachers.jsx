import { useEffect, useState } from 'react';
import { listTeachers, saveTeacher, deleteTeacher } from '../data/api.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';

const EMPTY_TEACHER = { name: '', email: '', phone: '', subject: '', role: '' };

export default function Teachers() {
  const [teachers, setTeachers] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => listTeachers().then(setTeachers);
  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveTeacher(editing);
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (teacher) => {
    if (!window.confirm(`Remove ${teacher.name} from the staff register?`)) return;
    await deleteTeacher(teacher.id);
    refresh();
  };

  if (!teachers) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="ams-btn-primary" onClick={() => setEditing({ ...EMPTY_TEACHER })}>
          + Add Teacher
        </button>
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {teachers.length === 0 ? (
          <EmptyState message="No teachers registered yet." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="font-semibold text-gray-800">{teacher.name}</td>
                  <td>{teacher.subject || '—'}</td>
                  <td>{teacher.role || '—'}</td>
                  <td>{teacher.email || '—'}</td>
                  <td>{teacher.phone || '—'}</td>
                  <td className="whitespace-nowrap">
                    <button className="text-ois-blue text-sm font-semibold hover:underline mr-3" onClick={() => setEditing({ ...teacher })}>
                      Edit
                    </button>
                    <button className="ams-btn-danger" onClick={() => remove(teacher)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Teacher' : 'Add Teacher'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label">Full Name</label>
              <input required className="ams-input" value={editing.name} onChange={set('name')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ams-label">Subject</label>
                <input className="ams-input" value={editing.subject} onChange={set('subject')} />
              </div>
              <div>
                <label className="ams-label">Role</label>
                <input className="ams-input" value={editing.role} onChange={set('role')} placeholder="e.g. Supervisor" />
              </div>
              <div>
                <label className="ams-label">Email</label>
                <input type="email" className="ams-input" value={editing.email} onChange={set('email')} />
              </div>
              <div>
                <label className="ams-label">Phone</label>
                <input className="ams-input" value={editing.phone} onChange={set('phone')} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Teacher'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
