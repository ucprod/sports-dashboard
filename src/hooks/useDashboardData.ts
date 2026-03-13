/**
 * useDashboardData Hook
 * Fetches roster, games, and standings from /api/dashboard-data.
 * The API route now returns database Player/Game/Standing objects directly,
 * so no client-side transformation is needed.
 */

"use client";

import { useEffect, useState } from "react";
import { Player, Game, Standing } from "@/types/database";

export interface DashboardData {
  roster: Player[];
  lastGame: Game | null;
  nextGame: Game | null;
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

        console.log(
          `[Dashboard] API response received (source: ${apiData.source ?? "unknown"})`
        );

        const roster: Player[] = apiData.data.roster ?? [];
        const lastGame: Game | null = apiData.data.lastGame ?? null;
        const nextGame: Game | null = apiData.data.nextGame ?? null;
        const oilersStanding: Standing | null =
          apiData.data.oilersStanding ?? null;

        console.log(`[Dashboard] ${roster.length} players in roster`);
        if (lastGame) {
          console.log(
            `[Dashboard] Last game: ${lastGame.away_team_name} @ ${lastGame.home_team_name} — ${lastGame.status}`
          );
        }
        if (nextGame) {
          console.log(
            `[Dashboard] Next game: ${nextGame.away_team_name} @ ${nextGame.home_team_name} on ${nextGame.game_date}`
          );
        }
        if (oilersStanding) {
          console.log(
            `[Dashboard] Standing: ${oilersStanding.wins}W-${oilersStanding.losses}L-${oilersStanding.overtime_losses}OT (${oilersStanding.points} pts) — ${oilersStanding.division}`
          );
        }

        setState({
          data: { roster, lastGame, nextGame, oilersStanding },
          loading: false,
          error: null,
        });

        console.log("[Dashboard] All data loaded successfully");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[Dashboard] Error fetching data:", errorMsg);
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
