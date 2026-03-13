-- NHL Sports Dashboard Schema
-- Run this in the Supabase SQL Editor to set up all tables

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id          SERIAL PRIMARY KEY,
  nhl_id      INTEGER NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  logo_url    TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Insert Edmonton Oilers
INSERT INTO teams (nhl_id, name, abbreviation, primary_color, secondary_color)
VALUES (25, 'Edmonton Oilers', 'EDM', '#FF4500', '#003399')
ON CONFLICT (nhl_id) DO NOTHING;

-- Players
CREATE TABLE IF NOT EXISTS players (
  id                    SERIAL PRIMARY KEY,
  nhl_id                INTEGER NOT NULL UNIQUE,
  team_id               INTEGER REFERENCES teams(id),
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  position              TEXT NOT NULL,
  jersey_number         INTEGER,
  nhl_headshot_url      TEXT,
  portrait_url          TEXT,
  portrait_generated_at TIMESTAMPTZ,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_team_id_idx ON players(team_id);
CREATE INDEX IF NOT EXISTS players_nhl_id_idx ON players(nhl_id);

-- Roster Snapshots (for change detection)
CREATE TABLE IF NOT EXISTS roster_snapshots (
  id               SERIAL PRIMARY KEY,
  team_id          INTEGER REFERENCES teams(id),
  roster_snapshot  JSONB NOT NULL,
  player_count     INTEGER NOT NULL,
  snapshot_date    DATE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roster_snapshots_team_date_idx ON roster_snapshots(team_id, snapshot_date DESC);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id                SERIAL PRIMARY KEY,
  nhl_id            BIGINT NOT NULL UNIQUE,
  team_id           INTEGER REFERENCES teams(id),
  opponent_team_id  INTEGER,
  game_type         TEXT,
  game_date         DATE NOT NULL,
  home_team_nhl_id  INTEGER,
  away_team_nhl_id  INTEGER,
  home_team_name    TEXT,
  away_team_name    TEXT,
  status            TEXT NOT NULL,
  home_score        INTEGER,
  away_score        INTEGER,
  is_team_home      BOOLEAN,
  cached_at         TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS games_team_date_idx ON games(team_id, game_date DESC);

-- Standings
CREATE TABLE IF NOT EXISTS standings (
  id                SERIAL PRIMARY KEY,
  team_id           INTEGER REFERENCES teams(id),
  season            INTEGER NOT NULL,
  division_rank     INTEGER,
  conference        TEXT,
  division          TEXT,
  games_played      INTEGER DEFAULT 0,
  wins              INTEGER DEFAULT 0,
  losses            INTEGER DEFAULT 0,
  overtime_losses   INTEGER DEFAULT 0,
  points            INTEGER DEFAULT 0,
  goals_for         INTEGER DEFAULT 0,
  goals_against     INTEGER DEFAULT 0,
  goal_differential INTEGER DEFAULT 0,
  cached_at         TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, season)
);

-- Refresh Log
CREATE TABLE IF NOT EXISTS refresh_log (
  id                   SERIAL PRIMARY KEY,
  team_id              INTEGER REFERENCES teams(id),
  refresh_date         DATE NOT NULL,
  status               TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  players_added        INTEGER DEFAULT 0,
  players_removed      INTEGER DEFAULT 0,
  portraits_generated  INTEGER DEFAULT 0,
  portraits_failed     INTEGER DEFAULT 0,
  error_message        TEXT,
  duration_ms          INTEGER,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (read-only public access)
ALTER TABLE teams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE games     ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_log      ENABLE ROW LEVEL SECURITY;

-- Public read policies (dashboard reads without auth)
CREATE POLICY "Public read teams"     ON teams     FOR SELECT USING (true);
CREATE POLICY "Public read players"   ON players   FOR SELECT USING (true);
CREATE POLICY "Public read games"     ON games     FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);
