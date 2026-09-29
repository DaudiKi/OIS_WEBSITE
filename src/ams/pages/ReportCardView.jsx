import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import * as api from '../data/api.js';
import { Spinner } from '../components/ui.jsx';
import ReportDocument from '../components/ReportDocument.jsx';
import { REPORT_STATUS, DEFAULT_GRADE_SCALE } from '../data/icce.js';

/**
 * Renders a report card at A4 and offers a Download button that opens the
 * browser's print dialogue. Because the print stylesheet hides the app chrome
 * and keeps the document at exactly A4, "Save as PDF" produces the same sheet
 * that is previewed here.
 */
export default function ReportCardView() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [scale, setScale] = useState(1);

  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    const report = await api.getReport(id);
    if (!report) {
      setLoading(false);
      return;
    }

    // Families may only open published reports, and only their own.
    if (user?.role === 'parent' || user?.role === 'student') {
      const own = user.role === 'student' ? [user.studentId] : user.childIds || [];
      if (!own.includes(report.studentId) || report.status !== 'published') {
        setDenied(true);
        setLoading(false);
        return;
      }
    }

    const [students, terms, classes, teachers, settings] = await Promise.all([
      api.listStudents(),
      api.listTerms(),
      api.listClasses(),
      api.listTeachers(),
      api.getSettings(),
    ]);

    const student = students.find((s) => s.id === report.studentId);
    const klass = classes.find((c) => c.id === student?.classId);
    const supervisorIds = klass?.supervisorIds?.length ? klass.supervisorIds : [klass?.teacherId];
    const supervisors = teachers.filter((t) => supervisorIds.includes(t.id));

    setData({
      report,
      student: { ...student, gradeLabel: klass?.name || '' },
      term: terms.find((t) => t.id === report.termId) || { name: '', year: '' },
      supervisors,
      school: { ...settings.school, traitFooter: settings.traitFooter },
      gradeScale: settings.gradeScale || DEFAULT_GRADE_SCALE,
    });
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  // Fit the A4 sheet to the available width on screen (print ignores this).
  useLayoutEffect(() => {
    const fit = () => {
      const width = wrapRef.current?.clientWidth;
      if (!width) return;
      const A4_PX = 794; // 210mm at 96dpi
      setScale(Math.min(1, (width - 48) / A4_PX));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [data]);

  if (loading) return <Spinner />;

  if (denied) {
    return (
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">Not available</h3>
        <p className="text-gray-600 text-sm mb-4">
          This report has not been published yet, or it belongs to another student.
        </p>
        <Link to="/reports" className="text-ois-blue hover:underline text-sm">
          Back to reports
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ams-card">
        <p className="text-gray-600">Report not found.</p>
        <Link to="/reports" className="text-ois-blue hover:underline text-sm">
          Back to reports
        </Link>
      </div>
    );
  }

  const meta = REPORT_STATUS[data.report.status];
  const isDraftish = data.report.status !== 'published';

  return (
    <div className="space-y-4">
      <div className="ams-card no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-800">
            {data.student.firstName} {data.student.lastName} — {data.term.name} {data.term.year}
          </h2>
          <p className="text-sm text-gray-500">
            {isDraftish
              ? `Preview only — this report is ${meta?.label.toLowerCase()}.`
              : 'Published. Use Download to save or print a copy.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/reports" className="ams-btn-secondary">
            Back
          </Link>
          <button className="ams-btn-primary" onClick={() => window.print()}>
            Download / Print
          </button>
        </div>
      </div>

      <div className="rc-preview rounded-xl" ref={wrapRef}>
        <div
          className="rc-scaler"
          style={{ transform: `scale(${scale})`, height: scale < 1 ? `${scale * 2 * 1123 + 40}px` : 'auto' }}
        >
          <ReportDocument
            report={data.report}
            student={data.student}
            term={data.term}
            school={data.school}
            supervisors={data.supervisors}
            gradeScale={data.gradeScale}
          />
        </div>
      </div>
    </div>
  );
}
