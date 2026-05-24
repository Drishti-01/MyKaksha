# PostgreSQL + Prisma (Evaluation Showcase)

This is an **isolated add-on**. The rest of MyKaksha (auth, rooms, chat, projects, analytics) still uses **MongoDB + Mongoose**.

## Feature: Study Resources

Users bookmark study links (videos, articles, docs) at `/resources`.

| Layer | Technology |
|-------|------------|
| UI | React — `src/components/StudyResources.jsx` |
| API | Express — `/api/study-resources/*` |
| ORM | Prisma |
| Database | PostgreSQL |

## Troubleshooting

### P1001 — `Can't reach database server at localhost:51214`

`prisma init` often appends a **second** `DATABASE_URL` like `prisma+postgres://localhost:...`. That overrides your Neon URL and only works while `npx prisma dev` is running.

**Fix:** Keep **one** `DATABASE_URL` in `.env` — your Neon (or Supabase) connection string. Delete any `prisma+postgres://localhost` line.

### EADDRINUSE — port 4000 already in use

Another `npm run server` is still running. Stop it (Ctrl+C in that terminal) or:

```powershell
netstat -ano | findstr ":4000"
taskkill /PID <pid> /F
```

Then run `npm run dev:all` again.

## Setup (one-time)

1. Create a free PostgreSQL database (Neon, Supabase, or Railway).
2. Add to `.env`:

   ```env
   DATABASE_URL=postgresql://...
   ```

3. Install and migrate:

   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   ```

4. Start the app: `npm run dev:all`
5. Log in → sidebar → **Resources**

## API endpoints (demo for evaluators)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/study-resources/status` | No | PostgreSQL connection check |
| GET | `/api/study-resources/categories` | Yes | List categories (Prisma `findMany`) |
| GET | `/api/study-resources` | Yes | List user resources (`include: category`) |
| POST | `/api/study-resources` | Yes | Create (`prisma.studyResource.create`) |
| PUT | `/api/study-resources/:id` | Yes | Update |
| DELETE | `/api/study-resources/:id` | Yes | Delete |
| GET | `/api/study-resources/stats` | Yes | `groupBy` on category |

## Prisma concepts demonstrated

- `schema.prisma` with `@relation`, `@@index`, `onDelete: Restrict`
- Migrations in `prisma/migrations/`
- `PrismaClient` singleton (`server/lib/prisma.js`)
- CRUD, `include`, `upsert`, `groupBy`, `$queryRaw`

## Files (no MongoDB changes)

```
prisma/schema.prisma
server/lib/prisma.js
server/services/studyResourceStore.js
server/controllers/studyResourceController.js
server/routes/studyResourceRoutes.js
src/api/studyResources.js
src/components/StudyResources.jsx
```
