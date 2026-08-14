import { useEffect, useMemo, useState } from 'react';
import { listStudents, saveStudent, deleteStudent, listClasses, getStudentDossier } from '../data/api.js';
import { Modal, EmptyState, Badge, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';
import { ICCE_LEVELS } from '../data/icce.js';
import StudentDossier from '../components/StudentDossier.jsx';

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
  photo: '',
  icceLevel: '',
};

// Report-card photos are stored inline with the student record, so they are
// downscaled to a passport-sized JPEG first — a phone photo would otherwise
// be several megabytes.
const PHOTO_MAX_W = 400;
const PHOTO_MAX_H = 480;

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const ratio = Math.min(PHOTO_MAX_W / img.width, PHOTO_MAX_H / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [dossier, setDossier] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const refresh = () => {
    Promise.all([listStudents(), listClasses()]).then(([studentRows, classRows]) => {
      setStudents(studentRows);
      setClasses(classRows);
    });
  };

  useEffect(refresh, []);

  useEffect(() => {
    if (!viewingId) {
      setDossier(null);
      return;
    }
    let cancelled = false;
    setDossier(null);
    getStudentDossier(viewingId).then((result) => {
      if (!cancelled) setDossier(result);
    });
    return () => {
      cancelled = true;
    };
  }, [viewingId]);

  const classNames = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes]);

  // Staff search by student number as often as by name, and may type it loosely
  // — "ois0001", "OIS 0001", "ois-0001". Stripping separators and folding case
  // on both sides lets all of those find the pupil. Partial numbers narrow the
  // list as you type ("001" keeps every number containing it); typing a number
  // in full opens that pupil outright, which the effect below handles.
  const filtered = useMemo(() => {
    if (!students) return [];
    const term = query.trim().toLowerCase();
    const compact = term.replace(/[\s/-]/g, '');

    return students.filter((student) => {
      if (classFilter && student.classId !== classFilter) return false;
      if (!term) return true;
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();
      return name.includes(term) || (student.studentNumber || '').toLowerCase().includes(compact);
    });
  }, [students, query, classFilter]);

  // An exact student-number match opens the pupil straight away, which is the
  // whole point of the number: type it, see everything.
  useEffect(() => {
    const compact = query.trim().toUpperCase().replace(/[\s/-]/g, '');
    if (!compact || !students) return;
    const exact = students.find((s) => (s.studentNumber || '').toUpperCase() === compact);
    if (exact) setViewingId(exact.id);
  }, [query, students]);

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

  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      const photo = await resizePhoto(file);
      setEditing((prev) => ({ ...prev, photo }));
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            className="ams-input sm:max-w-xs"
            placeholder="Student number or name…"
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
                <th>Student No.</th>
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
                  <td>
                    <span className="font-mono text-sm font-semibold text-ois-blue">
                      {student.studentNumber || '—'}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-800">
                    <button
                      type="button"
                      className="hover:underline text-left"
                      onClick={() => setViewingId(student.id)}
                    >
                      {student.firstName} {student.lastName}
                    </button>
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
                      <button className="text-ois-blue text-sm font-semibold hover:underline mr-3" onClick={() => setViewingId(student.id)}>
                        View
                      </button>
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

      {viewingId && (
        <Modal
          title={dossier ? `${dossier.student.studentNumber} — ${dossier.student.firstName} ${dossier.student.lastName}` : 'Student record'}
          onClose={() => setViewingId(null)}
          wide
        >
          {dossier ? (
            <StudentDossier
              dossier={dossier}
              onEdit={canEdit ? () => { setEditing({ ...dossier.student }); setViewingId(null); } : null}
            />
          ) : (
            <Spinner />
          )}
        </Modal>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit Student' : 'Add Student'} onClose={() => setEditing(null)} wide>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="ams-label">Student Number</label>
              <div className="ams-input bg-gray-50 font-mono text-gray-600">
                {editing.studentNumber || 'Assigned automatically on save'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                The school issues this number once and it stays with the pupil for life. It is
                printed on the report card and is what staff type to look them up.
              </p>
            </div>
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
            <div>
              <label className="ams-label">ICCE enrolment</label>
              <select className="ams-input" value={editing.icceLevel || ''} onChange={set('icceLevel')}>
                {ICCE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                ICCE students get the moderation notice printed on their report card.
              </p>
            </div>
            <div>
              <label className="ams-label">Photo for the report card</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {editing.photo ? (
                    <img src={editing.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </div>
                <div className="min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm w-full"
                    onChange={(e) => handlePhoto(e.target.files?.[0])}
                  />
                  {editing.photo && (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline mt-1"
                      onClick={() => setEditing((prev) => ({ ...prev, photo: '' }))}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
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
