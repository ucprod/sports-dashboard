/**
 * Dashboard Data API Route
 * Server-side endpoint that fetches NHL data and returns it to the browser
 * Bypasses CORS issues by running on the server
 */

import {
  fetchTeamRoster,
  fetchTeamSchedule,
  fetchStandings,
} from "@/lib/nhl-api";

export const revalidate = 3600; // Revalidate every hour

export async function GET(_request: Request) {
  try {
    console.log("[API] Dashboard data request received");

    // Fetch all data in parallel
    // Using /now endpoint to get current/upcoming games
    const [roster, schedule, standings] = await Promise.all([
      fetchTeamRoster(),
      fetchTeamSchedule(), // Uses /now endpoint automatically
      fetchStandings(),
    ]);

    console.log(`[API] Successfully fetched all data`);
    console.log(`[API] Roster: ${roster.length} players`);
    console.log(`[API] Schedule: ${schedule.length} games`);
    console.log(`[API] Standings: ${standings.length} divisions`);

    // NHLE API status codes: "FINAL"/"OFF" = completed, "FUT"/"PRE"/"LIVE" = upcoming
    const COMPLETED_STATES = ["FINAL", "OFF"];
    const UPCOMING_STATES = ["FUT", "PRE", "LIVE"];

    const lastGame = schedule
      .filter((g) => COMPLETED_STATES.includes(g.status.abstractGameState))
      .sort(
        (a, b) =>
          new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
      )[0] || null;

    console.log(`[API] Found ${schedule.filter((g) => COMPLETED_STATES.includes(g.status.abstractGameState)).length} completed games`);
    if (lastGame) {
      console.log(`[API] Last game: ${lastGame.teams.away.team.name} @ ${lastGame.teams.home.team.name} on ${lastGame.gameDate}`);
    }

    const nextGame = schedule
      .filter((g) => UPCOMING_STATES.includes(g.status.abstractGameState))
      .sort(
        (a, b) =>
          new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
      )[0] || null;

    console.log(`[API] Found ${schedule.filter((g) => UPCOMING_STATES.includes(g.status.abstractGameState)).length} upcoming games`);
    if (nextGame) {
      console.log(`[API] Next game: ${nextGame.teams.away.team.name} @ ${nextGame.teams.home.team.name} on ${nextGame.gameDate}`);
    }

    // Find Oilers in standings
    let oilersStanding = null;
    for (const division of standings) {
      const oilers = division.teamRecords.find(
        (t) => t.team.name === "Edmonton Oilers"
      );
      if (oilers) {
        oilersStanding = {
          division: division.division.name,
          conference: division.conference.name,
          games_played: oilers.gamesPlayed || 0,
          wins: oilers.leagueRecord.wins || 0,
          losses: oilers.leagueRecord.losses || 0,
          overtime_losses: oilers.leagueRecord.ot || 0,
          points: oilers.points || 0,
          division_rank: oilers.divisionRank || 0,
          conference_rank: oilers.conferenceRank || 0,
          league_rank: oilers.leagueRank || 0,
          goals_for: oilers.goalsFor || 0,
          goals_against: oilers.goalsAgainst || 0,
          goal_differential: oilers.goalDifferential || 0,
        };
        break;
      }
    }

    console.log(`[API] Found Oilers standings: ${oilersStanding?.division}`);

    return Response.json({
      success: true,
      data: {
        roster,
        lastGame,
        nextGame,
        standings,
        oilersStanding,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error fetching dashboard data:", errorMsg);

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
