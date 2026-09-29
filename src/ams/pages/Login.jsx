import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { isDemoMode } from '../data/api.js';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ois.ug', password: 'admin123' },
  { role: 'Teacher', email: 'j.kisitu@ois.ug', password: 'teacher123' },
  { role: 'Parent', email: 'parent@ois.ug', password: 'parent123' },
  { role: 'Student', email: 'OIS0004', password: 'student123' },
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #2c64ac 0%, #63b647 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <a href="index.html">
              <img src="assets/icons/oisLogo.png" alt="OIS Logo" className="h-16 mx-auto mb-4" />
            </a>
            <h1 className="text-2xl font-bold text-gray-800">AMS Login</h1>
            <p className="text-gray-500 text-sm mt-1">OrchardsWood Academic Management System</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label" htmlFor="email">Email or Student Number</label>
              <input
                id="email"
                type="text"
                required
                className="ams-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or OIS0001"
                autoComplete="username"
              />
              <p className="text-xs text-gray-400 mt-1">
                Students sign in with their student number, e.g. OIS0001.
              </p>
            </div>
            <div>
              <label className="ams-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="ams-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <button type="submit" disabled={busy} className="ams-btn-primary w-full py-3">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Accounts are created by the school. Contact the school office if you need access
            or have forgotten your password.
          </p>
        </div>

        {isDemoMode() && (
          <div className="mt-4 bg-white/90 backdrop-blur rounded-xl p-4 text-sm">
            <p className="font-semibold text-gray-700 mb-2">Demo accounts (click to fill):</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  onClick={() => fillDemo(account)}
                  className="text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <span className="font-semibold text-ois-blue">{account.role}</span>
                  <span className="block text-xs text-gray-500">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
