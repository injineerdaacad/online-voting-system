# Online Voting System

The Online Voting System is an end-to-end election platform tailored for universities. It ships with a MongoDB-powered API, an admin-facing web dashboard, and a student-focused mobile app so institutions can plan, administer, and monitor secure digital elections.

## Overview

This monorepo contains three deployable surfaces that work together:

- **Backend (`backend/`)** – Node.js (Express 5) REST API that manages admins, faculties, departments, students, elections, candidates, and vote tallying.
- **Web Admin (`frontend/`)** – React + Tailwind CSS dashboard (built on TailAdmin) for super admins and faculty administrators to orchestrate elections and monitor results.
- **Mobile App (`mobile/`)** – Expo + React Native voter experience that lets authenticated students review ballots and cast votes from their devices.

## Core Features

- Role-based authentication with super admin, faculty admin, and student flows.
- Faculty, department, and student roster management with reusable seed scripts.
- Election lifecycle management (setup, scheduling, status changes) with tailored flows for:
	- **Faculty Leadership Elections** – departmental or faculty-level officer roles for active students.
	- **Student Union Elections** – campus-wide executive positions overseen by the central administration.
	- **Alumni Association Elections** – governance roles reserved for verified alumni voters.
- Candidate onboarding with manifesto uploads, Cloudinary-backed media storage, and position-level validation.
- Secure voting workflow that enforces time windows, per-position voting limits, and single-submission guarantees.
- Real-time result aggregation API that collates vote totals per candidate and surfaces formatted election summaries.
- Audit-friendly activity tracking (login attempt throttling, account locking, and voting history snapshots).

## Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| Backend API  | Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt.js, Multer, Cloudinary   |
| Web Admin UI | React 19, Vite, Tailwind CSS (TailAdmin), TypeScript                         |
| Mobile App   | Expo Router, React Native 0.81, Zustand, Expo SDK 54, React Navigation       |

## Repository Structure

```
online-voting-system/
├── backend/             # Express API, controllers, models, middlewares, and seed scripts
├── frontend/            # Vite + React admin dashboard (TailAdmin template)
├── mobile/              # Expo React Native application for voters
└── package.json         # Workspace metadata
```

## Getting Started

### Prerequisites

- Node.js 18 (or newer)
- MongoDB instance (local or hosted)
- Cloudinary account for media storage (optional but required for candidate photos)

### Environment Variables

This repo ships with example files and ignore rules so secrets stay out of git while every developer knows what to set.

1. **Copy the templates**

	```bash
	cp backend/.env.example backend/.env
	cp frontend/.env.example frontend/.env
	```

2. **Fill in your secrets**
	- `backend/.env` → add your MongoDB Atlas URI in `DB`, choose a strong `JWT_SECRET`, and paste the Cloudinary credentials used for media uploads.
	- `frontend/.env` → set `VITE_API_URL` to the backend URL you want the dashboard to call. For local development use `http://localhost:5000/api`; in production use the Render backend URL.

3. **Keep secrets local**
	- The root `.gitignore` already excludes `*.env`, `backend/.env`, and `frontend/.env`, so `git status` should never show these private files.
	- Commit only the `.env.example` files—other developers can copy them and plug in their own credentials.

4. **Deploying on Render**
	- In the Render dashboard, open the backend service → **Environment** → **Environment Variables**.
	- Add the same keys (`PORT`, `DB`, `JWT_SECRET`, `CLOUDINARY_*`) with production values. Render stores them securely, so nothing sensitive needs to be committed.
	- Redeploy the service so the new environment variables take effect.

Following this pattern keeps MongoDB Atlas and Render secrets private while giving teammates a clear checklist.

### Backend API

1. Create `backend/.env` with the following keys:

	 ```bash
	 PORT=5000
	 DB="mongodb+srv://<username>:<password>@<cluster>/<database>"
	 JWT_SECRET="super-secret-key"
	 CLOUDINARY_NAME="your-cloud-name"
	 CLOUDINARY_API_KEY="your-api-key"
	 CLOUDINARY_API_SECRET="your-api-secret"
	 ```

2. Install dependencies and start the development server:

	 ```bash
	 cd backend
	 npm install
	 npm run dev
	 ```

### Database Seeding (optional but recommended)

Bootstrapping data helps you explore the system quickly. Run the scripts in the following order from the `backend` directory:

```bash
node seedSuperAdmin.js      # Creates the initial super-admin account
node seedFaculty.js         # Populates faculties
node seedDepartment.js      # Attaches departments to faculties
node seedFacultyAdmins.js   # Creates department-level administrators
```

### Web Admin Dashboard

```bash
cd frontend
npm install
npm run dev
```

The dashboard defaults to `http://localhost:5173` and proxies API requests to the backend server.

### Mobile App

```bash
cd mobile
npm install
npx expo start
```

Set the API base URL inside the mobile app configuration (see `mobile/constants` or `.env` files) so it points to your running backend.

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes with clear commit messages.
3. Submit a pull request with context, screenshots, or testing notes.

## License

This project is released under the MIT License. See `LICENSE.md` for additional details.# online-voting-system# online-voting-system
