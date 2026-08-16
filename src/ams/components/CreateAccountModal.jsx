import { useEffect, useMemo, useState } from 'react';
import { Modal } from './ui.jsx';
import { adminCreateUser, listStudents, getSettings, DEFAULT_STUDENT_PASSWORD } from '../data/api.js';

const ROLES = [
  { value: 'student', label: 'Student', hint: 'Signs in with their student number' },
  { value: 'parent', label: 'Parent / Guardian', hint: 'Signs in with their email' },
  { value: 'teacher', label: 'Teacher', hint: 'Signs in with their email' },
  { value: 'admin', label: 'Administrator', hint: 'Full access to the AMS' },
];

/**
 * Account creation, administrator only. The AMS has no public signup, so this
 * is the single place a login comes into existence.
 */
export default function CreateAccountModal({ onClose, onCreated }) {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', phone: '', studentId: '', password: '' });
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [defaultPassword, setDefaultPassword] = useState(DEFAULT_STUDENT_PASSWORD);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    listStudents().then(setStudents);
    getSettings().then((s) => {
      if (s?.students?.defaultPassword) setDefaultPassword(s.students.defaultPassword);
    });
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Students without a login yet — one login per pupil.
  const availableStudents = useMemo(() => {
    const term = studentQuery.trim().toLowerCase();
    const compact = term.replace(/[\s/-]/g, '');
    if (!term) return students.slice(0, 50);
    return students
      .filter((s) => {
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        return name.includes(term) || (s.studentNumber || '').toLowerCase().includes(compact);
      })
      .slice(0, 50);
  }, [students, studentQuery]);

  const chosenStudent = students.find((s) => s.id === form.studentId) || null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await adminCreateUser({
        role,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: role === 'student' ? null : form.email.trim(),
        studentId: role === 'student' ? form.studentId : null,
        password: form.password.trim() || null,
      });
      setCreated(result);
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  };

  // After creation, show the credentials once so the office can hand them over.
  if (created) {
    const login = created.studentNumber || created.email;
    return (
      <Modal title="Account created" onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Give these details to {created.name}. The password is shown only now — after this you can
            reset it, but not read it back.
          </p>
          <dl className="rounded-lg bg-gray-50 p-4 space-y-3">
            <div>
              <dt className="text-xs text-gray-400">Sign in with</dt>
              <dd className="font-mono text-lg font-bold text-ois-blue">{login}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Password</dt>
              <dd className="font-mono text-lg font-bold text-gray-800">{created.password}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500">
            Ask them to change it after signing in, from the account menu.
          </p>
          <div className="flex justify-end">
            <button className="ams-btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Create an account" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

        <div>
          <span className="ams-label">Account type</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                  role === r.value ? 'border-ois-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-sm font-semibold text-gray-800">{r.label}</span>
                <span className="block text-xs text-gray-500">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="ams-label" htmlFor="acct-name">Full name</label>
          <input id="acct-name" required className="ams-input" value={form.name} onChange={set('name')} />
        </div>

        {role === 'student' ? (
          <div>
            <label className="ams-label" htmlFor="acct-student">Which student?</label>
            <input
              id="acct-student"
              className="ams-input mb-2"
              placeholder="Search by student number or name…"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
            <select
              required
              size={6}
              className="ams-input h-auto"
              value={form.studentId}
              onChange={set('studentId')}
            >
              {availableStudents.length === 0 && <option value="">No students found</option>}
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentNumber} — {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
            {chosenStudent && (
              <p className="text-xs text-gray-500 mt-2">
                They will sign in with{' '}
                <span className="font-mono font-semibold text-ois-blue">{chosenStudent.studentNumber}</span>.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ams-label" htmlFor="acct-email">Email address</label>
              <input
                id="acct-email"
                type="email"
                required
                className="ams-input"
                value={form.email}
                onChange={set('email')}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="ams-label" htmlFor="acct-phone">Phone (optional)</label>
              <input id="acct-phone" className="ams-input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
        )}

        <div>
          <label className="ams-label" htmlFor="acct-password">
            {role === 'student' ? 'Password (optional)' : 'Password'}
          </label>
          <input
            id="acct-password"
            required={role !== 'student'}
            className="ams-input"
            value={form.password}
            onChange={set('password')}
            placeholder={role === 'student' ? `Leave blank to use ${defaultPassword}` : 'At least 6 characters'}
          />
          {role === 'student' && (
            <p className="text-xs text-gray-400 mt-1">
              Students share a starting password they are asked to change after signing in.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="ams-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className="ams-btn-primary">
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
