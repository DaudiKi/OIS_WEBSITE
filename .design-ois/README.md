# OrchardsWood redesign — design sources

Mockups for the public website and the AMS portal, drawn as a proposal rather
than as code to ship. Nothing here is wired into the app; `src/` is untouched.

## What is here

Each `*.dc.html` file is one screen. `canvas.json` places them on a pan/zoom
canvas and groups them into pages:

| Page | Screens |
| --- | --- |
| Foundations | `Main` — the six design decisions and the reason for each |
| Public website | `Home`, `About`, `Apply`, `Gallery`, `Calendar` |
| Portal — dashboards | `Login`, `DashAdmin`, `DashTeacher`, `DashParent`, `DashStudent` |
| Portal — records | `Students`, `Teachers`, `Classes`, `Attendance`, `Grades` |
| Portal — report cards | `Reports`, `ReportEditor`, `ReportCard` (A4) |
| Portal — school operations | `Announcements`, `AmsCalendar`, `Applications`, `GalleryAdmin`, `Settings`, `Users` |

## The direction

Refine the existing identity rather than replace it. The OIS blue (`#2c64ac`)
and green stay, because families already recognise them. What changes:

1. The blue-to-green gradient retires — it appears in 15+ places across every
   stylesheet and is the most dating element in the current design.
2. Blue means interaction, green means affirmation. Today the two are used
   interchangeably, so neither carries meaning.
3. `#63b647` never carries text. On white it measures ~2.4:1, below the 4.5:1
   minimum; `#35661F` takes over wherever green becomes words.
4. Newsreader for display type, Figtree for interface and data. The OIS
   wordmark itself is unchanged — that is a brand asset, not interface type.
5. Report status gets a fixed colour and shape, used identically everywhere.
6. One identity, two densities: the public site breathes, the portal tightens.

## Screens that show a fix, not just a repaint

Several mockups deliberately depict behaviour the current build does not have.
These correspond to findings in the system audit:

- `DashParent` — shows children, which today it cannot: nothing in the live
  system ever writes a parent's `childIds`, so the section renders empty.
- `DashTeacher` / `Teachers` — "my classes" and "my students" depend on a
  `teacherId` on the account, and no such column exists on `profiles`.
- `Users` — adds the child picker that makes the parent portal work at all.
- `GalleryAdmin` — real file upload; today staff must supply a path to an
  image already hosted elsewhere.
- `Settings` — the default student password becomes editable; today it lives
  only in the database and source.
- `Applications` — class placement at the point of acceptance.
- `AmsCalendar` / `Calendar` — one source of dates, fixing events that save
  correctly but never reach the dashboard or public site.
- `Apply` — confirms delivery rather than swallowing a failed save.
- `Home` — initial monograms replace three testimonial photo files that are
  referenced but do not exist.

## Rebuilding the canvas

The published canvas is generated; it is not tracked here (see `.gitignore`).
Regenerate it with the `/design` skill's helper, passing every `*.dc.html`
plus `canvas.json`, then republish to the existing artifact URL so the link
stays stable.
