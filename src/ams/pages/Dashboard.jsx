import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import * as api from '../data/api.js';
import { fetchSchoolEvents } from '../../lib/events.js';
import { StatCard, Spinner } from '../components/ui.jsx';
import { computeReport, REPORT_STATUS, DEFAULT_GRADE_SCALE } from '../data/icce.js';

function Icon({ d }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  );
}

const ICONS = {
  students: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  teachers: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  classes: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16',
  docs: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2',
};

/* ----------------------------- Shared panels ------------------------------ */

function EventsPanel({ events }) {
  return (
    <div className="ams-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Upcoming Events</h3>
        <Link to="/calendar" className="text-ois-blue text-sm font-semibold hover:underline">
          Full calendar →
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming events.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-ois-blue text-white rounded-lg px-2 py-1 text-center w-12">
                <span className="block text-sm font-bold">{new Date(`${event.date}T00:00:00`).getDate()}</span>
                <span className="block text-[10px] uppercase">
                  {new Date(`${event.date}T00:00:00`).toLocaleString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{event.title}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnnouncementsPanel({ announcements }) {
  return (
    <div className="ams-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Latest Announcements</h3>
        <Link to="/announcements" className="text-ois-blue text-sm font-semibold hover:underline">
          All →
        </Link>
      </div>
      {announcements.length === 0 ? (
        <p className="text-gray-400 text-sm">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id}>
              <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{a.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {a.author} • {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Horizontal bar showing how a term's reports are progressing. */
function ReportPipeline({ reports, term }) {
  const counts = ['draft', 'submitted', 'returned', 'verified', 'published'].map((key) => ({
    key,
    label: REPORT_STATUS[key].label,
    count: reports.filter((r) => r.status === key).length,
  }));
  const total = reports.length || 1;
  const colors = {
    draft: '#9ca3af',
    submitted: '#f59e0b',
    returned: '#fb923c',
    verified: '#3b82f6',
    published: '#4e9236',
  };

  return (
    <div className="ams-card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-800 text-lg">Report cards</h3>
        <Link to="/reports" className="text-ois-blue text-sm font-semibold hover:underline">
          Open reports →
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {reports.length} report{reports.length === 1 ? '' : 's'} for {term?.name} {term?.year}
      </p>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-4">
        {counts.map(
          (c) =>
            c.count > 0 && (
              <div
                key={c.key}
                style={{ width: `${(c.count / total) * 100}%`, background: colors[c.key] }}
                title={`${c.label}: ${c.count}`}
              />
            )
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {counts.map((c) => (
          <div key={c.key}>
            <p className="text-xl font-bold text-gray-800 tabular-nums">{c.count}</p>
            <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A published report summarised for a family member. */
function ReportSummaryCard({ student, report, scale, showName }) {
  const computed = computeReport(report, scale);
  return (
    <div className="ams-card">
      {showName && (
        <h3 className="font-bold text-gray-800 text-lg mb-1">
          {student.firstName} {student.lastName}
        </h3>
      )}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="text-center rounded-lg bg-gray-50 py-3">
          <p className="text-2xl font-bold text-ois-blue tabular-nums">
            {computed.overallGrade || '—'}
          </p>
          <p className="text-xs text-gray-500">Term grade</p>
        </div>
        <div className="text-center rounded-lg bg-gray-50 py-3">
          <p className="text-2xl font-bold text-gray-800 tabular-nums">
            {computed.overallAverage === null ? '—' : `${computed.overallAverage.toFixed(1)}%`}
          </p>
          <p className="text-xs text-gray-500">Average</p>
        </div>
        <div className="text-center rounded-lg bg-gray-50 py-3">
          <p className="text-2xl font-bold text-gray-800 tabular-nums">{computed.pacesCompleted}</p>
          <p className="text-xs text-gray-500">PACEs done</p>
        </div>
      </div>
      <div className="space-y-1.5 mb-4">
        {computed.subjects
          .filter((s) => s.average !== null)
          .map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{s.name}</span>
              <span className="tabular-nums text-gray-800">
                {s.average.toFixed(2)}% <strong className="ml-1">{s.grade}</strong>
              </span>
            </div>
          ))}
      </div>
      <Link to={`/reports/${report.id}/card`} className="ams-btn-primary w-full text-center block">
        View &amp; download report
      </Link>
    </div>
  );
}

/* -------------------------------- Dashboard ------------------------------- */

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      const [stats, allEvents, terms, settings] = await Promise.all([
        api.getDashboardStats(),
        fetchSchoolEvents(),
        api.listTerms(),
        api.getSettings(),
      ]);
      const term = terms.find((t) => t.status === 'open') || terms[terms.length - 1] || null;
      const reports = await api.listReportsForUser(user, { termId: term?.id });

      const base = {
        stats,
        term,
        reports,
        scale: settings?.gradeScale || DEFAULT_GRADE_SCALE,
        events: allEvents.filter((e) => (e.endDate || e.date) >= todayKey).slice(0, 5),
      };

      if (user?.role === 'teacher') {
        const [classes, students] = await Promise.all([api.listClasses(), api.listStudents()]);
        const mine = classes.filter(
          (c) => c.teacherId === user.teacherId || (c.supervisorIds || []).includes(user.teacherId)
        );
        const ids = new Set(mine.map((c) => c.id));
        base.myClasses = mine;
        base.myStudents = students.filter((s) => ids.has(s.classId));
      }

      if (user?.role === 'parent' || user?.role === 'student') {
        const students = await api.listStudents();
        const ids = user.role === 'student' ? [user.studentId] : user.childIds || [];
        base.children = students.filter((s) => ids.includes(s.id));
      }

      if (!cancelled) setState(base);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!state) return <Spinner />;

  const { stats, events, reports, term, scale } = state;
  const firstName = user?.name?.split(' ')[0];

  /* ------------------------------- Admin -------------------------------- */
  if (user?.role === 'admin') {
    const awaiting = reports.filter((r) => r.status === 'submitted');
    return (
      <div className="space-y-8">
        <div className="ams-card" style={{ background: 'linear-gradient(135deg, #2c64ac, #63b647)' }}>
          <h2 className="text-2xl font-bold text-white">Welcome back, {firstName}!</h2>
          <p className="text-white/80 mt-1">Here is an overview of what is happening at OrchardsWood today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Students" value={stats.studentCount} accent="#2c64ac" icon={<Icon d={ICONS.students} />} />
          <StatCard label="Teachers" value={stats.teacherCount} accent="#63b647" icon={<Icon d={ICONS.teachers} />} />
          <StatCard label="Classes" value={stats.classCount} accent="#8b5cf6" icon={<Icon d={ICONS.classes} />} />
          <StatCard
            label="Reports to verify"
            value={awaiting.length}
            accent={awaiting.length ? '#f59e0b' : '#94a3b8'}
            icon={<Icon d={ICONS.check} />}
          />
        </div>

        {awaiting.length > 0 && (
          <div className="ams-card border-l-4 border-yellow-400">
            <h3 className="font-bold text-gray-800">
              {awaiting.length} report{awaiting.length === 1 ? '' : 's'} waiting for you
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              Supervisors have submitted these for checking. Verify them, then publish so families can download them.
            </p>
            <Link to="/reports" className="ams-btn-primary text-sm">
              Review submissions
            </Link>
          </div>
        )}

        <ReportPipeline reports={reports} term={term} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventsPanel events={events} />
          <AnnouncementsPanel announcements={stats.announcements} />
        </div>
      </div>
    );
  }

  /* ------------------------------ Teacher ------------------------------- */
  if (user?.role === 'teacher') {
    const needsWork = reports.filter((r) => r.status === 'draft' || r.status === 'returned');
    return (
      <div className="space-y-8">
        <div className="ams-card" style={{ background: 'linear-gradient(135deg, #2c64ac, #63b647)' }}>
          <h2 className="text-2xl font-bold text-white">Welcome back, {firstName}!</h2>
          <p className="text-white/80 mt-1">
            {state.myClasses?.length
              ? `You supervise ${state.myClasses.map((c) => c.name).join(', ')}.`
              : 'Here is what is happening at OrchardsWood today.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            label="My students"
            value={state.myStudents?.length ?? 0}
            accent="#2c64ac"
            icon={<Icon d={ICONS.students} />}
          />
          <StatCard
            label="My classes"
            value={state.myClasses?.length ?? 0}
            accent="#8b5cf6"
            icon={<Icon d={ICONS.classes} />}
          />
          <StatCard
            label="Reports to complete"
            value={needsWork.length}
            accent={needsWork.length ? '#f59e0b' : '#4e9236'}
            icon={<Icon d={ICONS.docs} />}
          />
        </div>

        {needsWork.some((r) => r.status === 'returned') && (
          <div className="ams-card border-l-4 border-orange-400">
            <h3 className="font-bold text-gray-800">Some reports were returned for correction</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              The administrator has sent these back with notes. Open each one to see what needs changing.
            </p>
            <Link to="/reports" className="ams-btn-primary text-sm">
              Open reports
            </Link>
          </div>
        )}

        <ReportPipeline reports={reports} term={term} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventsPanel events={events} />
          <AnnouncementsPanel announcements={stats.announcements} />
        </div>
      </div>
    );
  }

  /* -------------------------- Parent & student -------------------------- */
  const children = state.children || [];
  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-8">
      <div className="ams-card" style={{ background: 'linear-gradient(135deg, #2c64ac, #63b647)' }}>
        <h2 className="text-2xl font-bold text-white">Welcome back, {firstName}!</h2>
        <p className="text-white/80 mt-1">
          {isParent
            ? 'Your children’s published reports and the latest from school.'
            : 'Your published reports and the latest from school.'}
        </p>
      </div>

      {children.length > 0 && (
        <div className={`grid gap-6 ${children.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {children.map((child) => {
            const published = reports
              .filter((r) => r.studentId === child.id && r.status === 'published')
              .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
            const latest = published[0];

            if (!latest) {
              return (
                <div key={child.id} className="ams-card">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    No report has been published for {term?.name} {term?.year} yet. It will appear here as
                    soon as the school releases it.
                  </p>
                </div>
              );
            }

            return (
              <ReportSummaryCard
                key={child.id}
                student={child}
                report={latest}
                scale={scale}
                showName={isParent || children.length > 1}
              />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventsPanel events={events} />
        <AnnouncementsPanel announcements={stats.announcements} />
      </div>
    </div>
  );
}
