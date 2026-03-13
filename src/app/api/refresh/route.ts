/**
 * Refresh endpoint
 * POST /api/refresh (also GET for manual testing)
 *
 * Triggered by Vercel Cron at 3 AM EST (0 8 * * * UTC)
 * Fetches latest roster, games, and standings from NHL API
 * Diffs roster against DB, inserts/deactivates players as needed
 * Upserts games and standings into Supabase cache
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  fetchTeamRoster,
  fetchTeamSchedule,
  fetchStandings,
} from "@/lib/nhl-api";
import { DB_TABLES, LOG_PREFIX } from "@/lib/constants";
import { Player } from "@/types/database";
import { RosterPlayer, ScheduleGame, StandingsRecord } from "@/types";

const TEAM_ID = 1; // Oilers row id in teams table
const SEASON = 20252026;

async function runRefresh() {
  const startedAt = Date.now();
  console.log(`${LOG_PREFIX.REFRESH} Starting daily refresh job...`);

  if (!supabaseAdmin) {
    throw new Error(
      "supabaseAdmin is not available — SUPABASE_SERVICE_KEY missing"
    );
  }

  // ─── 1. Fetch NHL roster ───────────────────────────────────────────────────
  console.log(`${LOG_PREFIX.REFRESH} Fetching NHL roster...`);
  const nhlRoster: RosterPlayer[] = await fetchTeamRoster();
  console.log(`${LOG_PREFIX.REFRESH} NHL roster: ${nhlRoster.length} players`);

  // ─── 2. Load active players from Supabase ─────────────────────────────────
  const { data: dbPlayers, error: dbPlayersError } = await supabaseAdmin
    .from(DB_TABLES.PLAYERS)
    .select("*")
    .eq("team_id", TEAM_ID)
    .eq("is_active", true);

  if (dbPlayersError) {
    throw new Error(
      `Failed to load DB players: ${dbPlayersError.message}`
    );
  }

  const activePlayers: Player[] = dbPlayers ?? [];
  console.log(
    `${LOG_PREFIX.REFRESH} DB active players: ${activePlayers.length}`
  );

  // ─── 3. Diff roster ────────────────────────────────────────────────────────
  const nhlIds = new Set(nhlRoster.map((p) => p.person.id));
  const dbNhlIds = new Set(activePlayers.map((p) => p.nhl_id));

  const newPlayers = nhlRoster.filter((p) => !dbNhlIds.has(p.person.id));
  const removedPlayers = activePlayers.filter((p) => !nhlIds.has(p.nhl_id));

  console.log(
    `${LOG_PREFIX.REFRESH} New players: ${newPlayers.length}, Removed: ${removedPlayers.length}`
  );

  // ─── 4. Insert new players ─────────────────────────────────────────────────
  let playersAdded = 0;
  if (newPlayers.length > 0) {
    const inserts = newPlayers.map((p) => {
      const nameParts = p.person.fullName.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ") ?? "";
      return {
        nhl_id: p.person.id,
        team_id: TEAM_ID,
        first_name: firstName,
        last_name: lastName,
        position: p.position.code,
        jersey_number: p.jerseyNumber ?? null,
        nhl_headshot_url: p.headshotUrl ?? null,
        portrait_url: null,
        is_active: true,
      };
    });

    const { error: insertError } = await supabaseAdmin
      .from(DB_TABLES.PLAYERS)
      .insert(inserts);

    if (insertError) {
      console.error(
        `${LOG_PREFIX.REFRESH} Failed to insert players:`,
        insertError.message
      );
    } else {
      playersAdded = newPlayers.length;
      console.log(
        `${LOG_PREFIX.REFRESH} Inserted ${playersAdded} new players`
      );
    }
  }

  // ─── 5. Deactivate removed players ────────────────────────────────────────
  let playersRemoved = 0;
  if (removedPlayers.length > 0) {
    const removedIds = removedPlayers.map((p) => p.nhl_id);
    const { error: deactivateError } = await supabaseAdmin
      .from(DB_TABLES.PLAYERS)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("nhl_id", removedIds)
      .eq("team_id", TEAM_ID);

    if (deactivateError) {
      console.error(
        `${LOG_PREFIX.REFRESH} Failed to deactivate players:`,
        deactivateError.message
      );
    } else {
      playersRemoved = removedPlayers.length;
      console.log(
        `${LOG_PREFIX.REFRESH} Deactivated ${playersRemoved} players`
      );
    }
  }

  // ─── 6. Update existing players if details changed ────────────────────────
  const existingNhlPlayers = nhlRoster.filter((p) =>
    dbNhlIds.has(p.person.id)
  );

  for (const nhlPlayer of existingNhlPlayers) {
    const dbPlayer = activePlayers.find(
      (p) => p.nhl_id === nhlPlayer.person.id
    );
    if (!dbPlayer) continue;

    const updates: Partial<Player> = {};

    if (
      nhlPlayer.jerseyNumber !== null &&
      nhlPlayer.jerseyNumber !== dbPlayer.jersey_number
    ) {
      updates.jersey_number = nhlPlayer.jerseyNumber;
    }

    if (nhlPlayer.position.code !== dbPlayer.position) {
      updates.position = nhlPlayer.position.code;
    }

    if (
      nhlPlayer.headshotUrl &&
      nhlPlayer.headshotUrl !== dbPlayer.nhl_headshot_url
    ) {
      updates.nhl_headshot_url = nhlPlayer.headshotUrl;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabaseAdmin
        .from(DB_TABLES.PLAYERS)
        .update(updates)
        .eq("nhl_id", nhlPlayer.person.id)
        .eq("team_id", TEAM_ID);
    }
  }

  console.log(`${LOG_PREFIX.REFRESH} Player updates complete`);

  // ─── 7. Save roster snapshot ───────────────────────────────────────────────
  const snapshotData = nhlRoster.map((p) => ({
    nhl_id: p.person.id,
    name: p.person.fullName,
    position: p.position.code,
  }));

  const { error: snapshotError } = await supabaseAdmin
    .from(DB_TABLES.ROSTER_SNAPSHOTS)
    .insert({
      team_id: TEAM_ID,
      roster_snapshot: snapshotData,
      player_count: nhlRoster.length,
      snapshot_date: new Date().toISOString().split("T")[0],
    });

  if (snapshotError) {
    console.warn(
      `${LOG_PREFIX.REFRESH} Failed to save roster snapshot:`,
      snapshotError.message
    );
  } else {
    console.log(`${LOG_PREFIX.REFRESH} Roster snapshot saved`);
  }

  // ─── 8. Fetch and upsert schedule ─────────────────────────────────────────
  console.log(`${LOG_PREFIX.REFRESH} Fetching schedule...`);
  const nhlGames: ScheduleGame[] = await fetchTeamSchedule();
  console.log(`${LOG_PREFIX.REFRESH} Fetched ${nhlGames.length} games`);

  const OILERS_TEAM_NAME = "Edmonton Oilers";

  const gameUpserts = nhlGames.map((g) => {
    const isHomeTeam = g.teams.home.team.name === OILERS_TEAM_NAME;

    // Normalize status values from NHLE API to DB-friendly strings
    let status = g.status.abstractGameState;
    if (status === "FINAL" || status === "OFF") {
      status = "Final";
    } else if (status === "FUT" || status === "PRE") {
      status = "Scheduled";
    } else if (status === "LIVE") {
      status = "In Progress";
    }

    return {
      nhl_id: g.gamePk,
      team_id: TEAM_ID,
      opponent_team_id: null,
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
      cached_at: new Date().toISOString(),
    };
  });

  if (gameUpserts.length > 0) {
    const { error: gamesError } = await supabaseAdmin
      .from(DB_TABLES.GAMES)
      .upsert(gameUpserts, { onConflict: "nhl_id" });

    if (gamesError) {
      console.error(
        `${LOG_PREFIX.REFRESH} Failed to upsert games:`,
        gamesError.message
      );
    } else {
      console.log(
        `${LOG_PREFIX.REFRESH} Upserted ${gameUpserts.length} games`
      );
    }
  }

  // ─── 9. Fetch and upsert standings ────────────────────────────────────────
  console.log(`${LOG_PREFIX.REFRESH} Fetching standings...`);
  const allStandings: StandingsRecord[] = await fetchStandings();

  let oilersRecord: StandingsRecord["teamRecords"][number] | null = null;
  let oilersDivision = "";
  let oilersConference = "";

  for (const division of allStandings) {
    const found = division.teamRecords.find(
      (t) => t.team.name === OILERS_TEAM_NAME
    );
    if (found) {
      oilersRecord = found;
      oilersDivision = division.division.name;
      oilersConference = division.conference.name;
      break;
    }
  }

  if (oilersRecord) {
    const standingUpsert = {
      team_id: TEAM_ID,
      season: SEASON,
      rank: parseInt(oilersRecord.leagueRank) || null,
      division_rank: parseInt(oilersRecord.divisionRank) || null,
      conference: oilersConference,
      division: oilersDivision,
      games_played: oilersRecord.gamesPlayed,
      wins: oilersRecord.leagueRecord.wins,
      losses: oilersRecord.leagueRecord.losses,
      overtime_losses: oilersRecord.leagueRecord.ot,
      points: oilersRecord.points,
      goals_for: oilersRecord.goalsFor,
      goals_against: oilersRecord.goalsAgainst,
      goal_differential: oilersRecord.goalDifferential,
      cached_at: new Date().toISOString(),
    };

    const { error: standingsError } = await supabaseAdmin
      .from(DB_TABLES.STANDINGS)
      .upsert(standingUpsert, { onConflict: "team_id,season" });

    if (standingsError) {
      console.error(
        `${LOG_PREFIX.REFRESH} Failed to upsert standings:`,
        standingsError.message
      );
    } else {
      console.log(
        `${LOG_PREFIX.REFRESH} Standings upserted: ${oilersRecord.leagueRecord.wins}W-${oilersRecord.leagueRecord.losses}L-${oilersRecord.leagueRecord.ot}OT`
      );
    }
  } else {
    console.warn(
      `${LOG_PREFIX.REFRESH} Oilers not found in standings response`
    );
  }

  // ─── 10. Log result ────────────────────────────────────────────────────────
  const durationMs = Date.now() - startedAt;

  const { error: logError } = await supabaseAdmin
    .from(DB_TABLES.REFRESH_LOG)
    .insert({
      team_id: TEAM_ID,
      refresh_date: new Date().toISOString().split("T")[0],
      status: "success",
      players_added: playersAdded,
      players_removed: playersRemoved,
      portraits_generated: 0,
      portraits_failed: 0,
      error_message: null,
      duration_ms: durationMs,
    });

  if (logError) {
    console.warn(
      `${LOG_PREFIX.REFRESH} Failed to write refresh log:`,
      logError.message
    );
  }

  console.log(
    `${LOG_PREFIX.REFRESH} ✓ Refresh complete in ${durationMs}ms`
  );

  return {
    durationMs,
    playersAdded,
    playersRemoved,
    gamesUpserted: gameUpserts.length,
    standingsFound: !!oilersRecord,
    rosterSize: nhlRoster.length,
  };
}

export async function POST(_request: NextRequest) {
  try {
    const summary = await runRefresh();
    return NextResponse.json({
      success: true,
      message: "Refresh job complete",
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX.REFRESH} ❌ Refresh job failed:`, errorMsg);

    // Attempt to log the failure (best-effort — ignore secondary errors)
    if (supabaseAdmin) {
      await supabaseAdmin.from(DB_TABLES.REFRESH_LOG).insert({
        team_id: TEAM_ID,
        refresh_date: new Date().toISOString().split("T")[0],
        status: "failed",
        players_added: 0,
        players_removed: 0,
        portraits_generated: 0,
        portraits_failed: 0,
        error_message: errorMsg,
        duration_ms: null,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow manual triggering for testing
  return POST(request);
}
