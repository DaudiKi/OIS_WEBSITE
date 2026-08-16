import { useEffect, useState } from 'react';
import { listUsers, updateUser, deleteUser, resetDemoData, isDemoMode, adminSetPassword } from '../data/api.js';
import { EmptyState, Badge, Spinner } from '../components/ui.jsx';
import { useAuth } from '../AuthContext.jsx';
import CreateAccountModal from '../components/CreateAccountModal.jsx';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => listUsers().then(setUsers);
  useEffect(() => {
    refresh();
  }, []);

  const setStatus = async (target, status) => {
    await updateUser(target.id, { status });
    refresh();
  };

  const resetPassword = async (target) => {
    const next = window.prompt(
      `Set a new password for ${target.name}. They can change it after signing in.`
    );
    if (next === null) return;
    try {
      await adminSetPassword(target.id, next.trim());
      window.alert(`Password updated for ${target.name}.`);
    } catch (err) {
      window.alert(err.message || 'Could not reset that password.');
    }
  };

  const remove = async (target) => {
    if (!window.confirm(`Delete the account for ${target.name}?`)) return;
    await deleteUser(target.id);
    refresh();
  };

  const handleReset = async () => {
    if (!window.confirm('Reset ALL demo data back to the initial sample dataset? This cannot be undone.')) return;
    await resetDemoData();
    window.location.reload();
  };

  if (!users) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-xl">
          Every AMS login is created here — there is no public signup, so only people the school adds
          can reach the portal. Students sign in with their student number.
        </p>
        <div className="flex items-center gap-3">
          {isDemoMode() && (
            <button className="ams-btn-danger" onClick={handleReset}>
              Reset demo data
            </button>
          )}
          <button className="ams-btn-primary" onClick={() => setCreating(true)}>
            + Create account
          </button>
        </div>
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {users.length === 0 ? (
          <EmptyState message="No user accounts." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td className="font-semibold text-gray-800">
                    {account.name}
                    {account.id === me?.id && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                  </td>
                  <td>{account.email}</td>
                  <td>
                    <Badge value={account.role} />
                  </td>
                  <td>
                    <Badge value={account.status || 'active'} />
                  </td>
                  <td className="whitespace-nowrap space-x-2">
                    {account.status === 'pending' && (
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        onClick={() => setStatus(account, 'active')}
                      >
                        Approve
                      </button>
                    )}
                    {account.status === 'active' && account.id !== me?.id && (
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        onClick={() => setStatus(account, 'disabled')}
                      >
                        Disable
                      </button>
                    )}
                    {account.status === 'disabled' && (
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        onClick={() => setStatus(account, 'active')}
                      >
                        Re-enable
                      </button>
                    )}
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-ois-blue hover:bg-blue-100 transition-colors"
                      onClick={() => resetPassword(account)}
                    >
                      Reset password
                    </button>
                    {account.id !== me?.id && (
                      <button className="ams-btn-danger" onClick={() => remove(account)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <CreateAccountModal onClose={() => setCreating(false)} onCreated={refresh} />
      )}
    </div>
  );
}
