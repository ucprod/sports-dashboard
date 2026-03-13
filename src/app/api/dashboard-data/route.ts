/**
 * Dashboard Data API Route
 * Reads cached roster, games, and standings from Supabase.
 * Falls back to live NHL API calls on first run (before any refresh has run).
 */

import {
  fetchTeamRoster,
  fetchTeamSchedule,
  fetchStandings,
} from "@/lib/nhl-api";
import { supabaseClient } from "@/lib/supabase";
import { DB_TABLES } from "@/lib/constants";
import { Player, Game, Standing } from "@/types/database";
import { RosterPlayer, ScheduleGame, StandingsRecord } from "@/types";

// Do not use Next.js static revalidation — data is refreshed by the cron job
export const dynamic = "force-dynamic";

const TEAM_ID = 1;
const OILERS_TEAM_NAME = "Edmonton Oilers";

// ─── Fallback: transform NHL API data to DB shapes ────────────────────────────

function transformRosterPlayer(p: RosterPlayer): Player {
  const nameParts = p.person.fullName.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";
  const now = new Date().toISOString();
  return {
    id: p.person.id,
    nhl_id: p.person.id,
    team_id: TEAM_ID,
    first_name: firstName,
    last_name: lastName,
    position: p.position.code,
    number: p.jerseyNumber,
    jersey_number: p.jerseyNumber,
    nhl_headshot_url: p.headshotUrl ?? null,
    portrait_url: null,
    portrait_generated_at: null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

function transformGame(g: ScheduleGame): Game {
  const isHomeTeam = g.teams.home.team.name === OILERS_TEAM_NAME;

  let status = g.status.abstractGameState;
  if (status === "FINAL" || status === "OFF") {
    status = "Final";
  } else if (status === "FUT" || status === "PRE") {
    status = "Scheduled";
  } else if (status === "LIVE") {
    status = "In Progress";
  } else {
    // Date-based fallback
    const gameDate = new Date(g.gameDate);
    const now = new Date();
    gameDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    status = gameDate < now ? "Final" : "Scheduled";
  }

  const now = new Date().toISOString();
  return {
    id: g.gamePk,
    nhl_id: g.gamePk,
    team_id: TEAM_ID,
    opponent_team_id: isHomeTeam ? g.teams.away.team.id : g.teams.home.team.id,
    game_type: g.gameType || "R",
    game_date: g.gameDate,
    home_team_nhl_id: g.teams.home.team.id,
    away_team_nhl_id: g.teams.away.team.id,
    home_team_name: g.teams.home.team.name,
    away_team_name: g.teams.away.team.name,
    status,
    home_score: g.teams.home.score ?? null,
    away_score: g.teams.away.score ?? null,
    is_team_home: isHomeTeam,
    cached_at: now,
    created_at: now,
    updated_at: now,
  };
}

function transformStandings(
  allStandings: StandingsRecord[]
): Standing | null {
  for (const division of allStandings) {
    const oilers = division.teamRecords.find(
      (t) => t.team.name === OILERS_TEAM_NAME
    );
    if (oilers) {
      const now = new Date().toISOString();
      return {
        id: 1,
        team_id: TEAM_ID,
        season: 20252026,
        rank: parseInt(oilers.leagueRank) || null,
        division_rank: parseInt(oilers.divisionRank) || null,
        conference: division.conference.name,
        division: division.division.name,
        games_played: oilers.gamesPlayed,
        wins: oilers.leagueRecord.wins,
        losses: oilers.leagueRecord.losses,
        overtime_losses: oilers.leagueRecord.ot,
        points: oilers.points,
        goals_for: oilers.goalsFor,
        goals_against: oilers.goalsAgainst,
        goal_differential: oilers.goalDifferential,
        cached_at: now,
        created_at: now,
        updated_at: now,
      };
    }
  }
  return null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(_request: Request) {
  try {
    console.log("[API] Dashboard data request received");

    // Query all four tables in parallel
    const [playersResult, lastGameResult, nextGameResult, standingResult] =
      await Promise.all([
        supabaseClient
          .from(DB_TABLES.PLAYERS)
          .select("*")
          .eq("team_id", TEAM_ID)
          .eq("is_active", true)
          .order("position", { ascending: true })
          .order("last_name", { ascending: true }),

        supabaseClient
          .from(DB_TABLES.GAMES)
          .select("*")
          .eq("team_id", TEAM_ID)
          .eq("status", "Final")
          .order("game_date", { ascending: false })
          .limit(1),

        supabaseClient
          .from(DB_TABLES.GAMES)
          .select("*")
          .eq("team_id", TEAM_ID)
          .eq("status", "Scheduled")
          .order("game_date", { ascending: true })
          .limit(1),

        supabaseClient
          .from(DB_TABLES.STANDINGS)
          .select("*")
          .eq("team_id", TEAM_ID)
          .order("season", { ascending: false })
          .limit(1),
      ]);

    const dbRoster: Player[] | null = playersResult.data;
    const dbLastGame: Game | null = lastGameResult.data?.[0] ?? null;
    const dbNextGame: Game | null = nextGameResult.data?.[0] ?? null;
    const dbStanding: Standing | null = standingResult.data?.[0] ?? null;

    // Detect if the DB is empty (first run before any refresh)
    const dbIsEmpty =
      !dbRoster || dbRoster.length === 0;

    if (dbIsEmpty) {
      console.log(
        "[API] DB appears empty — falling back to live NHL API calls"
      );

      const [nhlRoster, schedule, allStandings] = await Promise.all([
        fetchTeamRoster(),
        fetchTeamSchedule(),
        fetchStandings(),
      ]);

      const COMPLETED_STATES = ["FINAL", "OFF", "Final"];
      const UPCOMING_STATES = ["FUT", "PRE", "LIVE", "Scheduled", "In Progress"];

      const fallbackLastGame: Game | null =
        schedule
          .filter((g: ScheduleGame) =>
            COMPLETED_STATES.includes(g.status.abstractGameState)
          )
          .sort(
            (a: ScheduleGame, b: ScheduleGame) =>
              new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
          )
          .map(transformGame)[0] ?? null;

      const fallbackNextGame: Game | null =
        schedule
          .filter((g: ScheduleGame) =>
            UPCOMING_STATES.includes(g.status.abstractGameState)
          )
          .sort(
            (a: ScheduleGame, b: ScheduleGame) =>
              new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
          )
          .map(transformGame)[0] ?? null;

      console.log(
        `[API] Fallback — ${nhlRoster.length} players, standing: ${!!transformStandings(allStandings)}`
      );

      return Response.json({
        success: true,
        source: "nhl-api-fallback",
        data: {
          roster: nhlRoster.map(transformRosterPlayer),
          lastGame: fallbackLastGame,
          nextGame: fallbackNextGame,
          oilersStanding: transformStandings(allStandings),
        },
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `[API] Supabase — ${dbRoster.length} players, lastGame: ${!!dbLastGame}, nextGame: ${!!dbNextGame}, standing: ${!!dbStanding}`
    );

    return Response.json({
      success: true,
      source: "supabase-cache",
      data: {
        roster: dbRoster,
        lastGame: dbLastGame,
        nextGame: dbNextGame,
        oilersStanding: dbStanding,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error fetching dashboard data:", errorMsg);

    // Last-resort: try NHL API directly
    try {
      console.log("[API] Error recovery — attempting NHL API fallback...");
      const [nhlRoster, schedule, allStandings] = await Promise.all([
        fetchTeamRoster(),
        fetchTeamSchedule(),
        fetchStandings(),
      ]);

      const COMPLETED_STATES = ["FINAL", "OFF", "Final"];
      const UPCOMING_STATES = ["FUT", "PRE", "LIVE", "Scheduled"];

      const fallbackLastGame: Game | null =
        schedule
          .filter((g: ScheduleGame) =>
            COMPLETED_STATES.includes(g.status.abstractGameState)
          )
          .sort(
            (a: ScheduleGame, b: ScheduleGame) =>
              new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
          )
          .map(transformGame)[0] ?? null;

      const fallbackNextGame: Game | null =
        schedule
          .filter((g: ScheduleGame) =>
            UPCOMING_STATES.includes(g.status.abstractGameState)
          )
          .sort(
            (a: ScheduleGame, b: ScheduleGame) =>
              new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
          )
          .map(transformGame)[0] ?? null;

      return Response.json({
        success: true,
        source: "nhl-api-error-fallback",
        data: {
          roster: nhlRoster.map(transformRosterPlayer),
          lastGame: fallbackLastGame,
          nextGame: fallbackNextGame,
          oilersStanding: transformStandings(allStandings),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (fallbackError) {
      const fallbackMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Unknown error";
      console.error("[API] Fallback also failed:", fallbackMsg);
    }

    return Response.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
