import { useEffect, useMemo, useState } from 'react';
import { listStudents, saveStudent, deleteStudent, listClasses } from '../data/api.js';
import { Modal, EmptyState, Badge, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const EMPTY_STUDENT = {
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  classId: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  status: 'active',
};

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const refresh = () => {
    Promise.all([listStudents(), listClasses()]).then(([studentRows, classRows]) => {
      setStudents(studentRows);
      setClasses(classRows);
    });
  };

  useEffect(refresh, []);

  const classNames = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes]);

  const filtered = useMemo(() => {
    if (!students) return [];
    return students.filter((student) => {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        (!query || name.includes(query.toLowerCase())) &&
        (!classFilter || student.classId === classFilter)
      );
    });
  }, [students, query, classFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveStudent(editing);
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (student) => {
    if (!window.confirm(`Remove ${student.firstName} ${student.lastName} from the student register?`)) return;
    await deleteStudent(student.id);
    refresh();
  };

  if (!students) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            className="ams-input sm:max-w-xs"
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="ams-input sm:max-w-xs" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {canEdit && (
          <button className="ams-btn-primary" onClick={() => setEditing({ ...EMPTY_STUDENT })}>
            + Add Student
          </button>
        )}
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {filtered.length === 0 ? (
          <EmptyState message="No students found." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Parent/Guardian</th>
                <th>Status</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td className="font-semibold text-gray-800">
                    {student.firstName} {student.lastName}
                  </td>
                  <td>{classNames[student.classId] || '—'}</td>
                  <td>{student.gender || '—'}</td>
                  <td>{student.dob || '—'}</td>
                  <td>
                    {student.parentName || '—'}
                    {student.parentPhone && <span className="block text-xs text-gray-400">{student.parentPhone}</span>}
                  </td>
                  <td>
                    <Badge value={student.status || 'active'} />
                  </td>
                  {canEdit && (
                    <td className="whitespace-nowrap">
                      <button className="text-ois-blue text-sm font-semibold hover:underline mr-3" onClick={() => setEditing({ ...student })}>
                        Edit
                      </button>
                      <button className="ams-btn-danger" onClick={() => remove(student)}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Student' : 'Add Student'} onClose={() => setEditing(null)} wide>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ams-label">First Name</label>
              <input required className="ams-input" value={editing.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="ams-label">Last Name</label>
              <input required className="ams-input" value={editing.lastName} onChange={set('lastName')} />
            </div>
            <div>
              <label className="ams-label">Gender</label>
              <select className="ams-input" value={editing.gender} onChange={set('gender')}>
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className="ams-label">Date of Birth</label>
              <input type="date" className="ams-input" value={editing.dob} onChange={set('dob')} />
            </div>
            <div>
              <label className="ams-label">Class</label>
              <select className="ams-input" value={editing.classId} onChange={set('classId')}>
                <option value="">Unassigned</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ams-label">Status</label>
              <select className="ams-input" value={editing.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="disabled">Left school</option>
              </select>
            </div>
            <div>
              <label className="ams-label">Parent/Guardian Name</label>
              <input className="ams-input" value={editing.parentName} onChange={set('parentName')} />
            </div>
            <div>
              <label className="ams-label">Parent Phone</label>
              <input className="ams-input" value={editing.parentPhone} onChange={set('parentPhone')} />
            </div>
            <div className="sm:col-span-2">
              <label className="ams-label">Parent Email</label>
              <input type="email" className="ams-input" value={editing.parentEmail} onChange={set('parentEmail')} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
