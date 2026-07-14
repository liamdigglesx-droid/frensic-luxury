# Frensic Luxury — Web App

**Premium Luxury Apartment & Automobile Rental Platform**
Built with React + Vite + Tailwind CSS, powered by the Base44 backend.

Live site: [frensicluxuryapartment.com.ng](https://frensicluxuryapartment.com.ng)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Backend Functions](#backend-functions)
- [Key Pages & Features](#key-pages--features)

---

## Project Overview

Frensic Luxury is a luxury hospitality and automobile rental platform based in Abuja, Nigeria. This web app allows users to:

- Browse premium apartment suites and luxury rental cars
- Make bookings with date selection and guest details
- Pay securely via **Paystack**
- Receive automated **booking confirmation emails** (via Gmail API)
- Have bookings automatically added to **Google Calendar**
- View and manage their booking history

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18, Vite 6, Tailwind CSS 3                |
| UI Components| shadcn/ui (Radix UI primitives)                 |
| Animations   | Framer Motion                                   |
| Routing      | React Router DOM v6                             |
| Data Fetching| TanStack React Query v5                         |
| Backend      | Base44 BaaS (entities, functions, auth)         |
| Payments     | Paystack (inline JS)                            |
| Email        | Gmail API via Base44 connector                  |
| Calendar     | Google Calendar API via Base44 connector        |
| Hosting      | WhoGoHost (FTP deploy via GitHub Actions)       |

---

## Project Structure

```
frensic-luxury/
├── src/
│   ├── api/
│   │   └── base44Client.js        # Pre-initialized Base44 SDK client
│   ├── components/
│   │   ├── ui/                    # shadcn/ui component library
│   │   ├── AvailabilityBadge.jsx  # Live availability status for rooms/cars
│   │   ├── BookingEngine.jsx      # Homepage booking widget (stay/drive toggle)
│   │   ├── Footer.jsx             # Site-wide footer
│   │   ├── Layout.jsx             # Page shell (Navbar + Footer + Outlet)
│   │   ├── Navbar.jsx             # Responsive navigation with mobile menu
│   │   └── ScrollToTop.jsx        # Scroll to top on route change
│   ├── lib/
│   │   ├── constants.js           # Static data: ROOMS, CARS, TESTIMONIALS, FAQS
│   │   ├── paystack.js            # Paystack inline payment initializer
│   │   └── query-client.js        # TanStack Query client instance
│   ├── pages/
│   │   ├── Home.jsx               # Landing page with hero, rooms, testimonials, FAQ
│   │   ├── About.jsx              # Brand story and values
│   │   ├── Rooms.jsx              # Apartment suite listings with filters
│   │   ├── Cars.jsx               # Luxury car rental listings with filters
│   │   ├── Book.jsx               # 4-step booking flow + Paystack payment
│   │   ├── Reviews.jsx            # Guest testimonials page
│   │   ├── Contact.jsx            # Contact form + business info
│   │   ├── MyBookings.jsx         # Email-authenticated booking history
│   │   └── Privacy.jsx            # Privacy policy
│   ├── App.jsx                    # Router configuration
│   ├── index.css                  # Design tokens + Tailwind base styles
│   └── main.jsx                   # React entry point
├── base44/
│   ├── entities/                  # Data schemas (Booking, Car, Room, Review, etc.)
│   ├── functions/
│   │   ├── sendBookingConfirmation/entry.ts  # Gmail confirmation email
│   │   └── addBookingToCalendar/entry.ts     # Google Calendar event creation
│   └── connectors/                # OAuth connector configs (Gmail, Google Calendar)
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD: build + FTP deploy to WhoGoHost
├── index.html                     # HTML entry with Paystack script + favicon
├── tailwind.config.js             # Tailwind theme (colors, fonts, tokens)
├── vite.config.js                 # Vite + Base44 plugin config
└── package.json
```

---

## Getting Started Locally

### Prerequisites

- Node.js v20+
- npm v9+
- Base44 CLI (optional, for full backend dev): `npm install -g base44@latest`

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/frensic-luxury.git
cd frensic-luxury
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
VITE_BASE44_APP_ID=your_base44_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

> These values are found in your Base44 dashboard under **Settings → App ID**.

### 4. Run the development server

```bash
# With full Base44 local backend:
base44 dev

# Frontend only (uses hosted Base44 backend):
npm run dev
```

Open the local URL printed in your terminal (default: `http://localhost:5173`).

---

## Environment Variables

| Variable                  | Description                                  |
|---------------------------|----------------------------------------------|
| `VITE_BASE44_APP_ID`      | Your Base44 application ID                   |
| `VITE_BASE44_APP_BASE_URL`| Hosted Base44 app URL for API proxying        |

---

## Available Scripts

```bash
npm run dev        # Start local Vite dev server
npm run build      # Production build → outputs to /dist
npm run preview    # Preview production build locally
npm run lint       # Run ESLint checks
npm run lint:fix   # Auto-fix ESLint issues
```

---

## Deployment

The app auto-deploys to **WhoGoHost** via FTP on every push to the `main` branch using GitHub Actions.

### Required GitHub Repository Secrets

Go to **Settings → Secrets and Variables → Actions** and add:

| Secret Name    | Description                        |
|----------------|------------------------------------|
| `FTP_SERVER`   | WhoGoHost FTP hostname             |
| `FTP_USERNAME` | FTP account username               |
| `FTP_PASSWORD` | FTP account password               |

### Deploy Flow

```
Push to main
  → GitHub Actions triggered
  → npm ci (install deps)
  → npm run build (Vite compiles → /dist)
  → FTP sync /dist → /domains/frensicluxuryapartment.com.ng/public_html/
```

> **Note:** The server must be configured to serve `index.html` for all routes (SPA fallback), since the app uses client-side routing. On Apache hosts, a `.htaccess` file handles this — see below.

### Apache `.htaccess` (SPA routing support)

If your host uses Apache, add a `.htaccess` file in `public_html/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

## Backend Functions

Both functions run on Base44's serverless Deno runtime and use OAuth connectors.

### `sendBookingConfirmation`

Triggered after a successful Paystack payment.

- Sends an HTML confirmation email to the **guest** via Gmail API
- Sends a copy to the **business inbox**
- Uses the authorized **Gmail connector** (`gmail.send` scope)

### `addBookingToCalendar`

Triggered after a successful Paystack payment.

- Creates an all-day event in Google Calendar for the booking dates
- Includes guest name, booking type, amount, and contact details
- Uses the authorized **Google Calendar connector** (`calendar.events` scope)

---

## Key Pages & Features

| Page           | Route          | Description                                              |
|----------------|----------------|----------------------------------------------------------|
| Home           | `/`            | Hero, booking widget, featured rooms, testimonials, FAQ  |
| About          | `/about`       | Brand story, stats, core values                          |
| Rooms          | `/rooms`       | Apartment listings with search + filter                  |
| Cars           | `/cars`        | Car rental listings with search + filter                 |
| Book           | `/book`        | 4-step booking: select → dates → details → pay           |
| Reviews        | `/reviews`     | Guest testimonials                                       |
| My Bookings    | `/my-bookings` | Email-lookup booking history                             |
| Contact        | `/contact`     | Contact form + hours + map                               |
| Privacy        | `/privacy`     | Privacy policy                                           |

### Booking Flow

```
Step 1: Choose type (Stay / Drive) + select room or car
Step 2: Pick dates, guests, optional chauffeur
Step 3: Enter guest name, email, phone, special requests
Step 4: Review summary → Pay via Paystack
  ↳ On success: booking marked paid, confirmation email sent, calendar event created
  ↳ On close: booking marked failed
```

### Real-Time Availability

The `AvailabilityBadge` component queries the `Booking` entity in real time and checks whether any paid bookings overlap with today's date, displaying **Available** or **Booked** on each room/car card.

---

## Design System

- **Primary font:** Cormorant Garamond (headings/display) — elegant serif
- **Body font:** Inter — clean sans-serif
- **Gold accent:** `#C9A84C`
- **Background:** `#050505` (near black)
- **Text:** `#F9F9F9` (primary), `#aaaaaa` (secondary)
- **Border radius:** `0rem` (sharp, architectural)
- **Theme:** Dark luxury throughout — no light mode

---

## Support

- Base44 Docs: [docs.base44.com](https://docs.base44.com)
- Base44 Support: [app.base44.com/support](https://app.base44.com/support)
- Business: [frensicluxuryapartment.com.ng](https://frensicluxuryapartment.com.ng)