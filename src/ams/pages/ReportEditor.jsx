import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import * as api from '../data/api.js';
import { Spinner, Modal } from '../components/ui.jsx';
import {
  TRAIT_GROUPS,
  TRAIT_SCALE,
  REPORT_STATUS,
  PACE_PASS_MARK,
  DEFAULT_GRADE_SCALE,
  computeReport,
} from '../data/icce.js';

/* A single PACE score cell. Commits on blur or Enter. */
function ScoreInput({ value, onCommit, onRemove, autoFocus }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);

  const commit = () => {
    const trimmed = String(draft).trim();
    if (trimmed === '') {
      onRemove?.();
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setDraft(value ?? '');
      return;
    }
    onCommit(num);
  };

  const below = value !== undefined && value !== '' && Number(value) < PACE_PASS_MARK;

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`w-16 text-center rounded-md border px-1.5 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ois-blue/40 ${
        below ? 'border-red-400 bg-red-50 text-red-700 font-semibold' : 'border-gray-300'
      }`}
      value={draft}
      autoFocus={autoFocus}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
        if (e.key === 'Escape') setDraft(value ?? '');
      }}
      aria-label="PACE score"
    />
  );
}

export default function ReportEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [student, setStudent] = useState(null);
  const [term, setTerm] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // { action, title, needsNote }
  const [note, setNote] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const dirty = useRef(false);
  const saveTimer = useRef(null);

  const load = useCallback(async () => {
    const [r, cfg, terms, students] = await Promise.all([
      api.getReport(id),
      api.getSettings(),
      api.listTerms(),
      api.listStudents(),
    ]);
    if (!r) {
      setError('That report no longer exists.');
      setLoading(false);
      return;
    }
    setReport(r);
    setSettings(cfg);
    setTerm(terms.find((t) => t.id === r.termId) || null);
    setStudent(students.find((s) => s.id === r.studentId) || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const scale = settings?.gradeScale || DEFAULT_GRADE_SCALE;
  const computed = useMemo(() => (report ? computeReport(report, scale) : null), [report, scale]);

  const editable = report && (report.status === 'draft' || report.status === 'returned');
  const isAdmin = user?.role === 'admin';
  const canSubmit = editable && (user?.role === 'teacher' || isAdmin);

  /* ---------------------------- Autosaving ----------------------------- */

  const scheduleSave = useCallback(
    (next) => {
      dirty.current = true;
      setReport(next);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await api.saveReport(next);
          dirty.current = false;
          setSavedAt(new Date());
          setError('');
        } catch (err) {
          setError(`Could not save: ${err.message}`);
        } finally {
          setSaving(false);
        }
      }, 700);
    },
    []
  );

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const handler = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  /* ------------------------------ Mutators ----------------------------- */

  const patch = (changes) => scheduleSave({ ...report, ...changes });

  const updateSubject = (index, scores) => {
    const subjects = report.subjects.map((s, i) => (i === index ? { ...s, scores } : s));
    patch({ subjects });
  };

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    if (report.subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError('That subject is already on this report.');
      return;
    }
    patch({ subjects: [...report.subjects, { name, scores: [] }] });
    setNewSubject('');
    setError('');
  };

  const removeSubject = (index) => patch({ subjects: report.subjects.filter((_, i) => i !== index) });

  const setTrait = (trait, value) => patch({ traits: { ...report.traits, [trait]: value } });

  const setBible = (index, value) => {
    const bibleMemory = [...(report.bibleMemory || [])];
    bibleMemory[index] = value;
    patch({ bibleMemory });
  };

  /* ----------------------------- Transitions --------------------------- */

  const missing = useMemo(() => {
    if (!report || !computed) return [];
    const problems = [];
    if (computed.pacesCompleted === 0) problems.push('No PACE scores have been recorded.');
    const emptySubjects = computed.subjects.filter((s) => s.scores.length === 0).map((s) => s.name);
    if (emptySubjects.length) problems.push(`No scores for: ${emptySubjects.join(', ')}.`);
    const rated = Object.keys(report.traits || {}).length;
    const total = TRAIT_GROUPS.reduce((n, g) => n + g.traits.length, 0);
    if (rated < total) problems.push(`${total - rated} of ${total} habits and traits still unrated.`);
    if (!(report.comments || '').trim()) problems.push('No supervisor comment written.');
    return problems;
  }, [report, computed]);

  const runTransition = async (action) => {
    setError('');
    try {
      clearTimeout(saveTimer.current);
      if (dirty.current) {
        await api.saveReport(report);
        dirty.current = false;
      }
      const updated = await api.transitionReport(id, action, { actor: user?.name, note });
      setReport(updated);
      setConfirm(null);
      setNote('');
      if (action === 'publish') navigate('/reports');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;
  if (!report || !student) {
    return (
      <div className="ams-card">
        <p className="text-gray-600">{error || 'Report not found.'}</p>
        <Link to="/reports" className="text-ois-blue hover:underline text-sm">
          Back to reports
        </Link>
      </div>
    );
  }

  const statusMeta = REPORT_STATUS[report.status];

  return (
    <div className="space-y-6">
      {/* ------------------------------ Header ---------------------------- */}
      <div className="ams-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-gray-500">
              <span className="font-mono">{student.studentNumber}</span> · {term?.name} {term?.year} ·{' '}
              {statusMeta?.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`ams-badge ${statusMeta?.badge}`}>{statusMeta?.label}</span>
            <Link to={`/reports/${id}/card`} className="ams-btn-secondary text-sm">
              Preview card
            </Link>
          </div>
        </div>

        {report.status === 'returned' && report.returnNote && (
          <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3">
            <p className="text-sm font-semibold text-orange-800">Returned for correction</p>
            <p className="text-sm text-orange-700 mt-1">{report.returnNote}</p>
          </div>
        )}

        {/* Live totals — always computed, never typed. */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['PACEs completed', computed.pacesCompleted],
            ['Overall average', computed.overallAverage === null ? '—' : `${computed.overallAverage.toFixed(2)}%`],
            ['Overall grade', computed.overallGrade || '—'],
            ['Subjects', report.subjects.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-lg font-bold text-gray-800 tabular-nums">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          {saving
            ? 'Saving…'
            : savedAt
              ? `Saved at ${savedAt.toLocaleTimeString()}`
              : 'Changes save automatically as you type.'}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* --------------------------- PACE scores -------------------------- */}
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">PACE scores</h3>
        <p className="text-sm text-gray-500 mb-4">
          Record each PACE test score as the student completes it. Averages and ICCE grades update
          instantly. Scores below {PACE_PASS_MARK}% are highlighted — A.C.E. requires those PACEs to be repeated.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left pb-2 w-48">Subject</th>
                <th className="text-left pb-2">PACE scores</th>
                <th className="text-center pb-2 w-24">Average</th>
                <th className="text-center pb-2 w-20">Grade</th>
                {editable && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {computed.subjects.map((subject, index) => (
                <tr key={subject.name}>
                  <td className="py-3 pr-3 font-medium text-gray-800 align-top">{subject.name}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {subject.scores.map((score, sIdx) => (
                        <ScoreInput
                          key={sIdx}
                          value={score}
                          onCommit={(num) => {
                            const scores = [...subject.scores];
                            scores[sIdx] = num;
                            updateSubject(index, scores);
                          }}
                          onRemove={() =>
                            updateSubject(index, subject.scores.filter((_, i) => i !== sIdx))
                          }
                        />
                      ))}
                      {editable && (
                        <ScoreInput
                          key={`new-${subject.scores.length}`}
                          value=""
                          onCommit={(num) => updateSubject(index, [...subject.scores, num])}
                          onRemove={() => {}}
                        />
                      )}
                      {!editable && subject.scores.length === 0 && (
                        <span className="text-gray-400">No scores recorded</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center tabular-nums font-medium">
                    {subject.average === null ? '—' : `${subject.average.toFixed(2)}%`}
                  </td>
                  <td className="py-3 text-center font-bold text-gray-800">{subject.grade || '—'}</td>
                  {editable && (
                    <td className="py-3 text-right">
                      <button
                        onClick={() => removeSubject(index)}
                        className="text-gray-300 hover:text-red-500"
                        aria-label={`Remove ${subject.name}`}
                        title="Remove subject"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editable && (
          <div className="mt-4 flex gap-2">
            <input
              className="ams-input flex-1 sm:max-w-xs"
              placeholder="Add a subject (e.g. Basic Literature 9)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button className="ams-btn-secondary" onClick={addSubject}>
              Add
            </button>
          </div>
        )}
      </div>

      {/* -------------------------- Habits & traits ----------------------- */}
      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-1">Desirable habits and traits</h3>
        <p className="text-sm text-gray-500 mb-4">
          {TRAIT_SCALE.map((s) => `${s.value} — ${s.label}`).join(' · ')}
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {TRAIT_GROUPS.map((group) => (
            <div key={group.key}>
              <h4 className="font-semibold text-gray-700 text-sm mb-2">{group.title}</h4>
              <div className="space-y-2">
                {group.traits.map((trait) => (
                  <div key={trait} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600 leading-tight">{trait}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {TRAIT_SCALE.map((s) => (
                        <button
                          key={s.value}
                          disabled={!editable}
                          onClick={() => setTrait(trait, s.value)}
                          title={s.label}
                          className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                            report.traits?.[trait] === s.value
                              ? 'bg-ois-blue text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:hover:bg-gray-100'
                          }`}
                        >
                          {s.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------- Bible memory & comments -------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="ams-card">
          <h3 className="font-bold text-gray-800 mb-3">Bible memory</h3>
          <div className="space-y-2">
            {Array.from({ length: Math.max(3, (report.bibleMemory || []).length) }).map((_, i) => (
              <input
                key={i}
                className="ams-input"
                placeholder={`Passage ${i + 1} (e.g. Isaiah 58:8-12)`}
                value={report.bibleMemory?.[i] || ''}
                disabled={!editable}
                onChange={(e) => setBible(i, e.target.value)}
              />
            ))}
          </div>
          {editable && (report.bibleMemory || []).length < 5 && (
            <button
              className="mt-2 text-sm text-ois-blue hover:underline"
              onClick={() => patch({ bibleMemory: [...(report.bibleMemory || []), ''] })}
            >
              + Add another passage
            </button>
          )}
        </div>

        <div className="ams-card">
          <h3 className="font-bold text-gray-800 mb-3">Supervisor&rsquo;s comments</h3>
          <textarea
            className="ams-input h-32 resize-none"
            placeholder="A short comment on the student's progress, character and effort this term."
            value={report.comments || ''}
            disabled={!editable}
            onChange={(e) => patch({ comments: e.target.value })}
          />
        </div>
      </div>

      {/* ------------------------------ Actions --------------------------- */}
      <div className="ams-card">
        {missing.length > 0 && editable && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Before submitting</p>
            <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-0.5">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {canSubmit && (
            <button
              className="ams-btn-primary"
              onClick={() => setConfirm({ action: 'submit', title: 'Submit for verification' })}
            >
              Submit for verification
            </button>
          )}
          {isAdmin && report.status === 'submitted' && (
            <>
              <button
                className="ams-btn-primary"
                onClick={() => setConfirm({ action: 'verify', title: 'Verify this report' })}
              >
                Verify
              </button>
              <button
                className="ams-btn-secondary"
                onClick={() =>
                  setConfirm({ action: 'return', title: 'Return for correction', needsNote: true })
                }
              >
                Return for correction
              </button>
            </>
          )}
          {isAdmin && report.status === 'verified' && (
            <>
              <button
                className="ams-btn-primary"
                onClick={() => setConfirm({ action: 'publish', title: 'Publish to the family' })}
              >
                Publish to student &amp; parents
              </button>
              <button
                className="ams-btn-secondary"
                onClick={() =>
                  setConfirm({ action: 'return', title: 'Return for correction', needsNote: true })
                }
              >
                Return for correction
              </button>
            </>
          )}
          {isAdmin && report.status === 'published' && (
            <button
              className="ams-btn-secondary"
              onClick={() => setConfirm({ action: 'unpublish', title: 'Withdraw from the family' })}
            >
              Unpublish
            </button>
          )}
          <Link to="/reports" className="ams-btn-secondary">
            Back to reports
          </Link>
        </div>

        {/* Audit trail */}
        {(report.history || []).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-2">History</h4>
            <ul className="space-y-1 text-sm text-gray-500">
              {report.history.map((h, i) => (
                <li key={i}>
                  <span className="font-medium text-gray-700 capitalize">{h.action}</span> by {h.by} ·{' '}
                  {new Date(h.at).toLocaleString()}
                  {h.note ? ` — “${h.note}”` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ---------------------------- Confirm modal ----------------------- */}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          {confirm.action === 'submit' && missing.length > 0 && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              This report is incomplete. You can still submit it, but the administrator will see the gaps.
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">
            {confirm.action === 'submit' &&
              'The report locks and goes to the administrator for checking. You can still be sent it back for corrections.'}
            {confirm.action === 'verify' &&
              'Marks the report as checked. It is not visible to the family until you publish it.'}
            {confirm.action === 'publish' &&
              'The family will be able to see and download this report immediately.'}
            {confirm.action === 'return' &&
              'Sends the report back to the supervisor so they can correct it. Explain what needs changing.'}
            {confirm.action === 'unpublish' &&
              'Removes the report from the family dashboard. They will no longer be able to download it.'}
          </p>
          {confirm.needsNote && (
            <textarea
              className="ams-input h-24 resize-none mb-4"
              placeholder="What needs correcting?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button className="ams-btn-secondary" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="ams-btn-primary"
              onClick={() => runTransition(confirm.action)}
              disabled={confirm.needsNote && !note.trim()}
            >
              {confirm.title}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
