import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import Attendance from './pages/Attendance.jsx';
import Grades from './pages/Grades.jsx';
import AmsCalendar from './pages/AmsCalendar.jsx';
import Announcements from './pages/Announcements.jsx';
import Applications from './pages/Applications.jsx';
import GalleryAdmin from './pages/GalleryAdmin.jsx';
import Users from './pages/Users.jsx';

function Protected({ roles, title, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Layout title={title}>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

          <Route path="/dashboard" element={<Protected title="Dashboard"><Dashboard /></Protected>} />
          <Route path="/students" element={<Protected roles={['admin', 'teacher']} title="Students"><Students /></Protected>} />
          <Route path="/teachers" element={<Protected roles={['admin']} title="Teachers"><Teachers /></Protected>} />
          <Route path="/classes" element={<Protected roles={['admin', 'teacher']} title="Classes"><Classes /></Protected>} />
          <Route path="/attendance" element={<Protected title="Attendance"><Attendance /></Protected>} />
          <Route path="/grades" element={<Protected title="Grades"><Grades /></Protected>} />
          <Route path="/calendar" element={<Protected title="School Calendar"><AmsCalendar /></Protected>} />
          <Route path="/announcements" element={<Protected title="Announcements"><Announcements /></Protected>} />
          <Route path="/applications" element={<Protected roles={['admin']} title="Admission Applications"><Applications /></Protected>} />
          <Route path="/gallery" element={<Protected roles={['admin', 'teacher']} title="Gallery Manager"><GalleryAdmin /></Protected>} />
          <Route path="/users" element={<Protected roles={['admin']} title="User Accounts"><Users /></Protected>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
