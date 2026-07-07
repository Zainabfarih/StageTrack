# StageTrack

StageTrack is a full-stack web platform for managing academic internships (PFA/PFE). It connects students, university supervisors, company supervisors, and partner companies — from publishing an internship offer to tracking day-to-day tasks during the internship.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [User Roles](#user-roles)

## Features

- **Authentication**: email/password registration and login, email verification, password reset, JWT access + refresh tokens
- **Internship offers**: publishing, filtering by domain/type/level, deadlines, statuses (open, closed, in progress, completed)
- **Preferences & assignment**: students rank offers; an assignment algorithm matches students to offers, with run history (`affectation_run`)
- **Internship tracking**: task management (`tache`), documents/reports, built-in chat between students and supervisors
- **Multi-profile spaces**: dedicated dashboards for Admin, Student, University Supervisor, Company Supervisor, and Company
- **Email notifications**: SMTP (Oracle Cloud) for account verification, password reset, and alerts

## Architecture

A classic full-stack application split into two independent services:

```
Frontend (React SPA)  <——HTTP/REST——>  Backend (Express API)  <——>  MySQL
     :3000                                   :5000
```

- **Frontend**: React single-page application consuming the backend REST API
- **Backend**: Express REST API, layered architecture `routes → controllers → models → database`
- **Database**: MySQL, accessed via `mysql2` / `sequelize`

## Tech Stack

**Backend**
- Node.js / Express 5
- MySQL (`mysql2`, `sequelize`)
- Authentication: JWT (`jsonwebtoken`)
- Security: `bcryptjs`
- Emails: `nodemailer`
- File uploads: `multer`

**Frontend**
- React 19, React Router 7
- Tailwind CSS
- `axios` for API calls
- `framer-motion` (animations), `@hello-pangea/dnd` (drag & drop)
- `i18next` (internationalization)

## Data Model

Main entities (see `backend/database/schema.sql`):

| Table | Role |
|---|---|
| `etablissement` | Universities/institutions |
| `entreprise` | Partner companies |
| `encadreur_univ` | University-side supervisors |
| `encadreur_entr` | Company-side supervisors |
| `etudiant` | Students |
| `stage` | Internship offers (PFA/PFE) |
| `classement` | Student preferences over offers |
| `affectation` / `affectation_run` | Assignment results and run history |
| `tache` | Tasks assigned during the internship |
| `document` | Documents/reports linked to an internship |
| `chat_conversation` / `chat_message` | Internal messaging |
| `refresh_tokens` | JWT session (refresh token) management |

## Prerequisites

- Node.js ≥ 18
- MySQL ≥ 8
- An SMTP account (Oracle Cloud or equivalent) for email features

## Installation

```bash
git clone https://github.com/Zainabfarih/StageTrack.git
cd StageTrack

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Configuration

### Backend

Copy the example file and fill in the values:

```bash
cd backend
cp .env.example .env
```

Main variables to configure in `.env`:

- **Server**: `PORT`, `NODE_ENV`, `FRONTEND_URL`, `BASE_URL`
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **University admin account (seed)**: `ADMIN_UNIV_EMAIL`, `ADMIN_UNIV_PASSWORD`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `EMAIL_FROM_NAME`
- **Login security**: `MAX_LOGIN_ATTEMPTS`
- **CORS**: `CORS_ORIGIN`, `CORS_METHODS`, `CORS_HEADERS`
- **Request body**: `BODY_LIMIT`

Generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

`frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the App

### 1. Initialize the database

```bash
cd backend
npm run db:init      # creates the schema (schema.sql)
npm run db:seed      # inserts initial data (including the admin account)
# or in a single command:
npm run db:reset
```

### 2. Start the backend

```bash
cd backend
npm start              # nodemon index.js — http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm start               # http://localhost:3000
```

## Project Structure

```
StageTrack/
├── backend/
│   ├── config/           # Auth (JWT, roles) and database configuration
│   ├── controllers/      # Business logic per entity
│   ├── database/         # SQL schema, init and seed scripts
│   ├── middlewares/       # JWT auth, role verification
│   ├── models/             # Data access models
│   ├── public/              # Static files / uploads (gitignored)
│   ├── routes/               # REST API route definitions
│   ├── services/               # Email, tokens, uploads, HTTP responses
│   └── index.js                 # Express server entry point
│
└── frontend/
    └── src/
        ├── components/     # Reusable components
        ├── contexts/         # React contexts (auth, theme...)
        ├── locales/           # i18next translation files
        ├── pages/              # Pages per profile: admin, entreprise,
        │                        # encadrantEntr, encadrantUniv, etudiant, chat
        ├── services/            # API calls (axios)
        ├── styles/               # Global styles / Tailwind
        └── utils/                 # Utility functions
```

## API Reference

The REST API is exposed under `/api`, organized by resource:

| Endpoint | Resource |
|---|---|
| `/api/auth` | Authentication (login, register) |
| `/api/etudiants` | Students |
| `/api/encadreur-univ` | University supervisors |
| `/api/encadreur-entr` | Company supervisors |
| `/api/entreprises` | Companies |
| `/api/etablissements` | Institutions |
| `/api/stages` | Internship offers |
| `/api/etudiant-stage` | Student ↔ internship association |
| `/api/encadreur-stage` | Supervisor ↔ internship association |
| `/api/affectation` | Assignment algorithm |
| `/api/classement` | Student preferences |
| `/api/taches` | Tracking tasks |
| `/api/documents` | Documents and reports |
| `/api/chat` | Messaging |
| `/api/upload` | File uploads |

All protected routes require an `Authorization: Bearer <token>` header.

## Security

- Hashed passwords (`bcryptjs`)
- Short-lived JWT access tokens + revocable refresh tokens (`refresh_tokens` table)
- Role-based access control by hierarchy (`middlewares/roles.js`)
- Login attempt limit (`MAX_LOGIN_ATTEMPTS`)
- CORS restricted to the frontend origin

## User Roles

| Role | Space |
|---|---|
| Admin (university) | Manage students, supervisors, companies, assignments |
| Student | Browse offers, set preferences, track internship and tasks |
| University supervisor | Track supervised students, validate tasks |
| Company supervisor | Manage interns, assign and track tasks |
| Company | Publish offers, manage supervisors and interns |

---

Created with ❤️ by Zainab Farih