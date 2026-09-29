import { Badge, EmptyState } from './ui.jsx';

// Everything the school holds on one pupil, shown when staff look them up by
// student number. Read-only: editing stays in the student form.

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800">{value || '—'}</dd>
    </div>
  );
}

export default function StudentDossier({ dossier, onEdit }) {
  const { student, studentClass, teacher, grades, reports, attendance } = dossier;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-20 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {student.photo ? (
            <img src={student.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-lg font-semibold">
              {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-lg font-bold text-ois-blue">{student.studentNumber}</p>
          <p className="text-xl font-semibold text-gray-800">
            {student.firstName} {student.lastName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge value={student.status || 'active'} />
            {student.icceLevel && <span className="text-xs text-gray-500">ICCE: {student.icceLevel}</span>}
          </div>
        </div>
        {onEdit && (
          <button type="button" className="ams-btn-secondary flex-shrink-0" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      <Section title="Details">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Class" value={studentClass?.name} />
          <Field label="Class Teacher" value={teacher?.name} />
          <Field label="Gender" value={student.gender} />
          <Field label="Date of Birth" value={student.dob} />
        </dl>
      </Section>

      <Section title="Parent / Guardian">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Name" value={student.parentName} />
          <Field label="Phone" value={student.parentPhone} />
          <Field label="Email" value={student.parentEmail} />
        </dl>
      </Section>

      <Section title="Attendance">
        {attendance.total === 0 ? (
          <p className="text-sm text-gray-400">No attendance recorded yet.</p>
        ) : (
          <dl className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            <Field label="Rate" value={attendance.rate === null ? null : `${attendance.rate}%`} />
            <Field label="Present" value={attendance.present} />
            <Field label="Absent" value={attendance.absent} />
            <Field label="Late" value={attendance.late} />
            <Field label="Excused" value={attendance.excused} />
          </dl>
        )}
      </Section>

      <Section title="Report Cards">
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400">No report cards yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ams-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.term ? `${report.term.name} ${report.term.year}` : '—'}</td>
                    <td>
                      <Badge value={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Recorded Grades">
        {grades.length === 0 ? (
          <p className="text-sm text-gray-400">No grades recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ams-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Term</th>
                  <th>Score</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="font-semibold text-gray-800">{grade.subject}</td>
                    <td>{grade.term || '—'}</td>
                    <td>
                      {grade.score}
                      <span className="text-gray-400"> / {grade.maxScore}</span>
                    </td>
                    <td className="text-gray-500">{grade.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
