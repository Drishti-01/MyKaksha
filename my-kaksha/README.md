# My Kaksha

My Kaksha is a React + Vite frontend with an Express backend for ST2-style study management topics.

## Current backend concepts covered

- Client-server architecture with Vite frontend and Express backend
- REST-style routing with `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`
- Middleware: `cors`, `express.json`, `cookie-parser`, auth protection, validation, centralized error handling
- Async programming with `fetch`, `fs/promises`, Mongoose, bcrypt, JWT, and Socket.io
- Sync vs async example in the file-store bootstrap comments
- Event-loop relevance through timers, sockets, and non-blocking file/database calls
- JSON storage for study data, projects, and sessions
- MongoDB + Mongoose for user authentication
- JWT + HttpOnly cookies + lightweight session tracking
- Protected routes on both backend and frontend
- Modular backend structure with routes, controllers, services, middleware, and models

## Main API routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Legacy compatibility routes are also kept:

- `POST /signup`
- `POST /login`

### Study Data

- `GET /api/study-data`
- `PUT /api/study-data`

Study data is stored in JSON and now reads/writes per authenticated user while preserving legacy shared data as fallback.

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:projectId`
- `PATCH /api/projects/:projectId/status`
- `DELETE /api/projects/:projectId`

### Realtime

- Socket.io room chat on the same backend server

## Environment variables

Create a `.env` file in `my-kaksha/`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
MONGODB_DB=mykaksha
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

## Run locally

```bash
npm install
npm run server
npm run dev
```

Frontend dev server:

- `http://localhost:5173`

Backend server:

- `http://localhost:4000`
