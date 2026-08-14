import { Fragment } from 'react';
import { TRAIT_GROUPS, TRAIT_SCALE, ICCE_MODERATION_NOTICE, computeReport } from '../data/icce.js';

/**
 * The OrchardsWood report card, laid out to A4 and print-exact.
 *
 * Rendered identically on screen and on paper — the print stylesheet in
 * src/styles/report.css only strips the surrounding app chrome and fixes the
 * page size, so "Download PDF" produces exactly what the supervisor previewed.
 *
 * Two pages: academic results, then desirable habits and traits.
 */

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function PageFrame({ school, student, children }) {
  return (
    <div className="rc-page">
      <div className="rc-rail">
        <div className="rc-rail-green">
          <span className="rc-rail-text">REPORT CARD</span>
        </div>
        <div className="rc-rail-blue">
          <div className="rc-rail-contacts">
            <span className="rc-rail-line">{school.website}</span>
            <span className="rc-rail-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18z" />
              </svg>
            </span>
            <span className="rc-rail-line">{school.phone}</span>
            <span className="rc-rail-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
              </svg>
            </span>
            <span className="rc-rail-line">{school.email}</span>
            <span className="rc-rail-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5h18v14H3z" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M3 6l9 7 9-7" fill="none" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="rc-body">
        <header className="rc-header">
          <div className="rc-logo">
            <img src="assets/icons/oisLogo.png" alt="OrchardsWood International School" />
          </div>
          <div className="rc-titles">
            <h1>
              ORCHARDSWOOD
              <br />
              INTERNATIONAL SCHOOL
            </h1>
            <p>{school.address.toUpperCase()}</p>
          </div>
          <div className="rc-photo">
            {student.photo ? (
              <img src={student.photo} alt={`${student.firstName} ${student.lastName}`} />
            ) : (
              <div className="rc-photo-empty">
                {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="rc-content">{children}</div>
      </div>
    </div>
  );
}

export default function ReportDocument({ report, student, term, school, supervisors = [], gradeScale }) {
  const computed = computeReport(report, gradeScale);
  const traits = report.traits || {};
  const bible = (report.bibleMemory || []).filter(Boolean);

  return (
    <div className="rc-root">
      {/* ------------------------- Page 1: academic ------------------------ */}
      <PageFrame school={school} student={student}>
        <dl className="rc-fields">
          <div className="rc-field">
            <dt>Student:</dt>
            <dd className="rc-underline">{`${student.firstName} ${student.lastName}`}</dd>
          </div>
          <div className="rc-field">
            <dt>Teachers:</dt>
            <dd className="rc-underline">{supervisors.map((s) => s.name).join(' & ') || '—'}</dd>
          </div>
          <div className="rc-field rc-field-row">
            <span>
              <dt>Grade:</dt>
              <dd className="rc-underline rc-narrow">{student.gradeLabel || term.gradeLabel || student.classLabel}</dd>
            </span>
            <span>
              <dt>Term:</dt>
              <dd className="rc-underline rc-narrow">{term.name?.replace(/^Term\s+/i, '') || term.name}</dd>
            </span>
            <span>
              <dt>Year:</dt>
              <dd className="rc-underline rc-narrow">{term.year}</dd>
            </span>
          </div>
        </dl>

        <table className="rc-table rc-table-scores">
          <thead>
            <tr>
              <th>Subject</th>
              <th>PACE Scores %</th>
              <th>Average</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {computed.subjects.map((subject) => (
              <tr key={subject.name}>
                <td className="rc-subject">{subject.name}</td>
                <td className="rc-scores">{subject.scores.join(', ')}</td>
                <td className="rc-avg">{subject.average === null ? '' : `${subject.average.toFixed(2)}%`}</td>
                <td className="rc-grade">{subject.grade || ''}</td>
              </tr>
            ))}
            <tr className="rc-overall-row">
              <td className="rc-subject">Overall Grade</td>
              <td></td>
              <td className="rc-avg">
                {computed.overallAverage === null ? '' : `${computed.overallAverage.toFixed(2)}%`}
              </td>
              <td className="rc-grade">{computed.overallGrade || ''}</td>
            </tr>
          </tbody>
          {student.icceLevel ? (
            <tfoot>
              <tr>
                <td colSpan={4} className="rc-icce-note">
                  {ICCE_MODERATION_NOTICE}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        <table className="rc-table rc-table-summary">
          <tbody>
            <tr>
              <td className="rc-label">Paces Completed</td>
              <td className="rc-value">{computed.pacesCompleted}</td>
            </tr>
            <tr>
              <td className="rc-label">Overall PACE Score Average</td>
              <td className="rc-value">
                {computed.overallAverage === null ? '' : `${computed.overallAverage.toFixed(2)}%`}
              </td>
            </tr>
            <tr>
              <td className="rc-label">Overall Term Grade</td>
              <td className="rc-value">{computed.overallGrade || ''}</td>
            </tr>
          </tbody>
        </table>

        {bible.length > 0 && (
          <table className="rc-table rc-table-bible">
            <tbody>
              <tr>
                <td className="rc-label">Bible Memory</td>
                {bible.map((verse, i) => (
                  <td key={i} className="rc-verse">
                    {verse}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        <table className="rc-table rc-table-signatures">
          <tbody>
            <tr>
              <td className="rc-label">Date</td>
              <td className="rc-value">{formatDate(report.publishedAt || report.verifiedAt || new Date().toISOString())}</td>
            </tr>
            <tr>
              <td className="rc-label">Supervisor Signature</td>
              <td className="rc-sign"></td>
            </tr>
            <tr>
              <td className="rc-label">Parent Signature</td>
              <td className="rc-sign"></td>
            </tr>
            <tr>
              <td className="rc-label rc-tall">Principal&rsquo;s Signature</td>
              <td className="rc-sign"></td>
            </tr>
          </tbody>
        </table>

        <div className="rc-comments">
          <p className="rc-comments-title">Comments:</p>
          <p className="rc-comments-body">{report.comments}</p>
        </div>
      </PageFrame>

      {/* -------------------------- Page 2: traits ------------------------- */}
      <PageFrame school={school} student={student}>
        <table className="rc-table rc-table-traits">
          <thead>
            <tr>
              <th colSpan={2}>Desirable Habits and Traits</th>
            </tr>
          </thead>
          <tbody>
            <tr className="rc-spacer">
              <td colSpan={2}></td>
            </tr>
            <tr className="rc-scale-row">
              <td colSpan={2}>
                <div className="rc-scale">
                  {TRAIT_SCALE.map((s) => (
                    <span key={s.value}>
                      {s.value}-{s.label}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
            {TRAIT_GROUPS.map((group) => (
              <Fragment key={group.key}>
                <tr className="rc-spacer">
                  <td colSpan={2}></td>
                </tr>
                <tr className="rc-group-row">
                  <td className="rc-group-title">{group.title}</td>
                  <td></td>
                </tr>
                {group.traits.map((trait) => (
                  <tr key={trait}>
                    <td className="rc-trait">{trait}</td>
                    <td className="rc-rating">{traits[trait] ?? ''}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr className="rc-spacer">
              <td colSpan={2}></td>
            </tr>
            <tr>
              <td colSpan={2} className="rc-trait-footer">
                {school.traitFooter}
              </td>
            </tr>
          </tbody>
        </table>
      </PageFrame>
    </div>
  );
}
