/**
 * Types for Supabase database schema
 */

export interface Team {
  id: number;
  nhl_id: number;
  name: string;
  abbreviation: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: number;
  nhl_id: number;
  team_id: number;
  first_name: string;
  last_name: string;
  position: string; // "C", "LW", "RW", "D", "G"
  number: number | null;
  jersey_number: number | null;
  nhl_headshot_url: string | null;
  portrait_url: string | null;
  portrait_generated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RosterSnapshot {
  id: number;
  team_id: number;
  roster_snapshot: Array<{
    nhl_id: number;
    name: string;
    position: string;
  }>;
  player_count: number;
  snapshot_date: string;
}

export interface Game {
  id: number;
  nhl_id: number;
  team_id: number;
  opponent_team_id: number | null;
  game_type: string;
  game_date: string;
  home_team_nhl_id: number;
  away_team_nhl_id: number;
  home_team_name: string;
  away_team_name: string;
  status: string; // "Final", "Scheduled", "In Progress"
  home_score: number | null;
  away_score: number | null;
  is_team_home: boolean;
  cached_at: string;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: number;
  team_id: number;
  season: number;
  rank: number | null;
  division_rank: number | null;
  conference: string;
  division: string;
  games_played: number;
  wins: number;
  losses: number;
  overtime_losses: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_differential: number;
  cached_at: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshLog {
  id: number;
  team_id: number;
  refresh_date: string;
  status: "success" | "partial" | "failed";
  players_added: number | null;
  players_removed: number | null;
  portraits_generated: number | null;
  portraits_failed: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

// For API responses
export interface DashboardData {
  players: Player[];
  lastGame: Game | null;
  nextGame: Game | null;
  standings: Standing | null;
  lastRefresh: RefreshLog | null;
  loading: boolean;
  error: string | null;
}
