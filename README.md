# 🏆 Telugu Icon Digital & Influencer Awards

Premium cinematic web platform for the Telugu Icon Awards — celebrating Telugu digital excellence.

## Project Structure

```
aibuild/
├── frontend/          # React (Vite) + Tailwind CSS + Framer Motion
│   └── src/
│       ├── pages/     # Home, Awards, Nominate, Vote, Nominees, Sponsors, About, Contact
│       └── pages/admin/  # Admin Login + Dashboard (7 management tabs)
├── backend/           # Node.js + Express + MySQL
│   ├── routes/        # REST API routes
│   ├── config/        # MySQL connection (port 3307)
│   ├── database/      # schema.sql (full DB schema + seed data)
│   └── uploads/       # Nomination photo uploads
├── start-backend.bat  # Start API server
└── start-frontend.bat # Start React dev server
```

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Framer Motion
- **Backend:** Node.js, Express, JWT auth, bcrypt, multer (uploads)
- **Database:** MySQL via XAMPP (port **3307**)

---

## 🚀 Quick Start

### 1. XAMPP (MySQL on port 3307)
Make sure XAMPP Apache + MySQL are running. XAMPP MySQL must listen on **port 3307**:
- Edit `C:\xampp\mysql\bin\my.ini` → `port = 3307`
- Start MySQL in XAMPP Control Panel. Verify: `mysql -h localhost -P 3307 -u root`

### 2. Database (auto-setup)
The backend **auto-creates the database and all tables** on first start. To create manually:
```bash
"C:\xampp\mysql\bin\mysql.exe" -h localhost -P 3307 -u root < backend/database/schema.sql
```

### 3. Start Backend API (port 3001)
```bash
cd backend
npm install
npm start
```
✔ Verifies: MySQL Connected on 3307 → API on http://localhost:3001

### 4. Start Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**

Or double-click `start-backend.bat` and `start-frontend.bat`.

---

## 🔑 Admin Login
| | |
|---|---|
| URL | http://localhost:5173/admin/login |
| Email | `admin@teluguiconawards.com` |
| Password | `admin123` |

---

## 📄 Pages
| Route | Page |
|---|---|
| `/` | Cinematic home, stats, countdown, featured nominees |
| `/awards` | 10 Curated + 40 People's Choice categories |
| `/nominate` | Multi-step nomination form (with photo upload) |
| `/vote` | Public voting portal |
| `/nominees` | Nominees showcase gallery |
| `/nominee/:id` | Shareable nominee profile with vote button (slug is canonical) |
| `/vote/:slug` | Direct voting URL — opens the nominee page with voting pre-selected |
| `/nominee-kit` | Campaign kit: poster, story, QR and social captions |
| `/sponsors` | Sponsor tier showcase |
| `/about` | Story, values, timeline |
| `/contact` | Contact form (saves to DB) |
| `/admin/login` | Secure admin sign-in |
| `/admin` | Dashboard, Nominations, Nominees, Categories/Voting, Votes & Audit, Sponsors, Settings |

---

## 🔌 API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login → JWT |
| GET | `/api/categories` | All categories |
| GET | `/api/categories/curated` | 10 curated icon awards |
| GET | `/api/categories/peoples-choice` | 40 people's choice categories |
| GET | `/api/nominees` | Approved nominees (filter by `?category=`/`?status=`) |
| GET | `/api/nominees/featured` | Featured nominees |
| GET | `/api/nominees/:id` | Nominee profile |
| POST | `/api/nominations` | Submit public nomination (multipart) |
| POST | `/api/votes` | Cast a vote (duplicate guarded per email) |
| GET | `/api/sponsors` | Active sponsors |
| GET | `/api/settings` | Site settings |
| POST | `/api/contact` | Contact form |
| GET | `/api/admin/stats` | Dashboard stats (auth) |
| GET/PUT | `/api/admin/nominations` | Review/approve/reject nominations (auth) |
| GET/PUT/DELETE | `/api/admin/nominees` | Manage nominees (auth) |
| PUT | `/api/categories/:id` | Open/close voting (auth) |
| GET/PUT | `/api/admin/votes` | Vote audit & flagging (auth) |
| GET/POST/PUT/DELETE | `/api/admin/sponsors` | Sponsor CRUD (auth) |
| GET/PUT | `/api/admin/settings` | Update site content (auth) |

---

## 🌟 Individual Nominee Pages & Direct Voting (add-on)

Every approved nominee gets a permanent public page, a unique QR code, a share
kit and a campaign dashboard. Voting rules are unchanged: **one verified mobile
= one vote per category**, OTP enforced, anti-fraud and duplicate protection all
still enforced server-side.

### 1. Run the database migration (required once)

Supabase → SQL Editor → New query. Run in this order:

| Order | File | What it does |
|---|---|---|
| 1 | `backend/database/migration-nominee-pages.sql` | `TIC26-#####` sequence, achievements/social columns, `nominee_campaign_events`, `sponsor_slots` |
| 2 | `backend/database/migration-nominee-pages-backfill.sql` | **Optional, one-time.** Cleans up existing slugs and assigns `TIC26-00001…` codes |

> ⚠️ Step 2 **changes public URLs** (`ananya-nagalla-k3f9a2` → `ananya-nagalla`).
> Only run it **before** any nominee link, poster, QR code or video has been
> distributed. After that, printed material breaks. To keep existing URLs, comment
> out STEP 2 in that file — steps 1 and 3 are always safe.

The API degrades gracefully if the migration has not been run: nominee pages,
voting and the admin directory all work, you just don't get `TIC26-` codes,
achievements/social link fields, or analytics.

### 2. Environment variables

**None are required.** Everything has a working default:

| What | Default |
|---|---|
| Backend API | `https://awards-production-13eb.up.railway.app/api` |
| Public origin (canonical, OG, QR, sitemap) | **derived from the incoming request** |

The public origin is read from the request itself, so production, preview
deploys and second Vercel projects all emit correct links automatically — there
is no hostname to keep in sync. Share links and QR codes can never point at a
host that does not exist.

| Variable | When to set it |
|---|---|
| `VITE_SITE_URL` | Only to force canonical/OG URLs to a different origin than the one being served — e.g. set it to the real custom domain. |
| `API_BASE_URL` | Only if the backend moves off Railway. |
| `FRONTEND_URL` (Railway) | Optional. CORS is currently `*`. |

### 3. How link previews work

`frontend/middleware.ts` intercepts `/nominee/<slug>` and `/vote/<slug>` on
Vercel and serves the built `index.html` with per-nominee `<title>`, meta
description, canonical URL, Open Graph and Twitter/X card tags fetched from the
API. This is required because **WhatsApp, Facebook, Telegram and X do not run
JavaScript** — a client-only implementation would preview every nominee link as
the generic site title.

The file lives in `frontend/` because Vercel only picks up Routing Middleware
from the root of the configured **Root Directory** (yours is `frontend`). If you
ever change Root Directory, move this file to match. The middleware also serves
`/robots.txt` and a `/sitemap.xml` generated live from the approved nominee
list.

If the API is unreachable the middleware falls through to the normal SPA shell,
so a database hiccup can never take the site down.

### 4. New URLs

| URL | Purpose |
|---|---|
| `/nominee/<slug>` | Official nominee page (canonical) |
| `/nominee/<slug>?vote=true` | Opens the page with the voting form pre-selected |
| `/nominee/<slug>?vote=true&src=qr` | Encoded in the QR code — scans are counted separately from taps |
| `/vote/<slug>` | Human-friendly alias for the direct vote URL |
| `/nominee-kit?nominee=<slug>` | Campaign kit: poster, story, QR, all captions |
| `/nominee-status` | OTP-verified nomination tracker — unlocks the nominee's kit on approval |
| `/sitemap.xml`, `/robots.txt` | Generated live by the middleware |

The numeric-id form (`/nominee/42`) redirects to the slug, so a nominee always
has exactly **one** canonical URL.

### 5. New API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analytics/track` | Records page views / voting clicks / share clicks / QR scans (de-duplicated, no voter identity stored) |
| POST | `/api/nomination-status/send` | Sends an OTP to the nominating mobile (add-on req. 19) |
| POST | `/api/nomination-status/verify` | Verifies it, returns a 30-minute `nomination_status` token |
| POST | `/api/nomination-status/lookup` | Returns that mobile's nominations + campaign kit. Rejects vote-purpose tokens and any other mobile's data |
| GET | `/api/admin/nominees/:id/campaign` | Full MY CAMPAIGN payload + 14-day reach series (auth) |

### 5b. Kit delivery on approval (add-on req. 19)

There is no email/SMS provider connected, so `/nominee-status` is the delivery
channel. The nominee verifies the mobile number they nominated with, and the
moment an admin shortlists that nomination their official URL, nominee ID, QR
code, poster and share copy all appear — no email needed.

If a nomination is approved but its nominee page has not been created yet, the
page says **"Approved — Page Being Set Up"** rather than promising a kit that
does not exist. Re-shortlisting the nomination in admin creates the page and the
kit unlocks automatically.

**Launch control:** voting is gated by the per-category `voting_open` flag in
Admin → Categories. There is deliberately no hard-coded date gate, because
requirement 15 states voting rules must remain unchanged.

`GET /api/nominees` now also accepts a **category id** as well as a category
slug, and returns achievements plus individual social URLs.

### 6. Admin

In **Admin → Nominees**, each row has a **🎯 MY CAMPAIGN** button giving the
nominee name, nominee ID, category, official URL, voting URL, QR code, campaign
assets and reach — with `COPY NOMINEE LINK`, `COPY VOTING LINK`, `DOWNLOAD QR`,
`SHARE` and `DOWNLOAD CAMPAIGN MATERIAL`. The edit modal now exposes the slug
(plus achievements and individual social URLs) so a broken link can be fixed.

**Slug policy:** renaming a nominee never changes their URL automatically. The
slug only changes when an admin explicitly edits that field, because it is
printed on posters, QR codes and videos.

### 7. Before the 10 October launch checklist

- [ ] Run both migrations
- [ ] Confirm a shared WhatsApp link previews with the nominee's **name, category and photo** (not the generic site title)
- [ ] Download one poster per nominee — verify the QR scans into the **correct** nominee page
- [ ] Flip `voting_open` on categories deliberately; there is no automatic date gate
- [ ] When the domain goes live: set `VITE_SITE_URL` to it, redeploy, and add it in Vercel → Settings → Domains

---

## 🗄️ Database Tables
`users`, `categories`, `nominees`, `nominations`, `votes`, `sponsors`, `settings`, `contact_messages`,
`nominee_campaign_events`, `sponsor_slots`

Seeded: 1 admin, 50 categories (10 curated + 40 people's choice), 2 featured nomnees, 1 sponsor, site settings.

---

## Troubleshooting
- **Unknowndatabase** → Restart backend; it auto-creates tables (or import schema.sql manually).
- **Port 3307 refused** → Ensure XAMPP MySQL is running and configured for 3307.
- **API on different port** → Edit `backend/.env` (`PORT`, `DB_PORT`).

---

Powered by **Pracharam Media** · © 2026 Telugu Icon Digital & Influencer Awards