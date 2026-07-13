import { useEffect, useMemo, useState } from 'react';
import { listGrades, saveGrade, deleteGrade, listStudents } from '../data/api.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const EMPTY_GRADE = { studentId: '', subject: '', term: 'Term 2 2025', score: '', maxScore: 100, comment: '' };
const SUBJECTS = ['Mathematics', 'English', 'Literature', 'Word Building', 'Social Studies', 'Science', 'Computer Studies', 'Art', 'Bible Studies'];

export default function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';
  const ownIds = user?.role === 'parent' ? user.childIds || [] : user?.role === 'student' ? [user.studentId].filter(Boolean) : null;

  const refresh = () => {
    Promise.all([listGrades(), listStudents()]).then(([gradeRows, studentRows]) => {
      setGrades(gradeRows);
      setStudents(studentRows);
    });
  };
  useEffect(refresh, []);

  const studentNames = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`])),
    [students]
  );

  const visible = useMemo(() => {
    if (!grades) return [];
    let rows = grades;
    if (ownIds) rows = rows.filter((grade) => ownIds.includes(grade.studentId));
    if (studentFilter) rows = rows.filter((grade) => grade.studentId === studentFilter);
    return rows;
  }, [grades, ownIds, studentFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveGrade({ ...editing, score: Number(editing.score), maxScore: Number(editing.maxScore) || 100 });
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (grade) => {
    if (!window.confirm('Delete this grade entry?')) return;
    await deleteGrade(grade.id);
    refresh();
  };

  if (!grades) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));
  const filterOptions = ownIds ? students.filter((s) => ownIds.includes(s.id)) : students;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <select className="ams-input sm:max-w-xs" value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}>
          <option value="">All students</option>
          {filterOptions.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>
        {canEdit && (
          <button className="ams-btn-primary" onClick={() => setEditing({ ...EMPTY_GRADE })}>
            + Record Grade
          </button>
        )}
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {visible.length === 0 ? (
          <EmptyState message="No grades recorded." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Term</th>
                <th>Score</th>
                <th>Comment</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((grade) => {
                const percent = Math.round((grade.score / (grade.maxScore || 100)) * 100);
                return (
                  <tr key={grade.id}>
                    <td className="font-semibold text-gray-800">{studentNames[grade.studentId] || '—'}</td>
                    <td>{grade.subject}</td>
                    <td>{grade.term}</td>
                    <td>
                      <span
                        className={`font-bold ${percent >= 80 ? 'text-green-600' : percent >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                      >
                        {grade.score}/{grade.maxScore || 100}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">({percent}%)</span>
                    </td>
                    <td className="max-w-[240px] truncate">{grade.comment || '—'}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap">
                        <button className="text-ois-blue text-sm font-semibold hover:underline mr-3" onClick={() => setEditing({ ...grade })}>
                          Edit
                        </button>
                        <button className="ams-btn-danger" onClick={() => remove(grade)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Grade' : 'Record Grade'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label">Student</label>
              <select required className="ams-input" value={editing.studentId} onChange={set('studentId')}>
                <option value="">Select student…</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ams-label">Subject</label>
                <select required className="ams-input" value={editing.subject} onChange={set('subject')}>
                  <option value="">Select subject…</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ams-label">Term</label>
                <input className="ams-input" value={editing.term} onChange={set('term')} />
              </div>
              <div>
                <label className="ams-label">Score</label>
                <input required type="number" min="0" className="ams-input" value={editing.score} onChange={set('score')} />
              </div>
              <div>
                <label className="ams-label">Out of</label>
                <input type="number" min="1" className="ams-input" value={editing.maxScore} onChange={set('maxScore')} />
              </div>
            </div>
            <div>
              <label className="ams-label">Comment</label>
              <textarea className="ams-input" rows="2" value={editing.comment} onChange={set('comment')} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Grade'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
