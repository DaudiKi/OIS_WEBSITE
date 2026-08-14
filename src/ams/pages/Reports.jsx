import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import * as api from '../data/api.js';
import { EmptyState, Spinner, Modal } from '../components/ui.jsx';
import {
  REPORT_STATUS,
  computeReport,
  blankReport,
  DEFAULT_GRADE_SCALE,
} from '../data/icce.js';

function StatusBadge({ status }) {
  const meta = REPORT_STATUS[status] || REPORT_STATUS.draft;
  return <span className={`ams-badge ${meta.badge}`}>{meta.label}</span>;
}

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState('');
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genClassId, setGenClassId] = useState('');
  const [error, setError] = useState('');

  const isStaff = user?.role === 'admin' || user?.role === 'teacher';

  const refresh = useCallback(async () => {
    const [t, s, c, cfg] = await Promise.all([
      api.listTerms(),
      api.listStudents(),
      api.listClasses(),
      api.getSettings(),
    ]);
    setTerms(t);
    setStudents(s);
    setClasses(c);
    setSettings(cfg);
    const active = termId || t.find((x) => x.status === 'open')?.id || t[0]?.id || '';
    setTermId(active);
    setReports(await api.listReportsForUser(user, { termId: active }));
    setLoading(false);
  }, [user, termId]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!termId || !user) return;
    let cancelled = false;
    api.listReportsForUser(user, { termId }).then((r) => {
      if (!cancelled) setReports(r);
    });
    return () => {
      cancelled = true;
    };
  }, [termId, user]);

  const studentById = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);
  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const scale = settings?.gradeScale || DEFAULT_GRADE_SCALE;
  const term = terms.find((t) => t.id === termId);

  const rows = useMemo(
    () =>
      reports
        .map((report) => {
          const student = studentById[report.studentId];
          const computed = computeReport(report, scale);
          return {
            report,
            student,
            klass: student ? classById[student.classId] : null,
            computed,
          };
        })
        .filter((row) => row.student)
        .sort((a, b) => `${a.student.lastName}`.localeCompare(`${b.student.lastName}`)),
    [reports, studentById, classById, scale]
  );

  const awaiting = rows.filter((r) => r.report.status === 'submitted');

  /** Create draft reports for every student in a class who doesn't yet have one. */
  const handleGenerate = async () => {
    if (!genClassId || !termId) return;
    setError('');
    try {
      const roster = students.filter((s) => s.classId === genClassId && s.status !== 'archived');
      const existing = new Set(reports.map((r) => r.studentId));
      const missing = roster.filter((s) => !existing.has(s.id));
      if (!missing.length) {
        setError('Every student in that class already has a report for this term.');
        return;
      }
      await Promise.all(
        missing.map((s) =>
          api.saveReport(blankReport({ studentId: s.id, termId, subjects: settings?.subjects }))
        )
      );
      setGenerating(false);
      setGenClassId('');
      setReports(await api.listReportsForUser(user, { termId }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* ------------------------------ Controls ---------------------------- */}
      <div className="ams-card flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="term">
            Academic term
          </label>
          <select
            id="term"
            className="ams-input sm:w-64"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.year}
                {t.status === 'open' ? ' — current' : ''}
              </option>
            ))}
          </select>
        </div>
        {isStaff && (
          <button className="ams-btn-primary" onClick={() => setGenerating(true)}>
            Start reports for a class
          </button>
        )}
      </div>

      {/* --------------------------- Verify queue --------------------------- */}
      {user?.role === 'admin' && awaiting.length > 0 && (
        <div className="ams-card border-l-4 border-yellow-400">
          <h3 className="font-bold text-gray-800 mb-1">
            {awaiting.length} report{awaiting.length === 1 ? '' : 's'} awaiting your verification
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Supervisors have submitted these. Check them, then verify and publish so families can see them.
          </p>
          <div className="flex flex-wrap gap-2">
            {awaiting.map(({ report, student }) => (
              <Link key={report.id} to={`/reports/${report.id}`} className="ams-btn-secondary text-sm">
                {student.firstName} {student.lastName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------ The list ---------------------------- */}
      <div className="ams-card p-0 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            message={
              isStaff
                ? 'No reports for this term yet. Use "Start reports for a class" to begin.'
                : 'No published reports for this term yet.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Class</th>
                  <th className="text-center px-4 py-3">PACEs</th>
                  <th className="text-center px-4 py-3">Average</th>
                  <th className="text-center px-4 py-3">Grade</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ report, student, klass, computed }) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{klass?.name || '—'}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{computed.pacesCompleted}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {computed.overallAverage === null ? '—' : `${computed.overallAverage.toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-800">
                      {computed.overallGrade || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isStaff && (
                        <button
                          className="text-ois-blue hover:underline font-medium mr-4"
                          onClick={() => navigate(`/reports/${report.id}`)}
                        >
                          {report.status === 'draft' || report.status === 'returned' ? 'Fill in' : 'Review'}
                        </button>
                      )}
                      {(report.status === 'published' || isStaff) && (
                        <button
                          className="text-gray-600 hover:underline font-medium"
                          onClick={() => navigate(`/reports/${report.id}/card`)}
                        >
                          View card
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {term && isStaff && (
        <p className="text-xs text-gray-400">
          Supervisors record PACE scores throughout {term.name}. Averages, grades and the PACE count are
          calculated automatically from those scores using the ICCE grading scale.
        </p>
      )}

      {/* ---------------------------- Generate modal ------------------------ */}
      {generating && (
        <Modal title="Start reports for a class" onClose={() => setGenerating(false)}>
          <p className="text-sm text-gray-500 mb-4">
            This creates a blank report for every student in the class who does not already have one for{' '}
            <strong>
              {term?.name} {term?.year}
            </strong>
            . Nothing is sent to parents until each report is verified and published.
          </p>
          <select className="ams-input mb-4" value={genClassId} onChange={(e) => setGenClassId(e.target.value)}>
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({students.filter((s) => s.classId === c.id).length} students)
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button className="ams-btn-secondary" onClick={() => setGenerating(false)}>
              Cancel
            </button>
            <button className="ams-btn-primary" onClick={handleGenerate} disabled={!genClassId}>
              Create reports
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
