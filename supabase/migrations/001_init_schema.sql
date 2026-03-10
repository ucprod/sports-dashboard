-- NHL Sports Dashboard - Initial Schema
-- Run this SQL in Supabase SQL Editor to set up the database

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(3) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Edmonton Oilers (v1)
INSERT INTO teams (nhl_id, name, abbreviation, primary_color, secondary_color)
VALUES (25, 'Edmonton Oilers', 'EDM', '#FF4500', '#003399')
ON CONFLICT (nhl_id) DO NOTHING;

-- 2. Players Table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  position VARCHAR(10) NOT NULL,
  number INT,
  jersey_number INT,
  nhl_headshot_url TEXT,
  portrait_url TEXT,
  portrait_generated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(nhl_id, team_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_nhl_id ON players(nhl_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);

-- 3. Roster Snapshots Table (for change detection)
CREATE TABLE IF NOT EXISTS roster_snapshots (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  roster_snapshot JSONB NOT NULL,
  player_count INT,
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, snapshot_date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_roster_snapshots_team_date ON roster_snapshots(team_id, snapshot_date DESC);

-- 4. Games Table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  nhl_id INT UNIQUE NOT NULL,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_team_id INT REFERENCES teams(id) ON DELETE SET NULL,
  game_type VARCHAR(20),
  game_date TIMESTAMP NOT NULL,
  home_team_nhl_id INT,
  away_team_nhl_id INT,
  home_team_name VARCHAR(255),
  away_team_name VARCHAR(255),
  status VARCHAR(50),
  home_score INT,
  away_score INT,
  is_team_home BOOLEAN,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_games_team_date ON games(team_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_games_nhl_id ON games(nhl_id);

-- 5. Standings Table
CREATE TABLE IF NOT EXISTS standings (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season INT NOT NULL,
  rank INT,
  division_rank INT,
  conference VARCHAR(50),
  division VARCHAR(50),
  games_played INT,
  wins INT,
  losses INT,
  overtime_losses INT,
  points INT,
  goals_for INT,
  goals_against INT,
  goal_differential INT,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, season)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_standings_team_season ON standings(team_id, season);

-- 6. Refresh Log Table (for monitoring)
CREATE TABLE IF NOT EXISTS refresh_log (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  refresh_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  players_added INT,
  players_removed INT,
  portraits_generated INT,
  portraits_failed INT,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_refresh_log_team_date ON refresh_log(team_id, refresh_date DESC);

-- Grant appropriate permissions (adjust if using RLS in future)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- Create helpful views (optional)
CREATE OR REPLACE VIEW latest_refresh AS
SELECT DISTINCT ON (team_id)
  team_id,
  refresh_date,
  status,
  players_added,
  players_removed,
  portraits_generated,
  portraits_failed,
  error_message,
  duration_ms
FROM refresh_log
ORDER BY team_id, refresh_date DESC;

CREATE OR REPLACE VIEW active_roster AS
SELECT
  p.id,
  p.nhl_id,
  p.team_id,
  p.first_name,
  p.last_name,
  p.position,
  p.jersey_number,
  p.portrait_url,
  p.is_active
FROM players p
WHERE p.is_active = true
ORDER BY p.position, p.last_name;
