/**
 * Types for NHL API responses
 * Based on https://statsapi.nhl.com/api/v1 endpoints
 */

export interface RosterPlayer {
  person: {
    id: number;
    fullName: string;
    link: string;
  };
  jerseyNumber: number;
  position: {
    code: string; // "C", "LW", "RW", "D", "G"
    name: string;
    type: string;
    abbreviation: string;
  };
}

export interface PlayerDetail {
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
  };
}

export interface ScheduleGame {
  gamePk: number;
  link: string;
  gameType: string; // "R" (regular), "P" (playoff), "PR" (preseason)
  season: number;
  gameDate: string; // ISO timestamp
  status: {
    abstractGameState: string; // "Final", "Live", "Scheduled"
    detailedState: string;
    statusCode: string;
  };
  teams: {
    away: {
      leagueRecord: {
        wins: number;
        losses: number;
        ot: number;
      };
      score: number;
      team: {
        id: number;
        name: string;
        link: string;
      };
      goals: number;
      shotsOnGoal: number;
    };
    home: {
      leagueRecord: {
        wins: number;
        losses: number;
        ot: number;
      };
      score: number;
      team: {
        id: number;
        name: string;
        link: string;
      };
      goals: number;
      shotsOnGoal: number;
    };
  };
}

export interface StandingsRecord {
  division: {
    name: string;
    id: number;
  };
  conference: {
    name: string;
    id: number;
  };
  teamRecords: Array<{
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
  }>;
}

export interface Team {
  id: number;
  name: string;
  link: string;
  abbreviation: string;
  teamName: string;
  locationName: string;
  firstYearOfPlay: string;
  division: {
    id: number;
    name: string;
    link: string;
  };
  conference: {
    id: number;
    name: string;
    link: string;
  };
  franchise: {
    franchiseId: number;
    teamName: string;
    link: string;
  };
  shortName: string;
  officialSiteUrl: string;
  franchiseId: number;
  active: boolean;
}
