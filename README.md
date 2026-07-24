<div align="center">
  <img src="public/assets/icons/oisLogo.png" alt="OrchardsWood International School Logo" width="180px" style="margin-bottom: 20px;"/>
  
  # OrchardsWood International School Website
  
  [![Website Status](https://img.shields.io/badge/status-active-success.svg)](#)
  [![Tech Stack](https://img.shields.io/badge/tech--stack-Tailwind%20%7C%20GSAP%20%7C%20Firebase-0072BC.svg)](#)
  [![License: ISC](https://img.shields.io/badge/License-ISC-4CAF50.svg)](https://opensource.org/licenses/ISC)

  *Providing a nurturing Christian education from Preschool to High School in Buziga, Kampala.*
</div>

---

## Overview

The **OrchardsWood International School (OIS)** website is a premium, interactive, and responsive web portal built to connect parents, prospective students, and educators with the school's mission, calendar, gallery, and admissions office. 

Designed with modern typography (Inter & Righteous), rich gradients, dynamic GSAP scroll-triggered animations, and a live Google Calendar integration, this website provides a state-of-the-art user experience for visitors exploring OIS.

---

## Technology Stack & Libraries

This project uses a modern web stack tailored for high performance, smooth animation, and rapid development:

| Category | Technology / Library | Description |
| :--- | :--- | :--- |
| **Markup & Architecture** | [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) & [ES6+ JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) | Semantic, accessibility-oriented page structure with modular inlined logic. |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) & PostCSS | Curated colors matching the school identity, custom utility classes, and optimized building. |
| **Animation Core** | [GSAP](https://gsap.com/) & [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Smooth micro-animations, floating interactive elements, and text/card reveals on scroll. |
| **Calendar Sync** | [Google Calendar API v3](https://developers.google.com/calendar/api/v3/reference) | Live, dynamic queries to the public school calendar with a CSV-based local fallback. |
| **Gallery Engine** | [Masonry.js](https://masonry.desandro.com/) & [imagesLoaded](https://imagesloaded.desandro.com/) | Pinterest-style fluid grid alignment that stabilizes layout loading across various screen sizes. |
| **Media Previews** | [Lightbox2](https://lokeshdhakar.com/projects/lightbox2/) | Clean overlay modal system supporting group slides and full-resolution image displays. |
| **Email Gateway** | [SMTP.js](https://smtpjs.com/) | Secure direct client-side email delivery system for handling admissions applications. |
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
├── public/                     # Main web root folder
│   ├── assets/                 # Static media and assets
│   │   ├── icons/              # Logos, locations, and action icons (e.g., oisLogo.png)
│   │   └── images/             # Backgrounds, cards, photos (e.g., Home Background.jpg)
│   ├── css/                    # Stylesheets
│   │   ├── styles.css          # Tailwind source stylesheet (entrypoint)
│   │   └── output.css          # Compiled production stylesheet
│   ├── js/                     # Client-side JavaScript (logic placeholder files)
│   │   ├── calender.js
│   │   ├── forms.js
│   │   ├── gallary.js
│   │   └── main.js
│   ├── about.html              # OIS Mission, Vision, and Staff values
│   ├── apply.html              # Multi-step Interactive Admissions Form
│   ├── calendar.html           # Calendar UI (Dynamic Google Calendar API / CSV parser)
│   ├── gallery.html            # Masonry Pinterest-style Image Gallery
│   ├── index.html              # Homepage featuring GSAP scroll animations
│   ├── ois_august_calendar.csv # Fallback academic calendar data
│   └── favicon.ico             # School logo browser tab icon
├── eslint.config.mjs           # ESLint configuration
├── tailwind.config.js          # Tailwind theme configurations (extended brand colors)
├── postcss.config.js           # PostCSS configuration
├── package.json                # Project script execution and package dependencies
├── package-lock.json           # Locked package tree
└── test_calendar_api.html      # Google Calendar API sandbox verification file
```

---

## Interactive Pages & Features

### 1. Home Page — [index.html](file:///d:/OIS_WEBSITE/public/index.html)
The central portal of OrchardsWood International School.
- **GSAP ScrollTrigger Card Reveal**: Cards slide and fade smoothly into view as the user scrolls.
- **Wave Title Animation**: Headline text characters feature a wave-like vertical floating motion.
- **Testimonials Section**: Features testimonials overlaying a dynamic, rotating CSS spiral background.
- **School Portal Button**: A custom-designed shortcut pointing to the OIS Academic Management System (AMS).

### 2. About Page — [about.html](file:///d:/OIS_WEBSITE/public/about.html)
Showcases the school's heritage, foundational Christian values, and academic structure.
- Highlights the ACE curriculum (Accelerated Christian Education), PACEs, and ICCE certificates.
- Features detailed sections outlining the school's **Vision**, **Mission**, **Core Values**, and leadership message.

### 3. Academic Calendar — [calendar.html](file:///d:/OIS_WEBSITE/public/calendar.html)
Provides parents and students with a clear overview of holidays, events, and assessments.
- **API Sync**: Dynamic connection to the school's public Google Calendar via ID `7eb5a9b638028ced87f52d91048bc2a9bac6b47ee2d3191cb8e2647f3e1077d4@group.calendar.google.com`.
- **CSV Fallback**: In the event of an API error, a local CSV parser reads `public/ois_august_calendar.csv` to render schedule listings.
- **Sandbox Testing**: Use [test_calendar_api.html](file:///d:/OIS_WEBSITE/test_calendar_api.html) to independently verify the Google Calendar API key and token outputs.

### 4. Interactive Gallery — [gallery.html](file:///d:/OIS_WEBSITE/public/gallery.html)
Displays high-resolution photos of student life, sports events, and facilities.
- **Masonry Layout**: Auto-fitting Pinterest grid layout.
- **Category Filter Tags**: Instant filter toggles allowing users to browse specific segments.
- **Lightbox Overlay**: Image clicking expands a fullscreen slider overlay supporting navigation arrows.

### 5. Admissions Application — [apply.html](file:///d:/OIS_WEBSITE/public/apply.html)
An interactive multi-step wizard allowing parents to enroll new students online.
- **Multi-Step Flow**: Splits application inputs into Student Info, Parent Info, and Academic history sections.
- **Interactive Progress Indicator**: Animated status bar adjusting dynamically as steps are completed.
- **Real-Time Validation**: Field-level validation displaying styled error popups for incomplete sections.
- **SMTP Submission**: Secure client-side email delivery using SMTP.js.

---

## Getting Started & Local Development

To compile styles and run the website locally, follow this guide:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v16.0.0 or higher) installed on your system.

### Installation

Clone the repository and install the development dependencies:

```bash
# Clone the repository
git clone https://github.com/DaudiKi/OIS_WEBSITE.git

# Navigate to the project root
cd OIS_WEBSITE

# Install dependencies (Tailwind, PostCSS, ESLint, Prettier)
npm install
```

### Compiling CSS

The website styling compiles from source files using Tailwind CLI. To compile tailwind classes or watch for changes during development, run:

```bash
# Build stylesheet and watch for source html/js changes
npm run build:css
```

This command runs:
`tailwindcss -i ./public/css/styles.css -o ./public/css/output.css --watch`

### Testing the Google Calendar Integration

To verify that local API requests can fetch from the Google Calendar API correctly:
1. Open the [test_calendar_api.html](file:///d:/OIS_WEBSITE/test_calendar_api.html) file directly in a web browser.
2. The page will immediately fire a test fetch request using the school's calendar credentials.
3. Review the status indicators (Success / Error logs) printed directly on the page.

---

## Security & Code Standards

- **Linting**: Ensure code changes pass ESLint rules defined in `eslint.config.mjs` by running:
  ```bash
  npx eslint public/**/*.js
  ```
- **Formatting**: Format code with Prettier to keep HTML and styling attributes standardized:
  ```bash
  npx prettier --write public/**/*.html
  ```

---

## Author & Credits

- **Author**: Daudi Kirabo Makumbi Mawejje
- **School**: OrchardsWood International School (OIS)
- **License**: ISC License - see the [package.json](file:///d:/OIS_WEBSITE/package.json) for details.