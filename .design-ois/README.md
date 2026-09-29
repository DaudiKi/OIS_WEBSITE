# OrchardsWood redesign — design sources

Mockups for the public website, the AMS portal, and a proposed backend for
fees, clubs, e-learning, events, forms and ballots. Drawn as a proposal, not
as code to ship — nothing here is wired into the app; `src/` is untouched.

## Rebuilding / republishing the canvas

The published canvas is **generated** and is not tracked (see `.gitignore`).
It is assembled by the `/design` skill's helper, which only exists after that
skill is invoked — so re-seeding must be started by a person running
`/design` in a session, not by Claude on its own.

Once the skill's base directory is available:

```bash
cd .design-ois
ART=""; for f in *.dc.html; do ART="$ART --artboard $f"; done
node "<skill base>/seed-canvas.mjs" \
  --template "<skill base>/payload.template.html" \
  --out orchardswood-redesign.html \
  --title "OrchardsWood Redesign" \
  --canvas canvas.json $ART
node "<skill base>/seed-canvas.mjs" --check orchardswood-redesign.html
```

Then publish with the Artifact tool to the **existing** URL so the link stays
stable: `https://claude.ai/code/artifact/6c6b6554-1a4f-463f-82b6-4d18bbf21b39`

The live artifact currently shows the first 25 artboards. The 11 architecture
and billing screens below are in this directory but not yet published.

## Pages

| Page | Screens |
| --- | --- |
| Foundations | `Main` — the six design decisions and the reason for each |
| Backend architecture | `Architecture`, `BillingFlow` |
| Portal — fees & enrolment | `PackageBuilder`, `FeeStatement`, `ParentFees` |
| Portal — clubs & e-learning | `Clubs`, `Elearning`, `StudentModule` |
| Portal — events, forms & ballots | `Events`, `Surveys`, `Voting` |
| Public website | `Home`, `About`, `Apply`, `Gallery`, `Calendar` |
| Portal — dashboards | `Login`, `DashAdmin`, `DashTeacher`, `DashParent`, `DashStudent` |
| Portal — records | `Students`, `Teachers`, `Classes`, `Attendance`, `Grades` |
| Portal — report cards | `Reports`, `ReportEditor`, `ReportCard` (A4) |
| Portal — school operations | `Announcements`, `AmsCalendar`, `Applications`, `GalleryAdmin`, `Settings`, `Users` |

## The visual direction

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

## The backend proposal, in one paragraph

A PACE, a football club, a swimming slot, an e-learning module, a training
course and an event ticket are not six features — they are six rows in one
`catalogue_item` table. A pupil receives one through an `enrolment`, and every
enrolment produces an `invoice_line`. One flag on the catalogue item
(`billing_group`) decides whether the line lands in the school-fees section of
the statement or the extras section; another (`delivery`) decides whether the
enrolment grants portal access or adds the pupil to a register at school. The
seventh offering, whatever it turns out to be, then bills correctly without
anybody writing new billing code.

Sign-up forms are a front end to the same spine: submitting one creates an
enrolment, which prices it. Event tickets are catalogue items too, so a paid
ticket reaches the family's statement by the same path a club does, and a free
ticket is the same path priced at zero.

Student council ballots deliberately do **not** reuse the spine — they need
the opposite property (untraceability), so `vote` and `voted_marker` are two
tables with no key between them.

### Three things that are not matters of taste

- **Freeze the price on the enrolment.** An invoice line must carry the price
  it was sold at, not a pointer to the live catalogue price, or raising a fee
  retroactively rewrites already-issued invoices.
- **Money is `bigint`, never a float.** Rounding error compounds across
  hundreds of pupils until a termly total is wrong by an unaccountable amount.
- **Parents must be linkable to children first.** This is already the AMS's
  biggest gap; billing turns it from awkward into fatal, because a parent who
  cannot be linked to a pupil cannot be shown an invoice at all.

`BillingFlow` carries these plus five genuine policy questions — whether
non-payment closes portal access, who may add an extra, consent versus
payment, club capacity and waitlists, and ballot secrecy.

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
