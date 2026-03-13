/**
 * useDashboardData Hook
 * Fetches roster, games, and standings data from Supabase
 * Handles loading and error states
 */

"use client";

import { useEffect, useState } from "react";
import {
  RosterPlayer,
  ScheduleGame,
  StandingsRecord,
} from "@/types";
import { Player, Game, Standing } from "@/types/database";

/**
 * Transform NHL API RosterPlayer to database Player format
 */
function transformRosterPlayer(nhlPlayer: RosterPlayer): Player {
  const nameParts = nhlPlayer.person.fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    id: nhlPlayer.person.id,
    nhl_id: nhlPlayer.person.id,
    team_id: 25, // Edmonton Oilers
    first_name: firstName,
    last_name: lastName,
    position: nhlPlayer.position.code,
    number: nhlPlayer.jerseyNumber,
    jersey_number: nhlPlayer.jerseyNumber,
    nhl_headshot_url: `/api/portrait/${nhlPlayer.person.id}`,
    portrait_url: "", // Will be populated by image generation pipeline (Phase 4)
    portrait_generated_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform NHL API ScheduleGame to database Game format
 */
function transformGame(nhlGame: ScheduleGame): Game {
  const isHomeTeam =
    nhlGame.teams.home.team.name === "Edmonton Oilers";
  const homeTeamId = nhlGame.teams.home.team.id;
  const awayTeamId = nhlGame.teams.away.team.id;

  // Map API status codes to readable format
  let statusDisplay = nhlGame.status.abstractGameState;
  if (statusDisplay === "FINAL") {
    statusDisplay = "Final";
  } else if (statusDisplay === "FUT") {
    statusDisplay = "Scheduled";
  } else if (statusDisplay === "LIVE") {
    statusDisplay = "Live";
  } else if (statusDisplay === "OFF") {
    statusDisplay = "Off-Season";
  } else {
    // Fallback: use date-based status if API status is ambiguous
    const gameDate = new Date(nhlGame.gameDate);
    const now = new Date();
    gameDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    statusDisplay = gameDate < now ? "Final" : "Scheduled";
  }

  return {
    id: nhlGame.gamePk,
    nhl_id: nhlGame.gamePk,
    team_id: 25, // Edmonton Oilers
    opponent_team_id: isHomeTeam ? awayTeamId : homeTeamId,
    game_type: nhlGame.gameType || "Regular",
    game_date: nhlGame.gameDate,
    home_team_nhl_id: homeTeamId,
    away_team_nhl_id: awayTeamId,
    home_team_name: nhlGame.teams.home.team.name,
    away_team_name: nhlGame.teams.away.team.name,
    status: statusDisplay,
    home_score: nhlGame.teams.home.score,
    away_score: nhlGame.teams.away.score,
    is_team_home: isHomeTeam,
    cached_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform NHLE API standings to database Standing format
 */
function transformStanding(standing: any): Standing {
  return {
    id: 1,
    team_id: 25, // Edmonton Oilers
    season: 20252026,
    rank: standing.league_rank || null,
    division_rank: standing.division_rank || 0,
    conference: standing.conference || "",
    division: standing.division || "",
    games_played: standing.games_played || 0,
    wins: standing.wins || 0,
    losses: standing.losses || 0,
    overtime_losses: standing.overtime_losses || 0,
    points: standing.points || 0,
    goals_for: standing.goals_for || 0,
    goals_against: standing.goals_against || 0,
    goal_differential: standing.goal_differential || 0,
    cached_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export interface DashboardData {
  roster: Player[];
  lastGame: Game | null;
  nextGame: Game | null;
  standings: StandingsRecord[];
  oilersStanding: Standing | null;
}

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: DashboardState = {
  data: null,
  loading: true,
  error: null,
};

export function useDashboardData(): DashboardState {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        console.log("[Dashboard] Fetching data from /api/dashboard-data...");

        // Call the API route (server-side, no CORS issues)
        const response = await fetch("/api/dashboard-data", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const apiData = await response.json();

        if (!apiData.success) {
          throw new Error(apiData.error || "Failed to fetch data");
        }

        console.log("[Dashboard] API response received");

        // Extract raw data from API response
        const nhlRoster: RosterPlayer[] = apiData.data.roster;
        const lastNhlGame: ScheduleGame | null = apiData.data.lastGame;
        const nextNhlGame: ScheduleGame | null = apiData.data.nextGame;
        const standings: StandingsRecord[] = apiData.data.standings;
        const oilersRawStanding: any = apiData.data.oilersStanding;

        console.log(`[Dashboard] Got ${nhlRoster.length} players from roster`);

        // Transform roster
        let roster: Player[] = [];
        try {
          roster = nhlRoster.map(transformRosterPlayer);
          console.log(
            `[Dashboard] Transformed ${roster.length} players to database format`
          );
        } catch (e) {
          console.error("[Dashboard] Error transforming roster:", e);
          throw e;
        }

        // Transform games
        let lastGame: Game | null = null;
        try {
          lastGame = lastNhlGame ? transformGame(lastNhlGame) : null;
          console.log(
            `[Dashboard] ${lastGame ? "Found" : "No"} last game to display`
          );
        } catch (e) {
          console.error("[Dashboard] Error transforming last game:", e);
        }

        let nextGame: Game | null = null;
        try {
          nextGame = nextNhlGame ? transformGame(nextNhlGame) : null;
          console.log(
            `[Dashboard] ${nextGame ? "Found" : "No"} next game to display`
          );
        } catch (e) {
          console.error("[Dashboard] Error transforming next game:", e);
        }

        // Transform standings
        let oilersStanding: Standing | null = null;
        try {
          if (oilersRawStanding) {
            oilersStanding = transformStanding(oilersRawStanding);
            console.log(
              `[Dashboard] Found Oilers standings in ${oilersStanding.division} division`
            );
          }
        } catch (e) {
          console.error("[Dashboard] Error transforming standings:", e);
        }

        const data: DashboardData = {
          roster,
          lastGame,
          nextGame,
          standings,
          oilersStanding,
        };

        setState({
          data,
          loading: false,
          error: null,
        });

        console.log("[Dashboard] ✓ All data loaded successfully");
        console.log(
          `[Dashboard] Dashboard ready: ${roster.length} players, ${standings.length} divisions`
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[Dashboard] ❌ Error fetching data:", errorMsg);
        setState({
          data: null,
          loading: false,
          error: errorMsg,
        });
      }
    }

    fetchDashboardData();
  }, []);

  return state;
}
