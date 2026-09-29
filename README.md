<div align="center">
  <img src="public/assets/icons/oisLogo.png" alt="OrchardsWood International School Logo" width="180px" style="margin-bottom: 20px;"/>
  
  # OrchardsWood International School Website
  
  [![Website Status](https://img.shields.io/badge/status-active-success.svg)](#)
  [![Tech Stack](https://img.shields.io/badge/tech--stack-React%20%7C%20Vite%20%7C%20Tailwind%20%7C%20GSAP-0072BC.svg)](#)
  [![License: ISC](https://img.shields.io/badge/License-ISC-4CAF50.svg)](https://opensource.org/licenses/ISC)

  *Providing a nurturing Christian education from Preschool to High School in Buziga, Kampala.*
</div>

---

## Overview

The **OrchardsWood International School (OIS)** website is a premium, interactive, and responsive web portal built to connect parents, prospective students, and educators with the school's mission, calendar, gallery, and admissions office.

Designed with modern typography (Inter & Righteous), rich gradients, dynamic GSAP scroll-triggered animations, and a live Google Calendar integration, this website provides a state-of-the-art user experience for visitors exploring OIS.

Alongside the public site, the project ships the **OIS Academic Management System (AMS)** — a role-based portal for administrators, teachers, parents, and students covering enrolment, attendance, grades, events, and announcements.

---

## Technology Stack & Libraries

This project uses a modern web stack tailored for high performance, smooth animation, and rapid development:

| Category | Technology / Library | Description |
| :--- | :--- | :--- |
| **UI Framework** | [React 18](https://react.dev/) & [Vite 5](https://vitejs.dev/) | Component-driven pages compiled by a multi-page Vite build, so every original URL is preserved. |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) & PostCSS | Curated colors matching the school identity, custom utility classes, and optimized building. |
| **Animation Core** | [GSAP](https://gsap.com/) & [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Smooth micro-animations, floating interactive elements, and text/card reveals on scroll. |
| **Routing (AMS)** | [React Router](https://reactrouter.com/) | Client-side routing for the Academic Management System single-page app. |
| **Calendar** | Custom React calendar & [Google Calendar](https://calendar.google.com/) embed | Interactive month grid built from the school's term CSV and AMS-published events, plus the official embed. |
| **Gallery Engine** | Custom React grid & lightbox | Category filters, entrance animations, and a keyboard-navigable fullscreen viewer — no jQuery required. |
| **Admissions** | Google Forms + AMS pipeline | Applications submit to the school's existing Google Form and feed the AMS applications module. |
| **AMS Backend** | localStorage (demo) or [Supabase](https://supabase.com/) | Runs fully offline on static hosting by default; switches to Postgres + Auth via configuration. |
| **Quality Control** | [Prettier](https://prettier.io/) & [ESLint](https://eslint.org/) | Strict guidelines enforcing unified code formatting and static code quality analysis. |

---

## Brand Design System

To retain visual consistency, all custom Tailwind utilities map to the core colors of the OIS brand identity:

* **OIS Blue (`#0072BC`)**: The primary corporate brand color, symbolizing trust, wisdom, and excellence.
* **OIS Green (`#4CAF50`)**: The secondary school color representing growth, nature (woodlands), and life.
* **OIS Light Blue (`#00A0E3` / `#3a7bd5`)**: Accent color used for buttons, indicators, and hover gradients.
* **Body Text (`#333333`)**: Deep charcoal gray selected to guarantee optimal readability and WCAG accessibility.

---

## Project Structure

```bash
OIS_WEBSITE/
├── public/                     # Static assets copied verbatim into the build
│   ├── assets/                 # Static media and assets
│   │   ├── icons/              # Logos, locations, and action icons (e.g., oisLogo.png)
│   │   └── images/             # Backgrounds, cards, photos (e.g., Home Background.jpg)
│   ├── ams-config.js           # AMS backend configuration (demo mode by default)
│   ├── ois_august_calendar.csv # Academic term calendar data
│   └── favicon.ico             # School logo browser tab icon
├── src/
│   ├── components/             # Shared layout (TopBar, Header, Footer, SocialIcons)
│   ├── pages/                  # Public pages (Home, About, Apply, Gallery, Calendar)
│   ├── entries/                # Per-page React entry points
│   ├── styles/                 # Tailwind entry + per-page stylesheets
│   ├── lib/                    # CSV parsing, event merging, gallery data
│   └── ams/                    # Academic Management System single-page app
│       ├── pages/              # Dashboard, Students, Teachers, Attendance, Grades, ...
│       ├── components/         # AMS layout and shared UI primitives
│       └── data/               # localStorage store, Supabase adapter, unified API
├── supabase/schema.sql         # Database schema for optional Supabase backend
├── index.html                  # Homepage featuring GSAP scroll animations
├── about.html                  # OIS Mission, Vision, and Staff values
├── apply.html                  # Multi-step Interactive Admissions Form
├── calendar.html               # Calendar UI (interactive grid + Google Calendar)
├── gallery.html                # Filterable image gallery with lightbox
├── ams.html                    # Academic Management System portal
├── vite.config.js              # Multi-page build configuration
├── tailwind.config.js          # Tailwind theme configurations (extended brand colors)
├── postcss.config.cjs          # PostCSS configuration
└── package.json                # Project script execution and package dependencies
```

---

## Interactive Pages & Features

### 1. Home Page — `index.html`
The central portal of OrchardsWood International School.
- **GSAP ScrollTrigger Card Reveal**: Cards slide and fade smoothly into view as the user scrolls.
- **Wave Title Animation**: Headline text characters feature a wave-like vertical floating motion.
- **Testimonials Section**: Features testimonials overlaying a dynamic, rotating CSS spiral background.
- **School Portal Button**: A custom-designed shortcut pointing to the OIS Academic Management System (AMS).

### 2. About Page — `about.html`
Showcases the school's heritage, foundational Christian values, and academic structure.
- Highlights the ACE curriculum (Accelerated Christian Education), PACEs, and ICCE certificates.
- Features detailed sections outlining the school's **Vision**, **Mission**, **Core Values**, and leadership message.

### 3. Academic Calendar — `calendar.html`
Provides parents and students with a clear overview of holidays, events, and assessments.
- **Interactive Month Grid**: Colour-coded categories (exams, holidays, sports, parents, school) with day selection.
- **Term CSV Source**: Events are seeded from `public/ois_august_calendar.csv` and merged with events published from the AMS.
- **Google Calendar Embed**: The school's official public calendar remains available in a dedicated tab.

### 4. Interactive Gallery — `gallery.html`
Displays high-resolution photos of student life, sports events, and facilities.
- **Responsive Grid Layout**: Fluid image grid with staggered entrance animations.
- **Category Filter Tags**: Instant filter toggles allowing users to browse specific segments.
- **Lightbox Overlay**: Fullscreen viewer with arrow/keyboard navigation and wrap-around browsing.

### 5. Admissions Application — `apply.html`
An interactive multi-step wizard allowing parents to enroll new students online.
- **Multi-Step Flow**: Splits application inputs into Student Info, Parent Info, and Academic history sections.
- **Interactive Progress Indicator**: Animated status bar adjusting dynamically as steps are completed.
- **Real-Time Validation**: Field-level validation displaying styled error popups for incomplete sections.
- **Dual Submission**: Delivers to the school's existing Google Form and records the application in the AMS.

### 6. Academic Management System — `ams.html`
A role-based portal for **administrators, teachers, parents, and students**.
- **Accounts & Access**: Login and signup with an approval workflow for staff registrations.
- **School Records**: Students, teachers, and classes management with enrolment tracking.
- **Daily Operations**: Attendance registers, gradebook, announcements, and calendar events.
- **Admissions Review**: Applications submitted from the public site can be reviewed and accepted, enrolling the student.
- **Gallery Manager**: Curate and publish photos that appear on the public gallery page.

---

## Getting Started & Local Development

To run and build the website locally, follow this guide:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) installed on your system.

### Installation

Clone the repository and install the development dependencies:

```bash
# Clone the repository
git clone https://github.com/DaudiKi/OIS_WEBSITE.git

# Navigate to the project root
cd OIS_WEBSITE

# Install dependencies (React, Vite, Tailwind, GSAP, ESLint, Prettier)
npm install
```

### Running the Site

```bash
npm run dev       # Start the development server with hot reloading
npm run build     # Produce an optimized production build in dist/
npm run preview   # Serve the production build locally for verification
```

Tailwind compiles automatically as part of `dev` and `build` — no separate CSS watch step is required.

### Configuring the AMS Backend

The AMS runs in **demo mode** out of the box: all data is stored in the browser's localStorage with a seeded sample dataset, and the demo accounts are listed on the login screen.

To connect a real backend:
1. Create a [Supabase](https://supabase.com/) project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. Fill in your project URL and anon key in [`public/ams-config.js`](public/ams-config.js).

No code changes are required — authentication, data access, and the public applications feed switch over automatically.

---

## Deployment

Pushes to `main` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which installs dependencies, runs `npm run build`, and deploys the generated `dist/` directory to the school's hosting via FTP.

---

## Security & Code Standards

- **Linting**: Ensure code changes pass ESLint rules defined in `eslint.config.mjs` by running:
  ```bash
  npx eslint src
  ```
- **Formatting**: Format code with Prettier to keep components and styling attributes standardized:
  ```bash
  npx prettier --write "src/**/*.{js,jsx,css}"
  ```

---

## Author & Credits

- **Author**: Daudi Kirabo Makumbi Mawejje
- **School**: OrchardsWood International School (OIS)
- **License**: ISC License - see the [package.json](package.json) for details.
