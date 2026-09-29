import { useEffect, useMemo, useState } from 'react';
import { listClasses, saveClass, deleteClass, listTeachers, listStudents } from '../data/api.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const EMPTY_CLASS = { name: '', level: '', teacherId: '', room: '' };
const LEVELS = ['Play Group', 'Pre-School', 'Elementary', 'High School'];

export default function Classes() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin';

  const refresh = () => {
    Promise.all([listClasses(), listTeachers(), listStudents()]).then(([classRows, teacherRows, studentRows]) => {
      setClasses(classRows);
      setTeachers(teacherRows);
      setStudents(studentRows);
    });
  };
  useEffect(refresh, []);

  const teacherNames = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t.name])), [teachers]);
  const classCounts = useMemo(() => {
    const counts = {};
    students.forEach((student) => {
      if (student.classId) counts[student.classId] = (counts[student.classId] || 0) + 1;
    });
    return counts;
  }, [students]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveClass(editing);
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cls) => {
    if (!window.confirm(`Delete class ${cls.name}? Students will become unassigned.`)) return;
    await deleteClass(cls.id);
    refresh();
  };

  if (!classes) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <button className="ams-btn-primary" onClick={() => setEditing({ ...EMPTY_CLASS })}>
            + Add Class
          </button>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="ams-card">
          <EmptyState message="No classes created yet." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="ams-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.level}</p>
                </div>
                <span className="ams-badge bg-blue-100 text-blue-700">{classCounts[cls.id] || 0} students</span>
              </div>
              <dl className="mt-4 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Class teacher</dt>
                  <dd className="font-medium">{teacherNames[cls.teacherId] || 'Unassigned'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Room</dt>
                  <dd className="font-medium">{cls.room || '—'}</dd>
                </div>
              </dl>
              {isAdmin && (
                <div className="mt-4 flex gap-3">
                  <button className="text-ois-blue text-sm font-semibold hover:underline" onClick={() => setEditing({ ...cls })}>
                    Edit
                  </button>
                  <button className="ams-btn-danger" onClick={() => remove(cls)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit Class' : 'Add Class'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label">Class Name</label>
              <input required className="ams-input" value={editing.name} onChange={set('name')} placeholder="e.g. Grade 3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ams-label">Level</label>
                <select className="ams-input" value={editing.level} onChange={set('level')}>
                  <option value="">Select…</option>
                  {LEVELS.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ams-label">Room</label>
                <input className="ams-input" value={editing.room} onChange={set('room')} />
              </div>
            </div>
            <div>
              <label className="ams-label">Class Teacher</label>
              <select className="ams-input" value={editing.teacherId} onChange={set('teacherId')}>
                <option value="">Unassigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Class'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
