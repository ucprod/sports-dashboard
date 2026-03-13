/**
 * Test API endpoint for NHL API client
 * Visit: http://localhost:3000/api/test-nhl
 *
 * Tests all 4 NHL API endpoints and logs results to:
 * - Console (server logs in terminal)
 * - Response body (what you see in browser)
 * - Browser DevTools console (client logs)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  fetchTeamRoster,
  fetchTeamSchedule,
  fetchStandings,
} from "@/lib/nhl-api";
import { LOG_PREFIX } from "@/lib/constants";

export async function GET(_request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(`${LOG_PREFIX.NHL_API} STARTING PHASE 2 ENDPOINT TESTS`);
  console.log(`${"=".repeat(60)}\n`);

  // Test 1: Fetch Team Roster
  try {
    console.log(`\n${LOG_PREFIX.NHL_API} TEST 1: Fetching Team Roster...`);
    let roster;
    try {
      roster = await fetchTeamRoster(25); // Edmonton Oilers
    } catch (e) {
      // Try to fetch raw response to see structure
      console.log(`${LOG_PREFIX.NHL_API} Fetching raw roster response for debugging...`);
      const rawResponse = await fetch("https://api-web.nhle.com/v1/roster/EDM/current");
      const rawData = await rawResponse.json();
      console.log(`${LOG_PREFIX.NHL_API} Raw roster response keys:`, Object.keys(rawData));
      console.log(`${LOG_PREFIX.NHL_API} Raw response preview:`, JSON.stringify(rawData).substring(0, 1000));
      throw e;
    }

    results.tests.push({
      name: "fetchTeamRoster",
      status: "success",
      count: roster.length,
      sample: roster.slice(0, 2).map((p) => ({
        name: p.person.fullName,
        position: p.position.code,
        number: p.jerseyNumber,
      })),
    });

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ TEST 1 PASSED: ${roster.length} players`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.tests.push({
      name: "fetchTeamRoster",
      status: "error",
      error: errorMsg,
    });
    console.error(`${LOG_PREFIX.NHL_API} ✗ TEST 1 FAILED: ${errorMsg}`);
  }

  // Test 2: Fetch Team Schedule
  try {
    console.log(`\n${LOG_PREFIX.NHL_API} TEST 2: Fetching Team Schedule...`);
    const schedule = await fetchTeamSchedule(25); // Edmonton Oilers

    // Get last completed game and next upcoming game
    const lastGame = schedule
      .filter((g) => g.status.abstractGameState === "Final")
      .sort(
        (a, b) =>
          new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
      )[0];

    const nextGame = schedule
      .filter((g) => g.status.abstractGameState === "Scheduled")
      .sort(
        (a, b) =>
          new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
      )[0];

    results.tests.push({
      name: "fetchTeamSchedule",
      status: "success",
      totalGames: schedule.length,
      lastGame: lastGame
        ? {
            date: lastGame.gameDate,
            opponent: lastGame.teams.home.team.id === 25
              ? lastGame.teams.away.team.name
              : lastGame.teams.home.team.name,
            score: `${lastGame.teams.home.score}-${lastGame.teams.away.score}`,
          }
        : null,
      nextGame: nextGame
        ? {
            date: nextGame.gameDate,
            opponent: nextGame.teams.home.team.id === 25
              ? nextGame.teams.away.team.name
              : nextGame.teams.home.team.name,
          }
        : null,
    });

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ TEST 2 PASSED: ${schedule.length} games`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.tests.push({
      name: "fetchTeamSchedule",
      status: "error",
      error: errorMsg,
    });
    console.error(`${LOG_PREFIX.NHL_API} ✗ TEST 2 FAILED: ${errorMsg}`);
  }

  // Test 3: Fetch Standings
  try {
    console.log(`\n${LOG_PREFIX.NHL_API} TEST 3: Fetching Standings...`);
    let standings;
    try {
      standings = await fetchStandings();
    } catch (e) {
      // Try to fetch raw response to see structure
      console.log(`${LOG_PREFIX.NHL_API} Fetching raw standings response for debugging...`);
      const rawResponse = await fetch("https://api-web.nhle.com/v1/standings/now");
      const rawData = await rawResponse.json();
      console.log(`${LOG_PREFIX.NHL_API} Raw standings response type:`, typeof rawData);
      console.log(`${LOG_PREFIX.NHL_API} Is array?`, Array.isArray(rawData));
      console.log(`${LOG_PREFIX.NHL_API} Raw response keys:`, Object.keys(rawData));
      console.log(`${LOG_PREFIX.NHL_API} Raw response preview:`, JSON.stringify(rawData).substring(0, 1000));
      throw e;
    }

    // Find Edmonton Oilers in standings
    let oilersStanding = null;
    for (const division of standings) {
      const oilers = division.teamRecords.find((t) => t.team.name === "Edmonton Oilers");
      if (oilers) {
        oilersStanding = {
          division: division.division.name,
          rank: oilers.leagueRecord.wins + oilers.leagueRecord.losses + oilers.leagueRecord.ot,
          points: oilers.points,
          wins: oilers.leagueRecord.wins,
          losses: oilers.leagueRecord.losses,
          ot: oilers.leagueRecord.ot,
        };
        break;
      }
    }

    results.tests.push({
      name: "fetchStandings",
      status: "success",
      totalDivisions: standings.length,
      oilersStanding,
    });

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ TEST 3 PASSED: ${standings.length} divisions`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.tests.push({
      name: "fetchStandings",
      status: "error",
      error: errorMsg,
    });
    console.error(`${LOG_PREFIX.NHL_API} ✗ TEST 3 FAILED: ${errorMsg}`);
  }

  // Summary
  const passedCount = results.tests.filter((t: any) => t.status === "success").length;
  const totalCount = results.tests.length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `${LOG_PREFIX.NHL_API} PHASE 2 TEST RESULTS: ${passedCount}/${totalCount} passed`
  );
  console.log(`${"=".repeat(60)}\n`);

  results.summary = {
    passed: passedCount,
    total: totalCount,
    allPassed: passedCount === totalCount,
  };

  return NextResponse.json(results);
}
