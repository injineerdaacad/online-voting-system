# Online Voting System (OVS)

Comprehensive digital election platform for university elections.

This monorepo contains:
- `backend/`: Express + MongoDB API
- `frontend/`: React + TypeScript admin dashboard
- `mobile/`: Expo + React Native student app

## Table of Contents
- [Overview](#overview)
- [Live Deployments](#live-deployments)
- [Architecture](#architecture)
- [Implemented Features](#implemented-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database Seeding](#database-seeding)
- [API Reference](#api-reference)
- [Socket.IO Events](#socketio-events)
- [Security Notes](#security-notes)
- [Deployment Notes](#deployment-notes)
- [Roles and Access](#roles-and-access)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview
The system supports two election types:
- Faculty Leadership Election
- Student Union Election

Primary use cases:
- Super Admin manages faculties, departments, admins, students, elections, and results
- Faculty Admin manages faculty-scoped students, candidates, and elections
- Students use the mobile app to view elections, vote, view results, and use an AI election assistant

## Live Deployments
- GitHub Repository: https://github.com/injineerdaacad/online-voting-system.git
- Backend API Live: https://online-voting-system-production-d849.up.railway.app
- Frontend Dashboard Live: https://online-voting-system-mauve-three.vercel.app
- Mobile Preview (Expo) Live: https://expo.dev/preview/update?message=My+App&updateRuntimeVersion=1.0.0&createdAt=2026-03-27T13%3A39%3A03.108Z&slug=exp&projectId=ba385ef3-aae4-4b77-934d-466120282920&group=71b66ec8-cca4-4b81-8367-9c895f96aaae

## Architecture

```text
Clients
  ├─ Web Admin Dashboard (React + TS)
  └─ Mobile App (Expo + React Native)
          │
          ▼
Backend API (Express 5)
  ├─ REST endpoints
  ├─ Socket.IO server
  └─ JWT auth + session manager
          │
          ├─ MongoDB (data)
          └─ Cloudinary (optional: image storage)
```

## Implemented Features

### Authentication and authorization
- Role-based access:
  - `Super Admin`
  - `Faculty Admin`
  - `Student`
- JWT authentication (cookie or `Authorization: Bearer <token>`)
- Student login is mobile-only (`X-Client-Type: mobile` required)
- Student account lock after repeated failed login attempts
- Admin/student lock and unlock endpoints

### Election and candidate management
- Create/update/delete elections
- Role + faculty scope validation for election operations
- Dynamic status resolution (`Upcoming`, `Active`, `Closed`, `Inactive`)
- Candidate registration per election with faculty scope checks
- Candidate edits/deletes restricted after election starts

### Voting and results
- Exactly 2 candidates per vote
- Candidates must belong to 2 different positions
- One vote per student per election (transaction + unique DB index)
- `has_voted` tracking on student records
- Live result updates emitted via Socket.IO
- Results endpoint returns ranked candidates with percentages
- Web dashboard exports results as CSV (client-generated)

### AI assistant (implemented)
- Endpoint: `POST /api/ai/assistant`
- Student-only access
- Mobile chat tab in app (`/app/(tabs)/chat.jsx`)
- Layered answering flow:
  - Simple predefined answers
  - Context-based election answers
  - Gemini fallback with cache and daily limit controls

### Student onboarding and university API integration
- Check student data from university API endpoint
- Auto-map faculty/department when available
- Student photo URL handling with optional Cloudinary upload
- Student ID autocomplete search endpoint

### File and media handling
- Profile/admin image upload via Multer
- Optional Cloudinary storage
- Local `/uploads` static serving fallback

## Tech Stack

### Backend (`backend/package.json`)
- Node.js, Express `5.1.0`
- Mongoose `8.15.0`
- JWT (`jsonwebtoken 9.0.2`)
- Socket.IO `4.8.1`
- Multer `2.0.2`
- Cloudinary `2.7.0`
- Axios `1.7.9`

### Frontend (`frontend/package.json`)
- React `19`
- TypeScript `5.7.x`
- Vite `6.3.x`
- Tailwind CSS `4.1.x`
- React Router `7.6.2`
- Socket.IO client `4.8.1`
- ApexCharts `4.1.0`

### Mobile (`mobile/package.json`)
- Expo `~54.0.31`
- React Native `0.81.5`
- Expo Router `~6.0.21`
- Zustand `4.5.4`
- AsyncStorage `2.2.0`

## Project Structure

```text
online-voting-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── seeds/
│   ├── services/              # includes AI assistant services
│   ├── utils/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── mobile/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (tabs)/            # includes vote/results/chat/profile tabs
│   │   └── screens/
│   ├── services/
│   ├── store/
│   ├── constants/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- MongoDB
- Cloudinary account (optional)

### Install
```bash
git clone https://github.com/injineerdaacad/online-voting-system.git
cd online-voting-system

cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

### Run (development)
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev

# Terminal 3
cd mobile
npx expo start
```

Notes:
- Backend listens on `PORT` env var, otherwise defaults to `3000`.
- Frontend typically runs on `5173`.

## Environment Configuration

### Backend (`backend/.env`)
Security note:
- Never commit `.env` files.
- Keep private service URLs, API keys, and credentials out of README, source code, and screenshots.

```bash
# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017
DB_NAME=online_voting_system
# Alternative key supported by code:
# DB=mongodb://localhost:27017/online-voting-system

# Auth
JWT_SECRET=replace-with-strong-secret

# CORS / Socket
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,exp://localhost:8081

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# University API
UNIVERSITY_API_URL=https://<private-university-api-host>
UNIVERSITY_API_TIMEOUT=10000
UNIVERSITY_EMAIL_DOMAIN=<private-university-domain>

# Seed helper
SEED_SUPER_ADMIN_EMAIL=superadmin@<your-domain>

# AI Assistant (optional but recommended)
GEMINI_API_KEY=
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_OUTPUT_TOKENS=200
AI_ASSISTANT_RATE_LIMIT_MAX=5
GEMINI_DAILY_LIMIT=50
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:5000
```

### Mobile
The mobile app currently reads API base URL from:
- `mobile/constants/api.js`

Update `API_URL` there for your environment.

## Database Seeding
Run in this order:

```bash
cd backend
node seeds/seedSuperAdmin.js
node seeds/seedFaculty.js
node seeds/seedDepartment.js
node seeds/seedFacultyAdmins.js
```

## API Reference
Base URLs:
- Local: `http://localhost:5000`
- Live backend: `https://online-voting-system-production-d849.up.railway.app`

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/admin/login`
- `POST /api/auth/admin/logout`
- `POST /api/auth/student/login` (requires `X-Client-Type: mobile`)
- `POST /api/auth/student/logout`
- `POST /api/auth/unlock`

### Users (`/api/users`)
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users`
- `GET /api/users/search-student-ids?query=...`
- `GET /api/users/check/:student_id`
- `GET /api/users/:id`
- `GET /api/users/locked`
- `POST /api/users`
- `POST /api/users/add`
- `PUT /api/users/:id`
- `PATCH /api/users/change-password`
- `PATCH /api/users/:id/reset-password`
- `PATCH /api/users/:id/lock`
- `PATCH /api/users/:id/unlock`
- `DELETE /api/users/:id`

### Students alias
`/api/students` is mounted to the same handlers as `/api/users`.

### Faculties
- `GET /api/faculties`
- `GET /api/faculties/:id`
- `POST /api/faculties/add`
- `PUT /api/faculties/:id`
- `DELETE /api/faculties/:id`

### Departments
- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments/add`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

### Elections
- `GET /api/elections`
- `GET /api/elections/:id`
- `GET /api/elections/eligible/:student_id`
- `POST /api/elections/create`
- `PUT /api/elections/:id`
- `DELETE /api/elections/:id`

### Candidates
- `GET /api/candidates`
- `GET /api/candidates/:id`
- `GET /api/candidates/by-election/:electionId`
- `POST /api/candidates/add`
- `PUT /api/candidates/:id`
- `DELETE /api/candidates/:id`

### Votes
- `POST /api/votes/voteForCandidate`

### Results
- `GET /api/results/:electionId`

### Sessions
- `POST /api/sessions/create`
- `GET /api/sessions/me`
- `POST /api/sessions/extend`
- `POST /api/sessions/logout`
- `GET /api/sessions/user/:userId`
- `POST /api/sessions/user/:userId/revoke-all`

### AI Assistant
- `POST /api/ai/assistant`

## Socket.IO Events

### Client emit
- `join_user_room` with `{ token }`
- `join-election` with `electionId`
- `leave-election` with `electionId`
- `join-faculty` with `facultyId`

### Server emit
- `auth_success`
- `auth_error`
- `vote_cast`
- `election_results_update`

Rooms:
- `user_{userId}`
- `election-{electionId}`
- `faculty-{facultyId}`

## Security Notes
- JWT verification for protected endpoints
- Role checks (`Super Admin`, `Faculty Admin`, `Student`)
- Faculty-scope restrictions for faculty admins
- One-vote-per-election enforced by DB unique index + transaction
- Strict CORS allowlist via `ALLOWED_ORIGINS`
- File upload filtering and size limits in Multer
- AI endpoint rate limited with `express-rate-limit`

## Deployment Notes
- Backend can serve frontend build (`frontend/dist`) for non-API routes
- `/uploads` is served statically by backend
- Configure production env values for:
  - DB
  - JWT
  - CORS origins
  - Cloudinary (if used)
- Current live links:
  - Backend: https://online-voting-system-production-d849.up.railway.app
  - Frontend Live: https://online-voting-system-mauve-three.vercel.app
  - Mobile (Expo preview) Live: https://expo.dev/preview/update?message=My+App&updateRuntimeVersion=1.0.0&createdAt=2026-03-27T13%3A39%3A03.108Z&slug=exp&projectId=ba385ef3-aae4-4b77-934d-466120282920&group=71b66ec8-cca4-4b81-8367-9c895f96aaae

## Roles and Access

### Super Admin
- Full platform access
- Manage faculties, departments, admins, students, and elections
- Review election results across the system

### Faculty Admin
- Faculty-scoped access
- Manage faculty students, departments, elections, and candidates

### Student
- Mobile login
- View eligible elections and candidates
- Cast vote once per election
- View results
- Use AI assistant chat

## Testing
- No automated backend/frontend test suite is currently configured.
- Current project workflow is primarily manual testing from UI + backend REST client files (`backend/rest-api*.http`).

## Troubleshooting

### Backend fails to start
- Check `MONGODB_URI` (or `DB`) and `DB_NAME`
- Confirm `JWT_SECRET` is set
- Verify `PORT` is free

### Student mobile login returns 403
- Ensure request includes header: `X-Client-Type: mobile`

### Frontend cannot reach API
- Set `VITE_API_URL` correctly
- Add frontend origin to `ALLOWED_ORIGINS`

### AI assistant unavailable
- Confirm `GEMINI_API_KEY` and related AI env variables
- Check `AI_ASSISTANT_RATE_LIMIT_MAX` and `GEMINI_DAILY_LIMIT`

### Image uploads fail
- Verify Cloudinary credentials, or run without Cloudinary for local upload fallback

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes and validate flows manually
4. Open a pull request with a clear summary

## License
This project is licensed under the MIT License.

---

Repository: https://github.com/injineerdaacad/online-voting-system

Last Updated: March 27, 2026
Version: 1.0.0
