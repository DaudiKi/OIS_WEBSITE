import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { getDashboardStats, listStudents, listGrades } from '../data/api.js';
import { fetchSchoolEvents } from '../../lib/events.js';
import { StatCard, Spinner } from '../components/ui.jsx';

function Icon({ d }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [myChildren, setMyChildren] = useState([]);
  const [myGrades, setMyGrades] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardStats(), fetchSchoolEvents()]).then(([dashboardStats, allEvents]) => {
      if (cancelled) return;
      setStats(dashboardStats);
      const todayKey = new Date().toISOString().slice(0, 10);
      setEvents(allEvents.filter((event) => (event.endDate || event.date) >= todayKey).slice(0, 5));
    });

    if (user?.role === 'parent' || user?.role === 'student') {
      Promise.all([listStudents(), listGrades()]).then(([students, grades]) => {
        if (cancelled) return;
        const ids = user.role === 'parent' ? user.childIds || [] : [user.studentId].filter(Boolean);
        const children = students.filter((s) => ids.includes(s.id));
        setMyChildren(children);
        setMyGrades(grades.filter((g) => ids.includes(g.studentId)));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!stats) return <Spinner />;

  const isStaff = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="space-y-8">
      <div className="ams-card" style={{ background: 'linear-gradient(135deg, #2c64ac, #63b647)' }}>
        <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-white/80 mt-1">
          {isStaff
            ? 'Here is an overview of what is happening at OrchardsWood today.'
            : 'Here is the latest from OrchardsWood International School.'}
        </p>
      </div>

      {isStaff ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Students" value={stats.studentCount} accent="#2c64ac" icon={<Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />} />
          <StatCard label="Teachers" value={stats.teacherCount} accent="#63b647" icon={<Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} />
          <StatCard label="Classes" value={stats.classCount} accent="#8b5cf6" icon={<Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />} />
          <StatCard label="New Applications" value={stats.newApplications} accent="#ef4444" icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} />
        </div>
      ) : (
        myChildren.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myChildren.map((child) => {
              const childGrades = myGrades.filter((g) => g.studentId === child.id);
              const average = childGrades.length
                ? Math.round(childGrades.reduce((sum, g) => sum + (g.score / (g.maxScore || 100)) * 100, 0) / childGrades.length)
                : null;
              return (
                <div key={child.id} className="ams-card">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Status: {child.status}</p>
                  <p className="text-sm text-gray-600">
                    {childGrades.length
                      ? `Average score this term: ${average}% across ${childGrades.length} subject(s).`
                      : 'No grades recorded yet this term.'}
                  </p>
                  <Link to="/grades" className="text-ois-blue text-sm font-semibold hover:underline mt-2 inline-block">
                    View grades →
                  </Link>
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="ams-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Latest Announcements</h3>
            <Link to="/announcements" className="text-ois-blue text-sm font-semibold hover:underline">
              All →
            </Link>
          </div>
          {stats.announcements.length === 0 ? (
            <p className="text-gray-400 text-sm">No announcements yet.</p>
          ) : (
            <ul className="space-y-4">
              {stats.announcements.map((announcement) => (
                <li key={announcement.id}>
                  <p className="font-semibold text-gray-800 text-sm">{announcement.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{announcement.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {announcement.author} • {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
