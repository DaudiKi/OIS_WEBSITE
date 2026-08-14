// ICCE / A.C.E. domain rules for OrchardsWood report cards.
//
// The grading scale below is the official ICCE scale published in the
// ICCE Handbook (Africa) 2021 — Rev 0W, "ICCE Grading System" (p.39):
//
//     PACE Average per Module      Grade
//     98 - 100                     A*
//     96 - 97.99                   A
//     92 - 95.99                   B
//     88 - 91.99                   C
//     84 - 87.99                   D
//     80 - 83.99                   E
//
// The handbook also specifies that "PACE average scores should be rounded to
// two decimal places", which is what roundScore() below implements. Anything
// below 80% does not earn an ICCE grade — A.C.E. requires a PACE to be
// re-taken until it reaches the 80% minimum — so it is reported as "U".
//
// Administrators can override these bands in Settings; DEFAULT_GRADE_SCALE is
// only the starting point.

export const DEFAULT_GRADE_SCALE = [
  { grade: 'A*', min: 98, max: 100 },
  { grade: 'A', min: 96, max: 97.99 },
  { grade: 'B', min: 92, max: 95.99 },
  { grade: 'C', min: 88, max: 91.99 },
  { grade: 'D', min: 84, max: 87.99 },
  { grade: 'E', min: 80, max: 83.99 },
];

// A.C.E. requires 80% to pass a PACE Test.
export const PACE_PASS_MARK = 80;

export const UNGRADED = 'U';

/** Round to two decimal places, as the ICCE handbook requires. */
export function roundScore(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/** Average a list of PACE scores, rounded to 2dp. Returns null when empty. */
export function averageOf(scores) {
  const valid = (scores || []).map(Number).filter((n) => !Number.isNaN(n));
  if (!valid.length) return null;
  return roundScore(valid.reduce((sum, n) => sum + n, 0) / valid.length);
}

/** Map a percentage onto an ICCE grade using the supplied (or default) scale. */
export function gradeFor(average, scale = DEFAULT_GRADE_SCALE) {
  if (average === null || average === undefined || Number.isNaN(average)) return null;
  const value = Number(average);
  const band = [...scale]
    .sort((a, b) => b.min - a.min)
    .find((b) => value >= Number(b.min) && value <= Number(b.max) + 0.0001);
  return band ? band.grade : UNGRADED;
}

/* --------------------------- Subject catalogue --------------------------- */

// Default A.C.E. core subjects. Schools add level-specific names such as
// "Basic Literature 8" or "SA Science" per student, so this is a starting
// list rather than a fixed set.
export const DEFAULT_SUBJECTS = [
  'Maths',
  'English',
  'Science',
  'Social Studies',
  'Word Building',
  'Literature',
  'Bible Reading',
];

/* ------------------------ Desirable habits & traits ---------------------- */

export const TRAIT_SCALE = [
  { value: 4, label: 'Excellent' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Satisfactory' },
  { value: 1, label: 'Needs Improvement' },
];

export const TRAIT_GROUPS = [
  {
    key: 'work',
    title: 'Work Habits',
    traits: [
      'Follows directions',
      'Works well independently',
      'Does not disturb others',
      'Take care of materials',
      'Completes work required',
      'Achieve computer assignments',
    ],
  },
  {
    key: 'social',
    title: 'Social Traits',
    traits: [
      'Is courteous',
      'Gets along well with others',
      'Exhibits self-control',
      'Shows respect for others',
      'Responds well to correction',
      'Promotes school spirit',
    ],
  },
  {
    key: 'personal',
    title: 'Personal Traits',
    traits: [
      'Ability to establish own goals',
      'Successfully reaches goals',
      'Display flexibility',
      'Shows creativity',
      'General overall progress',
      'Attitude towards computer learning',
    ],
  },
];

export const ALL_TRAITS = TRAIT_GROUPS.flatMap((g) => g.traits);

/* ---------------------------- ICCE certificates -------------------------- */

// Certificate levels from the ICCE Handbook (Africa) 2021. Students enrolled
// at an ICCE level get the moderation notice printed on their report.
export const ICCE_LEVELS = [
  { value: '', label: 'Not enrolled with ICCE' },
  { value: 'Basic', label: 'Basic Certificate' },
  { value: 'Foundation', label: 'Foundation Certificate' },
  { value: 'Vocational', label: 'Vocational Certificate' },
  { value: 'General', label: 'General Certificate' },
  { value: 'Intermediate', label: 'Intermediate Certificate' },
  { value: 'Advanced', label: 'Advanced Certificate' },
  { value: 'Advanced Higher', label: 'Advanced Higher Certificate' },
];

export const ICCE_MODERATION_NOTICE =
  'Please note that as a result of this student being enrolled at an ICCE level, ' +
  'these PACE Scores % and grades are preliminary and are subject to change ' +
  'through the moderation process by the National Office.';

/* ------------------------------ Computation ------------------------------ */

/**
 * Compute every derived figure on a report from its raw PACE scores.
 *
 * Mirrors how OrchardsWood's existing report card is calculated:
 *  - each subject's average is the mean of its PACE scores
 *  - the overall average is the mean of the SUBJECT averages (not of every
 *    individual PACE score), matching the sample report card
 *  - "PACEs Completed" counts every recorded PACE score
 */
export function computeReport(report, scale = DEFAULT_GRADE_SCALE) {
  const subjects = (report?.subjects || []).map((subject) => {
    const scores = (subject.scores || [])
      .map((s) => (s === '' || s === null || s === undefined ? null : Number(s)))
      .filter((s) => s !== null && !Number.isNaN(s));
    const average = averageOf(scores);
    return {
      ...subject,
      scores,
      average,
      grade: gradeFor(average, scale),
      belowPass: scores.filter((s) => s < PACE_PASS_MARK),
    };
  });

  const withScores = subjects.filter((s) => s.average !== null);
  const overallAverage = averageOf(withScores.map((s) => s.average));
  const pacesCompleted = subjects.reduce((total, s) => total + s.scores.length, 0);

  return {
    subjects,
    overallAverage,
    overallGrade: gradeFor(overallAverage, scale),
    pacesCompleted,
    hasFailingScores: subjects.some((s) => s.belowPass.length > 0),
  };
}

/* -------------------------------- Status --------------------------------- */

export const REPORT_STATUS = {
  draft: {
    label: 'Draft',
    description: 'Being filled in by the supervisor.',
    badge: 'bg-gray-200 text-gray-700',
  },
  submitted: {
    label: 'Awaiting verification',
    description: 'Submitted and locked, waiting for the administrator.',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  returned: {
    label: 'Returned for correction',
    description: 'Sent back to the supervisor with notes.',
    badge: 'bg-orange-100 text-orange-800',
  },
  verified: {
    label: 'Verified',
    description: 'Checked by the administrator, not yet released to families.',
    badge: 'bg-blue-100 text-blue-800',
  },
  published: {
    label: 'Published',
    description: 'Released — visible to the student and their parents.',
    badge: 'bg-green-100 text-green-800',
  },
};

export const STATUS_ORDER = ['draft', 'submitted', 'returned', 'verified', 'published'];

/** Create a blank report for a student, seeded with the school's subject list. */
export function blankReport({ studentId, termId, subjects = DEFAULT_SUBJECTS }) {
  return {
    studentId,
    termId,
    status: 'draft',
    subjects: subjects.map((name) => ({ name, scores: [] })),
    traits: {},
    bibleMemory: ['', '', ''],
    comments: '',
    iccePreliminary: false,
    history: [],
  };
}
