/**
 * NHL API Client (NHLE API - api-web.nhle.com)
 *
 * Correct endpoints based on official NHLE API documentation
 * Uses team abbreviation (EDM, TOR, etc) instead of team ID
 */

import { RosterPlayer, ScheduleGame, StandingsRecord, PlayerDetail } from "@/types";
import { NHL_CONFIG, LOG_PREFIX } from "@/lib/constants";
import { retryFetch } from "@/lib/fetch-retry";

const BASE_URL = NHL_CONFIG.BASE_URL;
const TEAM_ABBREV = NHL_CONFIG.TEAM_ABBREVIATION;
const CURRENT_SEASON = "20252026"; // Current season for 2025-26

/**
 * Fetch team roster from NHLE API
 * Endpoint: /v1/roster/{team}/current
 */
export async function fetchTeamRoster(teamId?: number): Promise<RosterPlayer[]> {
  const url = `${BASE_URL}/roster/${TEAM_ABBREV}/current`;

  console.log(`${LOG_PREFIX.NHL_API} Fetching roster for ${TEAM_ABBREV}...`);
  console.log(`${LOG_PREFIX.NHL_API} URL: ${url}`);

  try {
    const response = await retryFetch(url);

    if (!response.ok) {
      throw new Error(
        `${LOG_PREFIX.NHL_API} HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // NHLE API returns { forwards: [], defensemen: [], goalies: [] }
    if (!data.forwards || !data.defensemen || !data.goalies) {
      console.error(`${LOG_PREFIX.NHL_API} Response keys:`, Object.keys(data));
      throw new Error(`${LOG_PREFIX.NHL_API} Invalid roster data structure`);
    }

    // Combine all player types into one roster
    const allPlayers = [
      ...data.forwards,
      ...data.defensemen,
      ...data.goalies,
    ];

    const roster: RosterPlayer[] = allPlayers.map((player: any) => {
      // Parse name - the API provides firstName/lastName with language variations
      const firstName = player.firstName?.default || player.firstName || "";
      const lastName = player.lastName?.default || player.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || player.name?.default || "Unknown";

      return {
        person: {
          id: player.id || player.personId || player.playerId || 0,
          fullName: fullName,
          link: "",
        },
        jerseyNumber: player.sweaterNumber || 0,
        position: {
          code: player.positionCode || "",
          name: player.positionCode || "",
          type: "",
          abbreviation: player.positionCode || "",
        },
        headshotUrl: player.headshot || undefined,
      };
    });

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ Fetched ${roster.length} players from roster`
    );

    const forwards = roster.filter((p) => ["C", "LW", "RW"].includes(p.position.code));
    const defense = roster.filter((p) => p.position.code === "D");
    const goalies = roster.filter((p) => p.position.code === "G");

    console.log(
      `${LOG_PREFIX.NHL_API} Forwards: ${forwards.length}, Defense: ${defense.length}, Goalies: ${goalies.length}`
    );

    return roster;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX.NHL_API} ❌ Error fetching roster:`, errorMsg);
    throw error;
  }
}

/**
 * Fetch player details from NHLE API
 * Endpoint: /v1/player/{playerId}/landing
 */
export async function fetchPlayerDetail(playerId: number): Promise<PlayerDetail> {
  const url = `${BASE_URL}/player/${playerId}/landing`;

  console.log(`${LOG_PREFIX.NHL_API} Fetching player details for ID ${playerId}...`);

  try {
    const response = await retryFetch(url);

    if (!response.ok) {
      throw new Error(
        `${LOG_PREFIX.NHL_API} HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const player = data.playerSummary;

    if (!player) {
      throw new Error(`${LOG_PREFIX.NHL_API} Player not found`);
    }

    const fullName = player.firstName?.default && player.lastName?.default
      ? `${player.firstName.default} ${player.lastName.default}`
      : player.name?.default || "Unknown";

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ Fetched player: ${fullName}`
    );

    return {
      person: {
        id: player.playerId || 0,
        fullName: fullName,
        link: "",
        primaryNumber: player.sweaterNumber || 0,
        birthDate: player.birthDate || "",
        currentAge: 0,
        birthCity: player.birthCity?.default || "",
        birthCountry: player.birthCountry?.default || "",
        height: player.height || "",
        weight: player.weight || 0,
        active: true,
        alternateCaptain: false,
        captain: false,
        rookie: false,
        shootsCatches: player.shoots || "",
        rosterStatus: "",
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `${LOG_PREFIX.NHL_API} ❌ Error fetching player details:`,
      errorMsg
    );
    throw error;
  }
}

/**
 * Fetch team schedule from NHLE API
 * Uses the /month/now endpoint to get current month's games
 * Endpoint: /v1/club-schedule/{team}/month/now
 * This returns only the current month's games, avoiding the 90-game limit of /season/now
 * @param teamId - Optional team ID (ignored, kept for backward compatibility)
 * @param season - Ignored (kept for backward compatibility)
 * @param startDate - Ignored (kept for backward compatibility)
 */
export async function fetchTeamSchedule(
  teamId?: number,
  season?: string,
  startDate?: string
): Promise<ScheduleGame[]> {
  // Use /month/now endpoint - only returns current month, not whole season
  // Avoids the issue where /season/now only returns 90 games with old dates
  const url = `${BASE_URL}/club-schedule/${TEAM_ABBREV}/month/now`;

  console.log(`${LOG_PREFIX.NHL_API} Fetching schedule for ${TEAM_ABBREV}...`);
  console.log(`${LOG_PREFIX.NHL_API} URL: ${url}`);

  try {
    const response = await retryFetch(url);

    if (!response.ok) {
      throw new Error(
        `${LOG_PREFIX.NHL_API} HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.games || !Array.isArray(data.games)) {
      console.error(`${LOG_PREFIX.NHL_API} Response structure:`, JSON.stringify(data).substring(0, 500));
      throw new Error(`${LOG_PREFIX.NHL_API} Invalid schedule data structure`);
    }

    // Debug: Log date range to see what we're getting
    console.log(`${LOG_PREFIX.NHL_API} Total games in response: ${data.games.length}`);
    if (data.games.length > 0) {
      console.log(`${LOG_PREFIX.NHL_API} First game date: ${data.games[0].gameDate}`);
      console.log(`${LOG_PREFIX.NHL_API} Last game date: ${data.games[data.games.length - 1].gameDate}`);
    }

    const games: ScheduleGame[] = data.games.map((game: any) => ({
      gamePk: game.gameId || game.id || 0,
      link: "",
      gameType: game.gameType || "",
      season: 20252026, // Current season
      gameDate: game.gameDate || "",
      status: {
        abstractGameState: game.gameState || "Scheduled",
        detailedState: game.gameState || "Scheduled",
        statusCode: game.gameState || "Scheduled",
      },
      teams: {
        away: {
          leagueRecord: {
            wins: game.awayTeam?.wins || 0,
            losses: game.awayTeam?.losses || 0,
            ot: game.awayTeam?.otl || 0,
          },
          score: game.awayTeam?.score || 0,
          team: {
            id: game.awayTeam?.id || 0,
            name: game.awayTeam?.commonName?.default || game.awayTeam?.name || "",
            link: "",
          },
          goals: game.awayTeam?.score || 0,
          shotsOnGoal: game.awayTeam?.sog || 0,
        },
        home: {
          leagueRecord: {
            wins: game.homeTeam?.wins || 0,
            losses: game.homeTeam?.losses || 0,
            ot: game.homeTeam?.otl || 0,
          },
          score: game.homeTeam?.score || 0,
          team: {
            id: game.homeTeam?.id || 0,
            name: game.homeTeam?.commonName?.default || game.homeTeam?.name || "",
            link: "",
          },
          goals: game.homeTeam?.score || 0,
          shotsOnGoal: game.homeTeam?.sog || 0,
        },
      },
    }));

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ Fetched ${games.length} games from schedule`
    );

    const completed = games.filter((g) => g.status.abstractGameState === "Final");
    const upcoming = games.filter((g) => g.status.abstractGameState === "Scheduled");
    console.log(
      `${LOG_PREFIX.NHL_API} Completed: ${completed.length}, Upcoming: ${upcoming.length}`
    );

    return games;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX.NHL_API} ❌ Error fetching schedule:`, errorMsg);
    throw error;
  }
}

/**
 * Fetch standings from NHLE API
 * Endpoint: /v1/standings/now or /v1/standings/{date}
 */
export async function fetchStandings(date?: string): Promise<StandingsRecord[]> {
  const url = date
    ? `${BASE_URL}/standings/${date}`
    : `${BASE_URL}/standings/now`;

  console.log(`${LOG_PREFIX.NHL_API} Fetching standings...`);
  console.log(`${LOG_PREFIX.NHL_API} URL: ${url}`);

  try {
    const response = await retryFetch(url);

    if (!response.ok) {
      throw new Error(
        `${LOG_PREFIX.NHL_API} HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // NHLE API returns { wildCardIndicator, standingsDateTimeUtc, standings: [...] }
    if (!data.standings || !Array.isArray(data.standings)) {
      console.error(`${LOG_PREFIX.NHL_API} Response keys:`, Object.keys(data));
      throw new Error(`${LOG_PREFIX.NHL_API} Invalid standings data structure`);
    }

    // Group standings by division
    const standingsByDivision: { [key: string]: any[] } = {};

    for (const standing of data.standings) {
      const divisionName = standing.divisionName;
      if (!standingsByDivision[divisionName]) {
        standingsByDivision[divisionName] = [];
      }
      standingsByDivision[divisionName].push(standing);
    }

    const standings: StandingsRecord[] = Object.entries(standingsByDivision).map(([divisionName, teams]) => {
      // Get conference name from first team in division (all in same division have same conference)
      const conferenceName = teams[0]?.conferenceName || "";
      const divisionAbbrev = teams[0]?.divisionAbbrev || "";

      return {
        division: {
          name: divisionName,
          id: 0,
        },
        conference: {
          name: conferenceName,
          id: 0,
        },
        teamRecords: teams.map((team: any) => ({
          team: {
            id: team.teamId || team.id || 0,
            name: team.teamName?.default || team.commonName?.default || team.name || team.teamCommonName?.default || "",
            link: "",
          },
          leagueRecord: {
            wins: team.wins ?? (team.homeWins ?? 0) + (team.roadWins ?? 0),
            losses: team.losses ?? (team.homeLosses ?? 0) + (team.roadLosses ?? 0),
            ot: team.otLosses ?? (team.homeOtLosses ?? 0) + (team.roadOtLosses ?? 0),
          },
          points: team.points || 0,
          gamesPlayed: team.gamesPlayed || 0,
          divisionRank: (team.divisionSequence || team.divisionRank || 0).toString(),
          conferenceRank: (team.conferenceSequence || team.conferenceRank || 0).toString(),
          leagueRank: (team.leagueSequence || team.leagueRank || 0).toString(),
          goalsFor: team.goalFor ?? team.goalsFor ?? 0,
          goalsAgainst: team.goalAgainst ?? team.goalsAgainst ?? 0,
          goalDifferential: team.goalDifferential ?? ((team.goalsFor ?? 0) - (team.goalsAgainst ?? 0)),
        })),
      };
    });

    console.log(
      `${LOG_PREFIX.NHL_API} ✓ Fetched standings for ${standings.length} divisions`
    );

    const totalTeams = standings.reduce(
      (sum: number, division: any) => sum + (division.teamRecords?.length || 0),
      0
    );
    console.log(`${LOG_PREFIX.NHL_API} Total teams: ${totalTeams}`);

    return standings;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX.NHL_API} ❌ Error fetching standings:`, errorMsg);
    throw error;
  }
}

/**
 * Helper: Get NHLE headshot URL for a player (fallback if API doesn't return one)
 * Format: https://assets.nhle.com/mugsshots/nhl/latest/{playerId}.png
 */
export function getNHLHeadshotUrl(playerId: number): string {
  return `https://assets.nhle.com/mugsshots/nhl/latest/${playerId}.png`;
}

console.log(
  `${LOG_PREFIX.NHL_API} Client initialized. Base URL: ${BASE_URL}`
);
