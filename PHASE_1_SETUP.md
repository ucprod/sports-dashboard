# Phase 1: Foundation & Setup — Complete Checklist

**Status:** ✅ Code scaffolding complete. Ready for local development.

This document guides you through completing Phase 1 on your local machine.

---

## What's Been Done (Code Scaffolding)

✅ Next.js 14 project structure initialized with TypeScript + Tailwind
✅ Configuration files created (tsconfig, next.config, tailwind.config, etc.)
✅ Environment variables template (.env.example, .env.local)
✅ TypeScript type definitions for NHL API, database schema, and UI components
✅ Supabase client initialization
✅ Application constants and configuration
✅ Database schema SQL migration (ready to run)
✅ API routes scaffolding (health check, refresh endpoint placeholders)
✅ Root layout and homepage with Tailwind styling
✅ Testing framework setup (Jest, React Testing Library)
✅ Comprehensive README and documentation

---

## What You Need to Do (Phase 1 on Your Machine)

### Step 1: Clone/Download the Code

The code is in: `/sessions/sleepy-brave-hamilton/mnt/sports-dashboard/`

Copy this folder to your local machine:

```bash
# On your machine, copy the project folder
# (From wherever your file system has it mounted)
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine)
2. Create a new project:
   - Name: "nhl-sports-dashboard"
   - Region: Choose closest to you
   - Database password: Save this
3. Wait for project to be created (~2 minutes)

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase/migrations/001_init_schema.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Verify: You should see 6 tables created (teams, players, games, standings, refresh_log, roster_snapshots)

**Tables created:**
- `teams` — NHL team metadata
- `players` — Player roster data + portrait URLs
- `games` — Cached game results and upcoming games
- `standings` — Team standings
- `refresh_log` — Monitoring/debugging for refresh job
- `roster_snapshots` — For detecting roster changes

### Step 4: Create Supabase Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket:
   - Name: `player-portraits`
   - Make it **Public** (so we can embed URLs)
3. Save

### Step 5: Get Your API Keys

In Supabase dashboard, go to **Project Settings** → **API**:

1. Copy `Project URL` (looks like: `https://xxxxx.supabase.co`)
2. Copy `anon public` key (under API Keys)
3. Copy `service_role` key (under API Keys)

### Step 6: Update .env.local

In your local project, edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAi...
SUPABASE_SERVICE_KEY=eyJ0eXAi...
```

(Leave OpenAI key blank for now; we'll add it in Phase 4)

### Step 7: Install Dependencies

```bash
cd /path/to/nhl-sports-dashboard
npm install
```

This installs:
- Next.js 14
- React 18
- Tailwind CSS
- Supabase client
- Testing libraries (Jest, React Testing Library)

### Step 8: Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

**Expected result:**
- Page loads with header "🏒 Edmonton Oilers Dashboard"
- You see placeholder cards for Roster, Games, Standings
- Setup instructions visible
- No console errors

### Step 9: Verify Supabase Connection

Open browser DevTools → Console and check for:

```
[Supabase] ✓ Connection successful
```

If you see an error, check:
- `.env.local` has correct URL and key
- Supabase project is online
- Network is connected

### Step 10: Verify API Health Endpoint

In browser, visit: `http://localhost:3000/api/health`

You should see JSON response:

```json
{
  "status": "healthy",
  "message": "App and database are operational",
  "timestamp": "2026-03-10T..."
}
```

If status is "degraded" or "error", check Supabase connection again.

---

## Phase 1 Deliverables ✅

- [x] Next.js app running locally
- [x] TypeScript configured
- [x] Tailwind CSS ready
- [x] Supabase connected and accessible
- [x] Database tables created
- [x] Environment variables configured
- [x] Health check endpoint working
- [x] API routes scaffolding in place

---

## What's Next?

Once Phase 1 is complete, you're ready for **Phase 2: NHL API Integration**.

In Phase 2, you'll:
1. Implement `lib/nhl-api.ts` to fetch from NHL API
2. Test endpoints locally (console.log output)
3. Verify data structure matches types

See `IMPLEMENTATION_PLAN.md` for the full Phase 2 breakdown.

---

## Troubleshooting

### "npm install fails"

**Cause:** Network or registry issue
**Fix:**
```bash
npm cache clean --force
npm install
```

### "Can't connect to Supabase"

**Cause:** Wrong credentials or project not ready
**Fix:**
1. Check `.env.local` has correct values
2. Wait 1 minute for Supabase project to fully initialize
3. Try refreshing browser

### "Build errors with TypeScript"

**Cause:** Missing types or version mismatch
**Fix:**
```bash
npm run lint
```

This shows what TypeScript is complaining about.

### Port 3000 already in use

**Fix:**
```bash
npm run dev -- -p 3001
```

Visit: `http://localhost:3001` instead

---

## Files & Structure

**Key directories:**

```
src/
├── app/              # Next.js pages & API routes
├── components/       # React components (WIP - Phase 3)
├── lib/              # Utilities (supabase client, constants, etc.)
├── types/            # TypeScript definitions
└── hooks/            # Custom React hooks (WIP)

supabase/
└── migrations/       # SQL schema (run in Phase 1 Step 3)

.env.local           # Your secrets (NEVER commit)
.env.example         # Template
CLAUDE.md            # Project spec
IMPLEMENTATION_PLAN.md
README.md
PHASE_1_SETUP.md     # This file
```

---

## Success Criteria

✅ You've completed Phase 1 when:

1. `npm install` succeeds
2. `npm run dev` starts the server
3. You can load `http://localhost:3000`
4. Database tables exist in Supabase
5. `/api/health` returns `status: healthy`
6. No console errors

**Estimated time:** 30–45 minutes

---

**Next:** Start Phase 2 when ready. See `IMPLEMENTATION_PLAN.md` Phase 2 section.
