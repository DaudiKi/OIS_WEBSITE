import { useState } from 'react';
import { Modal } from './ui.jsx';
import { changePassword } from '../data/api.js';

/** Any signed-in user changing their own password. */
export default function ChangePasswordModal({ onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not change your password.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal title="Password changed" onClose={onClose}>
        <p className="text-sm text-gray-600 mb-5">
          Your password has been updated. Use it the next time you sign in.
        </p>
        <div className="flex justify-end">
          <button className="ams-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change your password" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
        <div>
          <label className="ams-label" htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            className="ams-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="ams-label" htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            className="ams-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat the new password"
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className="ams-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className="ams-btn-primary">
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
