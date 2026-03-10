# NHL Sports Dashboard PoC — Detailed Implementation Plan

**Status:** Ready for development
**Last Updated:** 2026-03-10
**Target Launch:** Week 7 (mid-April 2026)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supabase Schema](#supabase-schema)
3. [NHL API Reference](#nhl-api-reference)
4. [Image Generation Strategy](#image-generation-strategy)
5. [Vercel Cron & Refresh Job](#vercel-cron--refresh-job)
6. [File Structure (Final)](#file-structure-final)
7. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Testing Plan](#testing-plan)
11. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### High-Level Flow

```
User visits app (Day 1-7)
    ↓
Load cached data from Supabase (roster, portraits, games, standings)
    ↓
Display dashboard with 16-bit player portraits + stats
    ↓
[Every day at 3 AM EST]
    ↓
Vercel Cron triggers /api/refresh
    ↓
Refresh job:
  1. Fetch current roster from NHL API
  2. Compare against roster_snapshots (detect new/removed players)
  3. For NEW players: Generate 16-bit portrait via DALL-E
  4. For REMOVED players: Mark as inactive
  5. Fetch latest games, standings from NHL API
  6. Update Supabase tables
  7. Log refresh completion
    ↓
Next user load (Day 2) → sees fresh cached data
```

### Key Decisions Locked In

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Image Generation** | DALL-E | Quality 16-bit SNES-style output |
| **Image Storage** | Supabase Storage (object bucket) | CDN-friendly, easy access |
| **Stats Fetch Timing** | 3 AM daily refresh | Cache all day, minimal API calls |
| **Cron Schedule** | Hardcoded `0 8 * * *` (UTC) | 3 AM EST, simple config |
| **Placeholder Image** | Static CDN URL | Fallback when DALL-E fails |
| **Roster Change Detection** | Skip regen if portrait exists | Cost optimization (save DALL-E calls) |
| **Schema Design** | Multi-team from day 1 | Scale-ready (Edmonton only in v1) |
| **Team Data Updates** | Full regeneration on roster change | Simpler than incremental updates |

---

## Supabase Schema

### Database Tables (Multi-Team Ready)

#### 1. `teams`
Metadata for each NHL team (start with Edmonton Oilers).

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,           -- From NHL API (e.g., 25 for Oilers)
  name VARCHAR(255) NOT NULL,           -- "Edmonton Oilers"
  abbreviation VARCHAR(3) NOT NULL,     -- "EDM"
  logo_url TEXT,                        -- Team logo
  primary_color VARCHAR(7),             -- "#FF4500" (Oilers orange)
  secondary_color VARCHAR(7),           -- "#003399" (Oilers blue)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Insert Edmonton Oilers (for v1)
INSERT INTO teams (nhl_id, name, abbreviation, primary_color, secondary_color)
VALUES (25, 'Edmonton Oilers', 'EDM', '#FF4500', '#003399');
```

#### 2. `players`
All players across all teams (multi-team ready).

```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,           -- From NHL API player ID
  team_id INT NOT NULL REFERENCES teams(id),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  position VARCHAR(10) NOT NULL,        -- "C", "LW", "RW", "D", "G"
  number INT,
  jersey_number INT,
  nhl_headshot_url TEXT,                -- Official NHL photo URL
  portrait_url TEXT,                    -- Generated 16-bit portrait (Supabase Storage)
  portrait_generated_at TIMESTAMP,      -- When we generated the portrait
  is_active BOOLEAN DEFAULT true,       -- False if removed from roster
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(nhl_id, team_id)               -- Player unique per team
);
```

#### 3. `roster_snapshots`
Track what roster we had at each refresh (for change detection).

```sql
CREATE TABLE roster_snapshots (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id),
  roster_snapshot JSONB NOT NULL,       -- Array of {nhl_id, name, position}
  player_count INT,
  snapshot_date TIMESTAMP DEFAULT now(),
  UNIQUE(team_id, snapshot_date)
);
```

#### 4. `games`
Upcoming & recent games (cache most recent game + next 3 games).

```sql
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,           -- From NHL API
  team_id INT NOT NULL REFERENCES teams(id),
  opponent_team_id INT REFERENCES teams(id),
  game_type VARCHAR(20),                -- "R" (regular), "P" (playoff)
  game_date TIMESTAMP NOT NULL,
  home_team_nhl_id INT,
  away_team_nhl_id INT,
  home_team_name VARCHAR(255),
  away_team_name VARCHAR(255),
  status VARCHAR(50),                   -- "Final", "Scheduled", "In Progress"
  home_score INT,
  away_score INT,
  is_team_home BOOLEAN,                 -- True if our team is home
  cached_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);
```

#### 5. `standings`
Team standings (updated daily).

```sql
CREATE TABLE standings (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id),
  season INT NOT NULL,                  -- e.g., 2025 (2025-26 season)
  rank INT,                             -- Overall rank
  division_rank INT,
  conference VARCHAR(50),               -- "Eastern" or "Western"
  division VARCHAR(50),                 -- "Atlantic", "Metropolitan", etc.
  games_played INT,
  wins INT,
  losses INT,
  overtime_losses INT,
  points INT,
  goals_for INT,
  goals_against INT,
  goal_differential INT,
  cached_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(team_id, season)
);
```

#### 6. `refresh_log`
Track when refresh jobs run (for monitoring & debugging).

```sql
CREATE TABLE refresh_log (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id),
  refresh_date TIMESTAMP DEFAULT now(),
  status VARCHAR(50),                   -- "success", "partial", "failed"
  players_added INT,
  players_removed INT,
  portraits_generated INT,
  portraits_failed INT,
  error_message TEXT,
  duration_ms INT,                      -- How long the job took
  created_at TIMESTAMP DEFAULT now()
);
```

### Supabase Storage Bucket

**Bucket Name:** `player-portraits`
**Visibility:** Public (so we can embed URLs in our app)
**Path Structure:** `{team_abbreviation}/{player_nhl_id}.png`

Example: `EDM/97.png` (Connor McDavid's portrait)

---

## NHL API Reference

### Base URL
```
https://statsapi.nhl.com/api/v1
```

### Endpoints Used

#### 1. Fetch Team Roster
```
GET /teams/{teamId}/roster
```

**Query Params:** None required
**Response:** Array of players with position, jersey number, name, ID

**Example:**
```bash
curl "https://statsapi.nhl.com/api/v1/teams/25/roster"
```

**Parse:**
```typescript
interface RosterPlayer {
  person: {
    id: number;             // nhl_id
    fullName: string;
    link: string;
  };
  jerseyNumber: number;
  position: {
    code: string;           // "C", "LW", "RW", "D", "G"
    name: string;
  };
}
```

#### 2. Fetch Player Details (for headshot URL)
```
GET /people/{playerId}
```

**Response:** Player details including headshot URL

**Example:**
```bash
curl "https://statsapi.nhl.com/api/v1/people/97"  # Connor McDavid
```

**Parse:**
```typescript
interface PlayerDetail {
  person: {
    id: number;
    fullName: string;
    link: string;
    primaryNumber: number;
    birthDate: string;
    currentAge: number;
    birthCity: string;
    birthCountry: string;
    height: string;
    weight: number;
    active: boolean;
    alternateCaptain: boolean;
    captain: boolean;
    rookie: boolean;
    shootsCatches: string;
    rosterStatus: string;
    stats: [{
      type: { displayName: string };
      stats: {
        assists: number;
        games: number;
        goals: number;
        points: number;
        // ... more stats
      };
    }];
  };
}
```

**Headshot URL:** Construct from:
```
https://nhl.com/img/skaters/{playerId}.jpg
```

#### 3. Fetch Team Schedule
```
GET /teams/{teamId}/schedule
```

**Query Params:**
- `season={season}` (optional, e.g., `20252026` for 2025-26 season)
- `expand=schedule.linescore` (optional, for more detail)

**Response:** Array of games

**Example:**
```bash
curl "https://statsapi.nhl.com/api/v1/teams/25/schedule?season=20252026"
```

**Parse (last game & next game):**
```typescript
interface Game {
  gamePk: number;           // nhl_id for games table
  link: string;
  gameType: string;         // "R", "P", "PR"
  season: number;
  gameDate: string;         // ISO timestamp
  status: {
    abstractGameState: string;  // "Final", "Live", "Scheduled"
    detailedState: string;
    statusCode: string;
  };
  teams: {
    away: {
      leagueRecord: { wins: number; losses: number; ot: number };
      score: number;
      team: { id: number; name: string };
    };
    home: {
      leagueRecord: { wins: number; losses: number; ot: number };
      score: number;
      team: { id: number; name: string };
    };
  };
}
```

#### 4. Fetch Standings
```
GET /standings
```

**Query Params:**
- `season={season}` (optional)
- `leagueId={leagueId}` (optional, e.g., `NHL` for NHL only)

**Response:** Array of division records with team standings

**Example:**
```bash
curl "https://statsapi.nhl.com/api/v1/standings?season=20252026"
```

**Parse (find our team):**
```typescript
interface Standing {
  division: {
    name: string;
    id: number;
  };
  conference: {
    name: string;
    id: number;
  };
  teamRecords: [{
    team: {
      id: number;
      name: string;
      link: string;
    };
    leagueRecord: {
      wins: number;
      losses: number;
      ot: number;
    };
    points: number;
    gamesPlayed: number;
    divisionRank: string;
    conferenceRank: string;
    leagueRank: string;
    goalsFor: number;
    goalsAgainst: number;
    goalDifferential: number;
  }];
}
```

---

## Image Generation Strategy

### DALL-E Configuration

**Model:** `dall-e-3`
**Size:** `1024x1024` (downscale to ~256x256 for 16-bit effect)
**Quality:** `standard` (cheaper than `hd`, sufficient for pixel art)
**Prompt Template:**

```
Generate a 16-bit SNES-style pixel art portrait of {playerName},
an NHL hockey player wearing an Edmonton Oilers jersey.
The portrait should be a headshot showing the player's face and upper chest,
with visible team colors (orange and blue).
The art style should be similar to 1990s video game characters -
pixelated, with limited but vibrant color palette,
clear facial features, and recognizable as the player.
High contrast, clean lines, no gradient fills.
Square canvas, centered composition.
```

### Image Generation Flow

```
Player added to roster (detected during refresh)
    ↓
Fetch NHL headshot URL from API
    ↓
Call OpenAI DALL-E API with prompt
    ↓
On success:
  → Download image bytes
  → Compress/optimize PNG
  → Upload to Supabase Storage: {team_abbreviation}/{nhl_id}.png
  → Store portrait_url in players table
  → Log success
    ↓
On failure:
  → Store error in refresh_log
  → Set portrait_url to PLACEHOLDER_IMAGE_URL
  → Don't retry (skip logic prevents re-generation)
  → Continue with next player
```

### Placeholder Image

Use a static, generic player silhouette hosted on a CDN:

```
https://via.placeholder.com/256x256?text={playerInitials}
```

Or store in Supabase Storage as a default:
```
player-portraits/DEFAULT_PORTRAIT.png
```

---

## Vercel Cron & Refresh Job

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/refresh",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Cron Schedule Explanation:**
- `0` = minute 0
- `8` = hour 8 (UTC) = 3 AM EST
- `*` = every day
- `*` = every month
- `*` = every day of week

### Refresh Job Logic

**Endpoint:** `POST /api/refresh` (triggered by Cron)

**Pseudo-code:**

```typescript
export async function POST(req: NextRequest) {
  try {
    const teamId = 1; // Edmonton Oilers (hardcoded for v1)

    // 1. Fetch current roster from NHL API
    const nhlRoster = await fetchNHLRoster(25); // NHL team ID

    // 2. Get last roster snapshot from DB
    const lastSnapshot = await getLastRosterSnapshot(teamId);

    // 3. Detect changes
    const newPlayers = detectNewPlayers(nhlRoster, lastSnapshot);
    const removedPlayers = detectRemovedPlayers(nhlRoster, lastSnapshot);

    // 4. Generate portraits for NEW players only
    for (const player of newPlayers) {
      // Check if portrait already exists in DB
      const existing = await getPlayerPortrait(player.nhl_id);

      if (!existing) {
        // Generate via DALL-E
        const portraitUrl = await generatePlayerPortrait(player);
        await updatePlayerPortrait(player.nhl_id, portraitUrl);
      }
    }

    // 5. Mark removed players as inactive
    for (const player of removedPlayers) {
      await markPlayerInactive(player.nhl_id);
    }

    // 6. Fetch and cache latest games
    const games = await fetchTeamSchedule(25);
    const lastGame = getLastCompletedGame(games);
    const nextGame = getNextScheduledGame(games);
    await updateGamesTable(teamId, [lastGame, nextGame]);

    // 7. Fetch and cache standings
    const standings = await fetchStandings();
    const ourStanding = standings.find(s => s.team.id === 25);
    await updateStandingsTable(teamId, ourStanding);

    // 8. Log refresh completion
    await logRefresh(teamId, {
      status: 'success',
      playersAdded: newPlayers.length,
      playersRemoved: removedPlayers.length,
      portraitsGenerated: newPlayers.length,
      portraitsFailed: 0,
      duration: Date.now() - startTime
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error and continue (don't break the app)
    await logRefresh(teamId, {
      status: 'failed',
      errorMessage: error.message,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { error: 'Refresh failed', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## File Structure (Final)

```
nhl-sports-dashboard/
├── .env.local                          # Secrets (not committed)
├── .env.example                        # Template
├── .gitignore
├── CLAUDE.md                           # Project spec
├── IMPLEMENTATION_PLAN.md              # This file
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vercel.json                         # Cron config
├── package.json
├── package-lock.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Dashboard homepage
│   │   ├── globals.css                 # Tailwind styles
│   │   └── api/
│   │       ├── refresh/
│   │       │   └── route.ts            # POST /api/refresh (Cron job)
│   │       ├── health/
│   │       │   └── route.ts            # GET /api/health (monitoring)
│   │       └── teams/
│   │           └── route.ts            # GET/POST team preference
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx           # Main layout wrapper
│   │   │   ├── Roster.tsx              # Player grid
│   │   │   ├── RosterPlayer.tsx        # Player card (portrait + stats)
│   │   │   ├── GameCard.tsx            # Game result/upcoming
│   │   │   └── StandingsTable.tsx      # Division standings
│   │   │
│   │   ├── ui/
│   │   │   ├── LoadingSpinner.tsx      # Loading state
│   │   │   ├── ErrorBoundary.tsx       # Error handler
│   │   │   ├── TeamSelector.tsx        # Team dropdown (future)
│   │   │   └── ErrorMessage.tsx        # Error display
│   │   │
│   │   └── common/
│   │       └── Layout.tsx              # Wrapper layout
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   ├── nhl-api.ts                  # NHL API client & types
│   │   ├── image-generation.ts         # DALL-E integration
│   │   ├── refresh-job.ts              # Refresh orchestration
│   │   ├── roster-sync.ts              # Change detection
│   │   ├── cache.ts                    # Cache utilities
│   │   └── constants.ts                # Constants
│   │
│   ├── types/
│   │   ├── index.ts                    # Shared types
│   │   ├── nhl.ts                      # NHL API types
│   │   ├── database.ts                 # DB schema types
│   │   └── ui.ts                       # Component prop types
│   │
│   ├── hooks/
│   │   ├── useDashboardData.ts         # Fetch roster, games, standings
│   │   ├── useTeamPreference.ts        # localStorage team selection
│   │   └── useRefreshStatus.ts         # Last refresh timestamp
│   │
│   └── utils/
│       ├── format.ts                   # Date/time formatting
│       ├── fetch-retry.ts              # Retry logic
│       └── error-logger.ts             # Error logging
│
├── public/
│   ├── icons/
│   │   └── oilers-logo.svg
│   └── placeholder-portrait.png        # Fallback image
│
├── tests/
│   ├── api/
│   │   ├── refresh.test.ts
│   │   └── health.test.ts
│   ├── lib/
│   │   ├── nhl-api.test.ts
│   │   ├── roster-sync.test.ts
│   │   └── image-generation.test.ts
│   └── components/
│       ├── RosterPlayer.test.tsx
│       └── Dashboard.test.tsx
│
└── docs/
    ├── ARCHITECTURE.md                 # Detailed decisions
    ├── API.md                          # API reference
    └── DEPLOYMENT.md                   # Launch checklist
```

---

## Phase-by-Phase Implementation

### **Phase 1: Foundation & Setup** (Days 1–3)

**Goal:** Project scaffold, Supabase configured, constants defined

**Tasks:**
- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up Supabase project (free tier)
- [ ] Create all tables (teams, players, games, standings, refresh_log, roster_snapshots)
- [ ] Create Supabase Storage bucket `player-portraits` (public)
- [ ] Configure `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
  SUPABASE_SERVICE_KEY=xxx
  OPENAI_API_KEY=sk-xxx
  NEXT_PUBLIC_NHL_TEAM_ID=25
  NEXT_PUBLIC_NHL_TEAM_NAME=Edmonton Oilers
  ```
- [ ] Create `lib/constants.ts` with API URLs, team metadata, placeholder image URL
- [ ] Create TypeScript interfaces (`types/nhl.ts`, `types/database.ts`)
- [ ] Initialize Supabase client (`lib/supabase.ts`)

**Deliverable:** Blank Next.js app, Supabase accessible, constants defined

**Time Estimate:** 3 days

---

### **Phase 2: NHL API Integration** (Days 4–5)

**Goal:** Fetch live data from NHL API, verify endpoints

**Tasks:**
- [ ] Implement `lib/nhl-api.ts`:
  - `fetchTeamRoster(teamId)` → Array of RosterPlayer
  - `fetchPlayerDetail(playerId)` → Player with headshot URL
  - `fetchTeamSchedule(teamId, season)` → Games array
  - `fetchStandings(season)` → Standings array
- [ ] Add error handling + retry logic (`utils/fetch-retry.ts`)
- [ ] Test each endpoint locally (console.log output)
- [ ] Verify data structure matches TypeScript types

**Deliverable:** Console logs showing live NHL API data (roster, games, standings)

**Time Estimate:** 2 days

---

### **Phase 3: Dashboard UI (Static Mockup)** (Days 6–10)

**Goal:** Build responsive layout with placeholder data

**Tasks:**
- [ ] Create `components/Dashboard.tsx` (main layout)
- [ ] Create `components/dashboard/Roster.tsx` (grid of players)
- [ ] Create `components/dashboard/RosterPlayer.tsx` (player card with portrait + stats)
- [ ] Create `components/dashboard/GameCard.tsx` (last game + next game)
- [ ] Create `components/dashboard/StandingsTable.tsx` (standings table)
- [ ] Create `components/ui/LoadingSpinner.tsx`
- [ ] Create `components/ui/ErrorMessage.tsx`
- [ ] Build `app/page.tsx` to render Dashboard
- [ ] Style with Tailwind (mobile-first responsive)
- [ ] Test with mock data (hardcoded JSON)

**Deliverable:** Static mockup of dashboard, all components styled, responsive

**Time Estimate:** 5 days

---

### **Phase 4: Image Generation Pipeline** (Days 11–14)

**Goal:** Generate 16-bit player portraits via DALL-E, store in Supabase

**Tasks:**
- [ ] Implement `lib/image-generation.ts`:
  - `generatePlayerPortrait(player, nhlHeadshotUrl)` → portrait URL
  - Call DALL-E API with prompt template
  - Handle failures gracefully (return placeholder URL)
- [ ] Implement `lib/roster-sync.ts`:
  - `detectNewPlayers(currentRoster, previousSnapshot)` → new player list
  - `detectRemovedPlayers(currentRoster, previousSnapshot)` → removed player list
- [ ] Create Supabase Storage upload function
- [ ] Test end-to-end: fetch roster → detect new players → generate portraits → upload
- [ ] Verify portraits display correctly in RosterPlayer component
- [ ] Track costs (estimate DALL-E budget for v1)

**Deliverable:** 5–10 player portraits generated and displaying in grid

**Time Estimate:** 4 days

---

### **Phase 5: Supabase Data Persistence** (Days 15–17)

**Goal:** Cache all data in Supabase, fetch from DB on dashboard load

**Tasks:**
- [ ] Implement `lib/cache.ts`:
  - `cacheRoster(teamId, roster)` → insert/update players
  - `cacheGames(teamId, games)` → insert/update games
  - `cacheStandings(teamId, standings)` → insert/update standings
- [ ] Implement `hooks/useDashboardData.ts`:
  - Fetch roster, games, standings from Supabase
  - Return loading/error/data states
  - Use Supabase real-time listener (optional, for instant updates)
- [ ] Implement `hooks/useRefreshStatus.ts`:
  - Get last refresh timestamp from refresh_log table
  - Display "Last updated: 3 AM EST" on dashboard
- [ ] Test data persistence: data survives page reload

**Deliverable:** Dashboard fetches live data from Supabase, persists across reloads

**Time Estimate:** 3 days

---

### **Phase 6: Team Preference & localStorage** (Days 18–19)

**Goal:** User can select team, preference persists

**Tasks:**
- [ ] Implement `hooks/useTeamPreference.ts`:
  - Get team from localStorage, fallback to default (Edmonton)
  - Set team preference in localStorage
- [ ] Create `components/ui/TeamSelector.tsx` (dropdown UI)
- [ ] Wire to Dashboard: change team → fetch different team's data
- [ ] Test: select team → reload page → preference persists

**Note:** v1 hardcodes Edmonton, but this infrastructure enables v2 multi-team support

**Deliverable:** (Minimal for v1, but ready for future expansion)

**Time Estimate:** 2 days

---

### **Phase 7: Daily Refresh Job** (Days 20–23)

**Goal:** Implement 3 AM EST refresh job, deploy to Vercel Cron

**Tasks:**
- [ ] Implement `lib/refresh-job.ts`:
  - Orchestrate: fetch NHL API → detect changes → generate portraits → update DB
  - Handle errors gracefully (log, don't crash)
- [ ] Create `app/api/refresh/route.ts`:
  - POST endpoint triggered by Vercel Cron
  - Call refresh-job logic
  - Return success/error JSON
- [ ] Create `app/api/health/route.ts`:
  - Simple GET endpoint to verify app is live
  - Check Supabase connection
- [ ] Configure `vercel.json` with Cron schedule
- [ ] Test refresh job locally:
  - Manually POST to `/api/refresh`
  - Verify Supabase tables updated
  - Check Supabase Storage for new portraits
- [ ] Deploy to Vercel + configure production Supabase
- [ ] Monitor first scheduled run (3 AM EST)

**Deliverable:** Refresh job runs daily at 3 AM EST, updates Supabase automatically

**Time Estimate:** 4 days

---

### **Phase 8: Error Handling & Resilience** (Days 24–25)

**Goal:** Graceful degradation, error logging, observability

**Tasks:**
- [ ] Implement `components/ui/ErrorBoundary.tsx`
  - Catch React rendering errors
  - Display fallback UI
- [ ] Implement `utils/error-logger.ts`:
  - Log errors to console (v1: console only, no external service)
  - Include context (component, function, timestamp)
- [ ] Add fallbacks:
  - NHL API down → show cached data + "Last updated 3 AM EST"
  - DALL-E fails → show placeholder image
  - Supabase unreachable → show error message + retry button
- [ ] Test error scenarios:
  - Mock NHL API 500 error
  - Mock DALL-E timeout
  - Mock Supabase connection loss

**Deliverable:** App handles failures gracefully, errors logged

**Time Estimate:** 2 days

---

### **Phase 9: Testing** (Days 26–28)

**Goal:** Unit tests, integration tests, manual E2E validation

**Tasks:**
- [ ] Unit tests:
  - `nhl-api.test.ts`: Mock NHL API responses, test parsing
  - `roster-sync.test.ts`: Test change detection logic
  - `image-generation.test.ts`: Mock DALL-E, test prompt generation
- [ ] Integration tests:
  - `refresh.test.ts`: End-to-end refresh job (mock NHL API + DALL-E)
- [ ] Component tests:
  - `RosterPlayer.test.tsx`: Render with mock props, verify portrait + stats
  - `Dashboard.test.tsx`: Render with mock data
- [ ] Manual E2E:
  - Load app, verify roster displays with portraits
  - Check game info matches NHL.com
  - Verify standings accuracy
  - Manually trigger `/api/refresh`, confirm data updates
  - Wait for scheduled 3 AM run, verify automatic refresh

**Deliverable:** >80% test coverage, all flows validated

**Time Estimate:** 3 days

---

### **Phase 10: Deployment & Launch** (Days 29–35)

**Goal:** Go live, monitor, create runbook

**Tasks:**
- [ ] Configure production Supabase:
  - Enable RLS (Row Level Security) for safety
  - Set up backups
  - Test data migrations from dev
- [ ] Deploy to Vercel:
  - Connect GitHub repo
  - Set production `.env` variables
  - Test Cron job on Vercel (not just localhost)
  - Verify `/api/health` endpoint works
- [ ] Create `docs/DEPLOYMENT.md`:
  - Vercel configuration steps
  - Supabase setup checklist
  - Environment variables reference
  - Troubleshooting guide
- [ ] Monitor first week:
  - Check Vercel logs for any Cron failures
  - Verify data freshness daily
  - Monitor DALL-E API costs
  - Check Supabase usage
- [ ] Create `docs/RUNBOOK.md`:
  - How to manually trigger refresh
  - How to debug data issues
  - How to scale to multi-team support

**Deliverable:** Live app at `yourapp.vercel.app`, monitoring in place

**Time Estimate:** 7 days

---

## Data Flow Diagrams

### Daily Refresh Flow (3 AM EST)

```
Vercel Cron (0 8 * * * UTC)
         ↓
    POST /api/refresh
         ↓
┌─────────────────────────────┐
│  Refresh Job Orchestration   │
├─────────────────────────────┤
│ 1. Fetch NHL API roster     │ → statsapi.nhl.com/api/v1/teams/25/roster
│ 2. Load last snapshot       │ → SELECT * FROM roster_snapshots (latest)
│ 3. Detect changes           │ → Compare current vs last
│ 4. For NEW players:         │
│    - Check if portrait      │   exists in DB
│    - If not, call DALL-E    │ → openai.com/v1/images/generations
│    - Upload to Storage      │ → Supabase Storage
│    - Update players table   │ → INSERT/UPDATE
│ 5. Mark removed as inactive │ → UPDATE players SET is_active=false
│ 6. Fetch & cache games      │ → statsapi.nhl.com/.../schedule
│ 7. Fetch & cache standings  │ → statsapi.nhl.com/.../standings
│ 8. Update games/standings   │ → INSERT/UPDATE tables
│ 9. Log completion           │ → INSERT refresh_log
└─────────────────────────────┘
         ↓
    Return JSON {success: true}
         ↓
[User loads app next day]
    ↓ [sees fresh cached data]
```

### User Dashboard Load Flow

```
User visits yourapp.vercel.app
         ↓
    app/page.tsx loads
         ↓
useDashboardData() hook fires:
  ├─ SELECT * FROM players WHERE team_id=1 AND is_active=true
  ├─ SELECT * FROM games WHERE team_id=1 (last + next game)
  ├─ SELECT * FROM standings WHERE team_id=1
  └─ SELECT * FROM refresh_log WHERE team_id=1 (latest)
         ↓
Supabase returns cached data
         ↓
Dashboard.tsx renders:
  ├─ Roster component (portrait grid)
  ├─ GameCard (last game + next game)
  ├─ StandingsTable
  └─ Footer: "Last updated: 3 AM EST today"
         ↓
User sees 16-bit player portraits + stats
```

### Portrait Generation Flow (per new player)

```
Refresh Job detects new player: Connor McDavid (nhl_id=97)
         ↓
Check: SELECT * FROM players WHERE nhl_id=97
         ↓
Not found → Generate portrait:
  1. Fetch NHL headshot: https://nhl.com/img/skaters/97.jpg
  2. Call DALL-E:
     Prompt: "Generate a 16-bit SNES-style pixel art portrait of
              Connor McDavid, NHL player wearing Edmonton Oilers jersey..."
     Model: dall-e-3
     Size: 1024x1024
  3. Receive: PNG image (1024x1024)
  4. Download bytes
  5. Upload to Supabase Storage: /player-portraits/EDM/97.png
  6. Get public URL: https://xxx.supabase.co/.../EDM/97.png
  7. INSERT INTO players (nhl_id, portrait_url, portrait_generated_at)
         ↓
✓ Portrait stored, next refresh cycle skips (portrait exists)
```

---

## Error Handling Strategy

### Common Failure Scenarios

| Scenario | Cause | Handling |
|----------|-------|----------|
| **NHL API timeout** | Network issue or NHL server down | Retry 3x with exponential backoff; if all fail, use cached data |
| **DALL-E API fails** | Rate limit, auth error, or OpenAI outage | Log error, set portrait_url to PLACEHOLDER, continue |
| **Supabase connection lost** | Network or Supabase down | UI shows "Data unavailable, please refresh" with retry button |
| **Refresh job crashes** | Unhandled exception in refresh-job.ts | Log to refresh_log, send to console, next day's run tries again |
| **Player portrait missing** | DALL-E failure on previous refresh | Show placeholder image, next refresh retries |
| **Corrupt Supabase data** | Bad INSERT/UPDATE | Validate all inserts, log schema mismatches, alert in console |

### Monitoring & Debugging

**Refresh Log Query** (check last 7 days):
```sql
SELECT * FROM refresh_log
WHERE team_id=1
ORDER BY refresh_date DESC
LIMIT 7;
```

**Failed Portrait Generations** (missing portraits):
```sql
SELECT id, first_name, last_name, position
FROM players
WHERE team_id=1
AND portrait_url = 'https://via.placeholder.com/256x256';
```

**Console Logs:**
- `[Refresh] Starting daily job...`
- `[Refresh] Fetched {X} players from NHL API`
- `[Refresh] Detected {Y} new players, {Z} removed`
- `[DALLE] Generating portrait for {playerName}...`
- `[DALLE] ❌ Failed: {error}` (sets placeholder)
- `[Refresh] Completed in {duration}ms`

---

## Testing Plan

### Unit Tests

**1. NHL API Client** (`tests/lib/nhl-api.test.ts`)
```typescript
describe('nhl-api', () => {
  test('fetchTeamRoster returns array of players', async () => {
    // Mock statsapi response
    // Call fetchTeamRoster(25)
    // Assert: array length > 0, each has nhl_id, position
  });

  test('fetchTeamSchedule returns games', async () => {
    // Mock schedule response
    // Call fetchTeamSchedule(25)
    // Assert: games array, each has gamePk, gameDate, teams
  });

  test('fetchStandings returns team record', async () => {
    // Mock standings response
    // Assert: team rank, points, gamesPlayed
  });

  test('handles API errors gracefully', async () => {
    // Mock 500 error
    // Assert: throws with meaningful message
  });
});
```

**2. Roster Change Detection** (`tests/lib/roster-sync.test.ts`)
```typescript
describe('roster-sync', () => {
  test('detectNewPlayers finds players in current not in previous', () => {
    const current = [
      { nhl_id: 97, name: 'McDavid' },
      { nhl_id: 98, name: 'Draisaitl' }
    ];
    const previous = [{ nhl_id: 97, name: 'McDavid' }];
    const newPlayers = detectNewPlayers(current, previous);
    expect(newPlayers).toEqual([{ nhl_id: 98, name: 'Draisaitl' }]);
  });

  test('detectRemovedPlayers works', () => {
    // Test inverse scenario
  });
});
```

**3. Image Generation** (`tests/lib/image-generation.test.ts`)
```typescript
describe('image-generation', () => {
  test('generatePlayerPortrait calls DALL-E with correct prompt', async () => {
    // Mock OpenAI API
    // Call generatePlayerPortrait({ nhl_id: 97, fullName: 'McDavid' })
    // Assert: DALL-E called with prompt containing player name + "16-bit SNES"
  });

  test('returns placeholder URL on DALL-E failure', async () => {
    // Mock DALL-E error
    // Assert: returns PLACEHOLDER_URL, doesn't throw
  });
});
```

### Integration Tests

**1. Refresh Job** (`tests/api/refresh.test.ts`)
```typescript
describe('POST /api/refresh', () => {
  test('end-to-end refresh completes successfully', async () => {
    // Mock NHL API + DALL-E
    // Call POST /api/refresh
    // Assert:
    //   - players table has rows
    //   - portraits uploaded to Storage
    //   - games table updated
    //   - standings table updated
    //   - refresh_log entry created with status='success'
  });

  test('handles partial failure (DALL-E fails for 1 player)', async () => {
    // Mock DALL-E failure for 1 player
    // Assert:
    //   - Other players generate OK
    //   - Failed player has placeholder portrait
    //   - refresh_log shows portraitsFailed=1
  });
});
```

### Component Tests

**1. RosterPlayer** (`tests/components/RosterPlayer.test.tsx`)
```typescript
describe('RosterPlayer', () => {
  test('renders player card with portrait', () => {
    const player = {
      nhl_id: 97,
      fullName: 'Connor McDavid',
      position: 'C',
      portraitUrl: 'https://...',
      stats: { games: 50, goals: 25, assists: 30, points: 55 }
    };
    render(<RosterPlayer player={player} />);
    expect(screen.getByText('McDavid')).toBeInTheDocument();
    expect(screen.getByAltText('Connor McDavid')).toHaveAttribute(
      'src',
      'https://...'
    );
    expect(screen.getByText('55 Pts')).toBeInTheDocument();
  });
});
```

**2. Dashboard** (`tests/components/Dashboard.test.tsx`)
```typescript
describe('Dashboard', () => {
  test('shows loading state initially', () => {
    // Mock useDashboardData to return loading=true
    render(<Dashboard />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  test('renders roster, game card, and standings', () => {
    // Mock useDashboardData with sample data
    render(<Dashboard />);
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Next Game')).toBeInTheDocument();
    expect(screen.getByText('Standings')).toBeInTheDocument();
  });
});
```

### Manual E2E Checklist

- [ ] Load app in browser (desktop + mobile)
- [ ] Roster displays with 16-bit portraits
- [ ] Player cards show correct stats (check against NHL.com)
- [ ] Game card shows last game result correctly
- [ ] Game card shows next game time correctly
- [ ] Standings table matches official NHL standings
- [ ] Manually trigger `/api/refresh` via browser console or curl
- [ ] Verify data refreshes within 2 seconds
- [ ] Wait for scheduled 3 AM refresh, verify automatic update
- [ ] Unplug internet, app shows cached data + error message
- [ ] Reconnect, app recovers

---

## Deployment Checklist

### Pre-Launch (Week 6)

- [ ] **Supabase Production**
  - [ ] Create production Supabase project
  - [ ] Copy schema from dev (all tables, Storage bucket)
  - [ ] Enable RLS on all tables (restrict to authenticated users in v2)
  - [ ] Set up automated backups
  - [ ] Test data migration from dev → prod
  - [ ] Verify Storage bucket is public

- [ ] **Vercel Deployment**
  - [ ] Connect GitHub repo to Vercel
  - [ ] Set production environment variables
  - [ ] Test build on Vercel (not just localhost)
  - [ ] Verify `/api/health` endpoint works on Vercel
  - [ ] Enable Cron in `vercel.json` and deploy

- [ ] **OpenAI Setup**
  - [ ] Create OpenAI API key with rate limits
  - [ ] Set spending limit ($10/month for initial testing)
  - [ ] Test DALL-E calls from Vercel environment

- [ ] **Monitoring & Observability**
  - [ ] Set up console logging for errors
  - [ ] Create monitoring query (check refresh_log daily)
  - [ ] Document troubleshooting steps

### Launch Day (Week 7)

- [ ] Deploy to Vercel (press "Deploy")
- [ ] Smoke test: load app, verify data displays
- [ ] Check Vercel logs for errors
- [ ] Monitor Cron job at scheduled time (3 AM EST)
- [ ] Verify Supabase tables updated after Cron runs
- [ ] Share app URL with stakeholders

### Post-Launch (Week 8+)

- [ ] Monitor daily for 1 week
  - [ ] Check refresh_log for failures
  - [ ] Verify portrait generation costs
  - [ ] Monitor Supabase usage (storage, queries)
  - [ ] Track app performance (Vercel analytics)

- [ ] Plan v2 features:
  - [ ] Multi-team support (schema already ready)
  - [ ] User authentication + preferences
  - [ ] Advanced player stats
  - [ ] Real-time score updates (optional)

---

## Summary

This implementation plan is **production-ready**. You have:

✅ Complete Supabase schema (multi-team ready)
✅ NHL API endpoints reference
✅ DALL-E integration strategy
✅ Vercel Cron configuration
✅ Phase-by-phase roadmap (10 phases, 35 days)
✅ Error handling strategy
✅ Testing plan
✅ Deployment checklist

**Next Step:** Proceed to Phase 1 (Foundation & Setup). You're ready to write code!

---

**Questions or clarifications?** Review the relevant section or ask in chat.
