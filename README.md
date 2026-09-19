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
| `/nominee/:id` | Shareable nominee profile with vote button |
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

## 🗄️ Database Tables
`users`, `categories`, `nominees`, `nominations`, `votes`, `sponsors`, `settings`, `contact_messages`

Seeded: 1 admin, 50 categories (10 curated + 40 people's choice), 2 featured nomnees, 1 sponsor, site settings.

---

## Troubleshooting
- **Unknowndatabase** → Restart backend; it auto-creates tables (or import schema.sql manually).
- **Port 3307 refused** → Ensure XAMPP MySQL is running and configured for 3307.
- **API on different port** → Edit `backend/.env` (`PORT`, `DB_PORT`).

---

Powered by **Pracharam Media** · © 2026 Telugu Icon Digital & Influencer Awards