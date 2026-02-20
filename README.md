# 🔗 LinkSafe — Security-First URL Shortener SaaS

> **A production-grade MERN SaaS platform** that transforms long URLs into branded, trackable, and security-audited short links. Built with a security-first mindset from the ground up.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Live Demo

> **[LinkSafe on Render →](https://url-shortner-9mzj.onrender.com/)**

---

## 🧠 The Problem I Solved

Most URL shorteners are **dumb redirectors** — they shorten and forget. They expose raw destination URLs immediately, have zero insight into who's clicking, and store passwords in plain text.

**LinkSafe changes that.** It's a full SaaS intelligence layer on top of link management:

| Problem | How LinkSafe Solves It |
|---|---|
| Users blindly follow short links | **Safe Preview Page** — every redirect shows destination domain + HTTPS status before navigating |
| No insight into link traffic | **Analytics Dashboard** — click trends (area chart), device breakdown (pie chart), per-link & global views |
| Insecure link creation | **HTTPS Enforcement** — only `https://` destinations accepted, enforced at both frontend and backend |
| Generic, forgettable URLs | **Custom Branded Aliases** — `/s/my-brand-name` instead of `/s/xK93mZ1p` |
| No accountability trail | **Audit Logging** — every CREATE and EDIT action is timestamped and stored per link |
| Token exposure in network tab | **HttpOnly JWT Cookies** — token never touches JavaScript or the browser network panel |
| Brute-force auth attacks | **Rate Limiting** — 50 auth attempts per 15min window via `express-rate-limit` |

---

## ✨ Feature Showcase

### 1. 🔐 Secure Preview Redirect System
Every short link (`/s/:id`) redirects through a **Preview Page** before the user leaves the platform.

- Displays the **destination domain** prominently
- Shows ✅ **HTTPS Verified** or ⚠️ **Insecure** based on real URL parsing
- Opens destination in `_blank` with `noopener,noreferrer` (prevents tab-napping attacks)
- Keeps click tracking intact

### 2. 📊 Smart Analytics (Dual Mode)
Built with **Recharts** for beautiful, interactive data visualization:

- **Global View** — aggregated stats across all user links
- **Per-link Intelligence** — click timeline (Area Chart) + device breakdown (Donut Pie Chart)
- Tracks: **Browser** (Chrome / Safari / Firefox / Other) and **Device** (Mobile / Desktop / Tablet) from User-Agent
- **Active Days** counter per link

### 3. 🏷️ Custom Branded Aliases
Users can define memorable slugs instead of random IDs:
- `your-app.com/s/my-portfolio` ← human-readable, brandable
- Collision checked at DB level with `409 Conflict` response
- Alias validation: only `[a-zA-Z0-9_-]` allowed (no slashes, no injection)

### 4. 📱 QR Code Generator
One-click QR code generation for every link:
- Generated server-side via `qrcode` npm package
- High-resolution 400×400px PNG with black-on-white styling
- **Downloadable directly** from the dashboard modal

### 5. 🛡️ Security Center Page
Dedicated security audit view for all user links:
- Per-link HTTPS status indicator (✅ SECURE / ⚠️ INSECURE)
- Global policy display: HTTPS enforcement, rate limiting, cookie security, password hashing
- Links directly to per-link analytics/audit trail

### 6. ✏️ Editable Redirects with Audit Log
Users can update both the destination URL and the alias of existing links:
- Full ownership enforcement (403 if not owner)
- Every edit appended to `auditLog[]` with `action`, `by`, `timestamp`, and `details`
- New alias uniqueness re-validated before commit

### 7. 🔒 Production-Grade Auth
- **HMAC-SHA256** password hashing with a per-user `randomBytes(16)` salt — no bcrypt dependency, pure Node.js `crypto` module
- **HttpOnly JWT Cookies** — token is never exposed to JavaScript (`document.cookie` returns nothing)
- Passwords **never appear in any API response**
- Role system: `NORMAL` | `ADMIN`

---

## 🏗️ Architecture

```
project2-shortUrl/
├── backend/
│   ├── index.js              # Express app, CORS, Helmet, rate limiter, graceful shutdown
│   ├── connect.js            # MongoDB connection
│   ├── models/
│   │   ├── url.js            # ShortURL schema (shortId, visitHistory[], auditLog[])
│   │   └── user.js           # User schema with HMAC pre-save hook
│   ├── controllers/
│   │   └── urlControl.js     # All URL CRUD + QR + Analytics logic
│   ├── routes/
│   │   ├── urlRouter.js
│   │   └── userRouter.js
│   ├── middlewares/
│   │   ├── middleauth.js     # JWT cookie verification + role guard
│   │   └── errorMiddleware.js
│   └── service/
│       └── auth.js           # JWT sign/verify helpers
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx  # Link management + QR modal + stats
        │   ├── Analytics.jsx  # Recharts area + pie, dual-mode
        │   ├── Security.jsx   # Security audit center
        │   ├── Preview.jsx    # Safe redirect preview with countdown
        │   ├── Links.jsx      # Full link list with edit/delete
        │   ├── SignIn.jsx
        │   └── SignUp.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   └── ConfirmationModal.jsx
        ├── context/
        │   └── AuthContext.jsx
        └── utils/
            └── api.js         # Axios instance with credentials
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR, modern SPA |
| **Routing** | React Router v6 | Client-side navigation |
| **Charts** | Recharts | Composable, responsive SVG charts |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Toasts** | React Hot Toast | Non-blocking UX feedback |
| **Backend** | Node.js + Express | Lightweight, fast REST API |
| **Database** | MongoDB + Mongoose | Flexible schema for analytics arrays |
| **Auth** | JWT (HttpOnly Cookies) | Secure, stateless, XSS-resistant |
| **Security** | Helmet + CORS + Rate Limit | Production-ready hardening |
| **Logging** | Morgan | Request lifecycle visibility |
| **QR Codes** | `qrcode` npm | Server-side PNG generation |
| **ID Gen** | `nanoid` | URL-safe 8-char unique IDs |

---

## 🔐 Security Design Decisions

### Why HMAC-SHA256 instead of bcrypt?
bcrypt is excellent but introduces a runtime dependency. For this project's scope, Node.js's built-in `crypto` module with `randomBytes(16)` salt + `createHmac('sha256', salt)` achieves equivalent security without an extra package and is **significantly faster** for high-throughput scenarios.

### Why HttpOnly cookies instead of localStorage?
`localStorage` is vulnerable to **XSS attacks** — any injected script can read `localStorage.getItem('token')` and exfiltrate it. HttpOnly cookies are **invisible to JavaScript**. Combined with `SameSite=Lax` and HTTPS, this eliminates the most common JWT theft vectors.

### Why a Safe Preview Page?
Short URLs are inherently opaque. A user clicking `/s/xK93mZ` has no idea where they're going. The preview page solves **link phishing** — users see the actual domain and HTTPS status before navigating. Every redirect passes through this system automatically.

---

## ⚡ Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/Satyamand536/URL-Shortner.git
cd project2-shortUrl

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Environment

**`backend/.env`**
```env
PORT=8001
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/short-url
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8001
```

**`frontend/.env`**
```env
VITE_BACKEND_URL=http://localhost:8001
```

### 3. Run

```bash
# Terminal 1 – Backend
cd backend && node index.js

# Terminal 2 – Frontend
cd frontend && npm run dev
```

App runs at **http://localhost:5173** → Backend at **http://localhost:8001**

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user/signup` | ❌ | Register new user |
| `POST` | `/api/user/signin` | ❌ | Login → sets HttpOnly cookie |
| `POST` | `/api/url` | ✅ | Create short URL (+ optional alias) |
| `GET` | `/api/url/` | ✅ | Get all URLs for current user |
| `GET` | `/api/url/analytics/:shortId` | ✅ | Full analytics for a link |
| `GET` | `/api/url/qrcode/:shortId` | ✅ | QR code as base64 PNG data URL |
| `PATCH` | `/api/url/:shortId` | ✅ | Edit destination URL or alias |
| `DELETE` | `/api/url/:shortId` | ✅ | Delete link (owner only) |
| `GET` | `/s/:shortId` | ❌ | Redirect (tracks click → preview page) |
| `GET` | `/api/health` | ❌ | Health check |

---

## 📸 Pages Overview

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Create links, view stats, QR, copy, delete |
| Links | `/links` | Full list with edit/alias update |
| Analytics | `/analytics` | Global click overview (all links) |
| Link Intelligence | `/analytics/:shortId` | Per-link deep dive |
| Security Center | `/security` | Audit all links for HTTPS compliance |
| Safe Preview | `/preview?url=...&id=...` | Intercept redirect, show destination info |
| Sign In / Up | `/signin`, `/signup` | JWT cookie-based auth |

---

## 🎯 What Makes This Top 1%

1. **Security is a feature, not an afterthought** — Preview page, HTTPS enforcement, HttpOnly cookies, HMAC hashing, rate limiting, and per-link ownership checks all work in concert.
2. **Dual analytics modes** — Most shorteners show global OR per-link. LinkSafe shows both, live-aggregated in the frontend.
3. **Audit trail built into the schema** — `auditLog[]` on the Mongoose model means every create/edit is immutably recorded.
4. **QR + short URL in one flow** — No external QR APIs, generated server-side and downloadable.
5. **Graceful shutdown + structured logging** — `SIGTERM`/`SIGINT` handlers + Morgan + structured console logs = production-ready.
6. **Partial monorepo, single deployment** — Express serves the React `dist/` build, so Render needs only one service.

---

## 👤 Author

** Satyam Tiwari** — [@Satyamand536](https://github.com/Satyamand536)

---

> *Built to demonstrate production-grade MERN development with a focus on security, UX, and real-world architecture patterns.*
