import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const ROLES = [
  { value: 'parent', label: 'Parent / Guardian', description: 'Follow your children’s progress' },
  { value: 'student', label: 'Student', description: 'Access your grades and schedule' },
  { value: 'teacher', label: 'Teacher / Staff', description: 'Requires admin approval' },
];

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'parent' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });
      if (result.needsApproval) {
        setPendingApproval(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #2c64ac 0%, #63b647 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Account Awaiting Approval</h2>
          <p className="text-gray-600 mb-6">
            Thank you for registering. Staff accounts require approval by the school administrator. You will be able to
            sign in once your account is approved.
          </p>
          <Link to="/login" className="ams-btn-primary inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #2c64ac 0%, #63b647 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="index.html">
            <img src="assets/icons/oisLogo.png" alt="OIS Logo" className="h-16 mx-auto mb-4" />
          </a>
          <h1 className="text-2xl font-bold text-gray-800">Create Your AMS Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the OrchardsWood school community portal</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="ams-label" htmlFor="name">Full Name</label>
            <input id="name" type="text" required className="ams-input" value={form.name} onChange={set('name')} placeholder="Your full name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ams-label" htmlFor="signup-email">Email Address</label>
              <input id="signup-email" type="email" required className="ams-input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
            <div>
              <label className="ams-label" htmlFor="phone">Phone (optional)</label>
              <input id="phone" type="tel" className="ams-input" value={form.phone} onChange={set('phone')} placeholder="+256 700 000000" />
            </div>
          </div>

          <div>
            <span className="ams-label">I am a…</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                    form.role === role.value ? 'border-ois-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-800">{role.label}</span>
                  <span className="block text-xs text-gray-500">{role.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ams-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" required className="ams-input" value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="ams-label" htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type="password" required className="ams-input" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
            </div>
          </div>

          <button type="submit" disabled={busy} className="ams-btn-primary w-full py-3">
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-ois-blue font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
