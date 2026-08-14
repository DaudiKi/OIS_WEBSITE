import { useCallback, useEffect, useState } from 'react';
import * as api from '../data/api.js';
import { Spinner, Modal } from '../components/ui.jsx';
import { DEFAULT_GRADE_SCALE, DEFAULT_SUBJECTS } from '../data/icce.js';

/**
 * School-level configuration: the ICCE grading scale used to turn PACE
 * averages into grades, the default subject list new reports start from,
 * academic terms, and the details printed on the report card.
 */
export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [editingTerm, setEditingTerm] = useState(null);

  const load = useCallback(async () => {
    const [cfg, t] = await Promise.all([api.getSettings(), api.listTerms()]);
    setSettings(cfg);
    setTerms(t.sort((a, b) => `${a.year}${a.number}`.localeCompare(`${b.year}${b.number}`)));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await api.saveSettings(patch);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1800);
  };

  const updateBand = (index, field, value) => {
    const gradeScale = settings.gradeScale.map((b, i) =>
      i === index ? { ...b, [field]: field === 'grade' ? value : Number(value) } : b
    );
    save({ gradeScale });
  };

  const saveTerm = async (term) => {
    await api.saveTerm(term);
    setEditingTerm(null);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {status && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {status}
        </div>
      )}

      {/* ---------------------------- Grade scale --------------------------- */}
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">ICCE grading scale</h3>
        <p className="text-sm text-gray-500 mb-4">
          PACE averages are converted to grades using these bands. The defaults are the official scale
          from the <em>ICCE Handbook (Africa) 2021 — Rev 0W</em>, page 39. Averages are rounded to two
          decimal places before grading, as the handbook requires.
        </p>

        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left pb-2 pr-6">Grade</th>
                <th className="text-left pb-2 pr-3">From&nbsp;%</th>
                <th className="text-left pb-2">To&nbsp;%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settings.gradeScale.map((band, i) => (
                <tr key={i}>
                  <td className="py-2 pr-6">
                    <input
                      className="ams-input w-20 text-center font-bold"
                      value={band.grade}
                      onChange={(e) => updateBand(i, 'grade', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      step="0.01"
                      className="ams-input w-24 text-center tabular-nums"
                      value={band.min}
                      onChange={(e) => updateBand(i, 'min', e.target.value)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      className="ams-input w-24 text-center tabular-nums"
                      value={band.max}
                      onChange={(e) => updateBand(i, 'max', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="ams-btn-secondary text-sm"
            onClick={() => save({ gradeScale: DEFAULT_GRADE_SCALE.map((b) => ({ ...b })) })}
          >
            Reset to ICCE defaults
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          An average below the lowest band scores &ldquo;U&rdquo;. A.C.E. requires a PACE test to reach 80%
          before it is counted as passed.
        </p>
      </div>

      {/* ---------------------------- Terms -------------------------------- */}
      <div className="ams-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Academic terms</h3>
            <p className="text-sm text-gray-500">Reports are filled in against the open term.</p>
          </div>
          <button
            className="ams-btn-primary text-sm"
            onClick={() =>
              setEditingTerm({
                name: '',
                number: terms.length + 1,
                year: new Date().getFullYear(),
                startDate: '',
                endDate: '',
                status: 'planned',
              })
            }
          >
            Add term
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {terms.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">
                  {t.name} {t.year}
                </p>
                <p className="text-xs text-gray-500">
                  {t.startDate || '—'} to {t.endDate || '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`ams-badge ${
                    t.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : t.status === 'closed'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {t.status}
                </span>
                <button className="text-ois-blue hover:underline text-sm" onClick={() => setEditingTerm(t)}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------- Default subjects ----------------------- */}
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">Default subjects</h3>
        <p className="text-sm text-gray-500 mb-3">
          New reports start with these subjects. Supervisors can add level-specific ones such as
          &ldquo;Basic Literature 9&rdquo; or &ldquo;SA Science&rdquo; on any individual report.
        </p>
        <textarea
          className="ams-input h-28 resize-none font-mono text-sm"
          value={(settings.subjects || DEFAULT_SUBJECTS).join('\n')}
          onChange={(e) =>
            setSettings({ ...settings, subjects: e.target.value.split('\n') })
          }
          onBlur={(e) =>
            save({ subjects: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
          }
        />
        <p className="text-xs text-gray-400 mt-1">One subject per line.</p>
      </div>

      {/* --------------------------- School details ------------------------- */}
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">School details on the report card</h3>
        <p className="text-sm text-gray-500 mb-4">These appear in the header and side rail of every report.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['name', 'School name'],
            ['address', 'Address'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['website', 'Website'],
            ['motto', 'Motto'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor={`school-${key}`}>
                {label}
              </label>
              <input
                id={`school-${key}`}
                className="ams-input"
                value={settings.school?.[key] || ''}
                onChange={(e) => setSettings({ ...settings, school: { ...settings.school, [key]: e.target.value } })}
                onBlur={(e) => save({ school: { ...settings.school, [key]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------- Term modal ---------------------------- */}
      {editingTerm && (
        <Modal title={editingTerm.id ? 'Edit term' : 'Add term'} onClose={() => setEditingTerm(null)}>
          <div className="space-y-3">
            <input
              className="ams-input"
              placeholder="Term name (e.g. Term Two)"
              value={editingTerm.name}
              onChange={(e) => setEditingTerm({ ...editingTerm, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                className="ams-input"
                placeholder="Number"
                value={editingTerm.number}
                onChange={(e) => setEditingTerm({ ...editingTerm, number: Number(e.target.value) })}
              />
              <input
                type="number"
                className="ams-input"
                placeholder="Year"
                value={editingTerm.year}
                onChange={(e) => setEditingTerm({ ...editingTerm, year: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="ams-input"
                value={editingTerm.startDate || ''}
                onChange={(e) => setEditingTerm({ ...editingTerm, startDate: e.target.value })}
              />
              <input
                type="date"
                className="ams-input"
                value={editingTerm.endDate || ''}
                onChange={(e) => setEditingTerm({ ...editingTerm, endDate: e.target.value })}
              />
            </div>
            <select
              className="ams-input"
              value={editingTerm.status}
              onChange={(e) => setEditingTerm({ ...editingTerm, status: e.target.value })}
            >
              <option value="planned">Planned</option>
              <option value="open">Open — reports being filled in</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button className="ams-btn-secondary" onClick={() => setEditingTerm(null)}>
              Cancel
            </button>
            <button className="ams-btn-primary" onClick={() => saveTerm(editingTerm)}>
              Save term
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
