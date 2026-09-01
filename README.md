# 🏛️ VAANI
### Vigilant Administration & Accountability Network Intelligence
### मुख्यमंत्री शिकायत प्रबंधन प्रणाली

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

VAANI is a complaint and grievance management system for government departments in Delhi. Citizens can submit issues, track status, and receive updates while officers, departments, and administrators work through a role-based workflow with SLA monitoring and escalation.

## Features

- Citizen complaint filing and tracking
- OTP-based login flow
- Role-based access for citizen, officer, department manager, district officer, and CM/admin users
- Live status updates and notifications
- SLA tracking and escalation logic
- Dashboard views for district and department performance
- MongoDB-backed backend with Express and Next.js frontend

## Role access

| Role | Portal | Purpose |
| :--- | :--- | :--- |
| Citizen | `/citizen` | File complaints and track progress |
| Field Officer | `/officer` | Resolve assigned complaints |
| Department Manager | `/dashboard` | Review department complaints and verify closure |
| District Magistrate | `/dashboard` | Monitor district-level action and escalation |
| CM / Admin | `/dashboard` | Full system overview and governance monitoring |

## Project structure

```bash
app/                  # Next.js frontend
backend/              # Express API and data layer
  src/
    controllers/      # Auth and complaint logic
    routes/           # API routes
    models/           # MongoDB models
    services/         # Notifications, SMS, AI logic
    jobs/             # Cron-based monitoring
    data/seed/        # Demo data seed scripts
```

## Getting started

### 1. Install dependencies

```bash
cd VAANI
npm install
cd backend
npm install
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Update `.env` with values like:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/vaani
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
DEMO_MODE=true
```

### 3. Run the app

Backend:

```bash
cd backend
PORT=5001 node src/server.js
```

Frontend:

```bash
cd ..
npm run dev
```

Access URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:5001/api
- Health check: http://localhost:5001/api/health

## Tech stack

### Frontend

| Technology | Purpose |
| :--- | :--- |
| Next.js | App routing and UI |
| React | Component-based frontend |
| Socket.io Client | Real-time updates |

### Backend

| Technology | Purpose |
| :--- | :--- |
| Node.js | JavaScript runtime |
| Express | API server |
| MongoDB + Mongoose | Database and schema layer |
| Socket.io | Real-time communication |
| JWT | Authentication |
| Bull + node-cron | Background jobs and scheduling |

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
