# Tower of Rock, Paper and Scissors - Local deployment

This repository contains the code needed to locally run a rock paper scissors game using docker, in other branches of this repo other deployment methods will be used. The application consists of a login, a page where you see a scoreboard, a game where you play rock paper scissors against a computer that will randomly make its own choice and an admin dashboard where you can manage users and view logs from the backend.

---

## Architecture Overview

1. **Frontend Tier (`frontend`):**
   - Node.js Express server serving retro arcade UI assets from `public/`.
   - Embedded reverse proxy routing `/api/*` traffic directly to the Backend service.
   - Exposed on **port 3000** and **port 80**.
   - Healthcheck endpoint: `http://localhost:3000/health`.

2. **Backend Tier (`backend`):**
   - Node.js Express REST API managing game referee logic, round outcomes, user authentication (JWT), and administration.
   - Connects to PostgreSQL on port 5432.
   - Centralized logging support writing to `/var/log/rps-central.log`.
   - Exposed on **port 4000**.
   - Healthcheck endpoint: `http://localhost:4000/health` (returns database connection status).

3. **Storage Tier (`storage`):**
   - PostgreSQL 15 Alpine database with `uuid-ossp` extension.
   - Automatically initializes schema (`users` and `games` tables) and seeds default users (including default admin `admin` / `admin123`).
   - Persistent Docker volume: `postgres_data`.

---

## Directory Structure

```text
docker-deploy/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── db.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   ├── js/
│   │   ├── rps_images/
│   │   └── index.html
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── storage/
│   ├── Dockerfile
│   └── init.sql
├── .env
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### 1. Prerequisites
- Docker Engine (v20+ or Docker Desktop)
- Docker Compose v2+

### 2. Configure Environment
The provided `.env.example` is pre-configured with functional defaults. Copy the contents of the file to `.env`:
```bash
# Database
POSTGRES_USER=rps_user
POSTGRES_PASSWORD=password123
POSTGRES_DB=rps_db

# Backend
PORT=4000
BACKEND_PORT=4000
DB_HOST=database
DB_PORT=5432
DB_USER=rps_user
DB_PASSWORD=password123
DB_NAME=rps_db
JWT_SECRET=rps_super_secret_jwt_key_2026_dev

# Frontend
FRONTEND_PORT=3000
BACKEND_URL=http://backend:4000
```

### 3. Build & Run
Run Docker Compose from inside this directory:
```bash
docker compose up --build -d
```

### 4. Verify Services
Check running containers and health status:
```bash
docker compose ps
```
All services (`rps-frontend`, `rps-backend`, `rps-database`) should show status `Up` and `healthy`.

### 5. Access the Application
Open your browser and navigate to:
- **Frontend Game UI:** [http://localhost:3000](http://localhost:3000) or [http://localhost](http://localhost)
- **Frontend Health Check:** [http://localhost:3000/health](http://localhost:3000/health)
- **Backend Direct Health Check:** [http://localhost:4000/health](http://localhost:4000/health)
- **Backend API through Proxy:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 6. Default Credentials
- **Admin Account:**
  - Username: `admin`
  - Password: `admin123`
  - Features: Access to Admin Dashboard, view centralized system logs, manage users and games.
- **Pre-seeded Players (Leaderboard):**
  - `slayman1` (Score: 9)
  - `Big_Ajuin` (Score: 6)
  - `Wooly_Ruler` (Score: 5)
  - `Sanguinius` (Score: 3)

### 7. Stop Services
```bash
docker compose down
```
To also remove persistent database data:
```bash
docker compose down -v
```

## License

This project is a personal portfolio project created to showcase my skills and knowledge in DevOps, infrastructure as code, containerization, orchestration, configuration management, and CI/CD.

It project is licensed under the [MIT License](LICENSE).

You are free to use, copy, modify, and distribute this project in accordance with the terms of the license.