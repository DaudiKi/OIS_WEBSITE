import { useEffect, useMemo, useState } from 'react';
import { listClasses, listStudents, listAttendance, saveAttendance } from '../data/api.js';
import { EmptyState, Badge, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';

const STATUSES = ['present', 'absent', 'late', 'excused'];

export default function Attendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState(null);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    Promise.all([listClasses(), listStudents()]).then(([classRows, studentRows]) => {
      setClasses(classRows);
      setStudents(studentRows);
      if (classRows.length && canEdit) setClassId((prev) => prev || classRows[0].id);
    });
  }, [canEdit]);

  useEffect(() => {
    if (!classId || !date) return;
    listAttendance({ classId, date }).then((records) => {
      const map = {};
      records.forEach((record) => {
        map[record.studentId] = record.status;
      });
      setMarks(map);
      setSaved(false);
    });
  }, [classId, date]);

  const classStudents = useMemo(
    () => (students || []).filter((student) => student.classId === classId),
    [students, classId]
  );

  // Parent / student read-only view of their own attendance
  const ownIds = user?.role === 'parent' ? user.childIds || [] : user?.role === 'student' ? [user.studentId].filter(Boolean) : null;
  const [ownRecords, setOwnRecords] = useState(null);
  useEffect(() => {
    if (!ownIds) return;
    listAttendance({}).then((records) => {
      setOwnRecords(records.filter((record) => ownIds.includes(record.studentId)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!canEdit) {
    if (!ownRecords || !students) return <Spinner />;
    const nameOf = (id) => {
      const student = students.find((s) => s.id === id);
      return student ? `${student.firstName} ${student.lastName}` : id;
    };
    return (
      <div className="ams-card overflow-x-auto p-0">
        {ownRecords.length === 0 ? (
          <EmptyState message="No attendance records yet." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ownRecords
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td className="font-semibold text-gray-800">{nameOf(record.studentId)}</td>
                    <td>
                      <Badge value={record.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (!students) return <Spinner />;

  const markAll = (status) => {
    const map = {};
    classStudents.forEach((student) => {
      map[student.id] = status;
    });
    setMarks(map);
    setSaved(false);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const records = classStudents
        .filter((student) => marks[student.id])
        .map((student) => ({ studentId: student.id, status: marks[student.id] }));
      await saveAttendance(classId, date, records);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ams-card flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <label className="ams-label">Class</label>
          <select className="ams-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="ams-label">Date</label>
          <input type="date" className="ams-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="ams-btn-secondary" onClick={() => markAll('present')}>
            All present
          </button>
          <button className="ams-btn-primary" onClick={submit} disabled={busy || classStudents.length === 0}>
            {busy ? 'Saving…' : 'Save Register'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
          Attendance register saved for {date}.
        </div>
      )}

      <div className="ams-card overflow-x-auto p-0">
        {classStudents.length === 0 ? (
          <EmptyState message="No students in this class." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student) => (
                <tr key={student.id}>
                  <td className="font-semibold text-gray-800">
                    {student.firstName} {student.lastName}
                    <span className="block font-mono text-xs text-gray-400">{student.studentNumber}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setMarks((prev) => ({ ...prev, [student.id]: status }));
                            setSaved(false);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border-2 transition-colors ${
                            marks[student.id] === status
                              ? 'border-ois-blue bg-ois-blue text-white'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
