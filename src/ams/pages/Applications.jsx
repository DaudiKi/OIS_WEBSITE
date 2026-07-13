import { useEffect, useMemo, useState } from 'react';
import { listApplications, saveApplication, deleteApplication, saveStudent } from '../data/api.js';
import { Modal, EmptyState, Badge, Spinner } from '../components/ui.jsx';

const STATUSES = ['new', 'reviewing', 'accepted', 'rejected'];

export default function Applications() {
  const [applications, setApplications] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);

  const refresh = () =>
    listApplications().then((rows) =>
      setApplications(rows.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')))
    );
  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    if (!applications) return [];
    return statusFilter ? applications.filter((app) => app.status === statusFilter) : applications;
  }, [applications, statusFilter]);

  const setStatus = async (application, status) => {
    await saveApplication({ ...application, status });
    // When accepting an application, enroll the child as a student record.
    if (status === 'accepted') {
      await saveStudent({
        firstName: application.firstName,
        lastName: application.lastName,
        gender: application.gender,
        dob: application.dob,
        classId: '',
        parentName: application.parentName,
        parentPhone: application.phone,
        parentEmail: application.email,
        status: 'pending',
      });
    }
    setViewing(null);
    refresh();
  };

  const remove = async (application) => {
    if (!window.confirm('Delete this application?')) return;
    await deleteApplication(application.id);
    setViewing(null);
    refresh();
  };

  if (!applications) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 max-w-xl">
          Applications submitted through the website Apply form appear here. Accepting an application creates a
          pending student record.
        </p>
        <select className="ams-input sm:max-w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status} className="capitalize">
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="ams-card overflow-x-auto p-0">
        {visible.length === 0 ? (
          <EmptyState message="No applications to show." />
        ) : (
          <table className="ams-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Parent/Guardian</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((application) => (
                <tr key={application.id}>
                  <td className="font-semibold text-gray-800">
                    {application.studentName || `${application.firstName} ${application.lastName}`}
                  </td>
                  <td>{application.gradeApplying || '—'}</td>
                  <td>
                    {application.parentName}
                    <span className="block text-xs text-gray-400">{application.email}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <Badge value={application.status || 'new'} />
                  </td>
                  <td>
                    <button className="text-ois-blue text-sm font-semibold hover:underline" onClick={() => setViewing(application)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title="Application Details" onClose={() => setViewing(null)} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ['Student', viewing.studentName || `${viewing.firstName} ${viewing.lastName}`],
              ['Date of Birth', viewing.dob],
              ['Gender', viewing.gender],
              ['Grade Applying For', viewing.gradeApplying],
              ['Previous School', viewing.previousSchool],
              ['Parent/Guardian', viewing.parentName],
              ['Relationship', viewing.relationship],
              ['Email', viewing.email],
              ['Phone', viewing.phone],
              ['Address', viewing.address],
              ['Special Needs', viewing.specialNeeds],
              ['Heard About Us Via', viewing.referralSource],
              ['Comments', viewing.comments],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                <p className="text-gray-800 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatus(viewing, status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border-2 transition-colors ${
                    viewing.status === status
                      ? 'border-ois-blue bg-ois-blue text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button className="ams-btn-danger" onClick={() => remove(viewing)}>
              Delete Application
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
