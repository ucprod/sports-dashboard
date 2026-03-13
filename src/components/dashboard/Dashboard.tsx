/**
 * Dashboard Component
 * Main wrapper that composes all dashboard sections
 * Fetches and displays roster, games, and standings
 */

"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import Roster from "./Roster";
import GameCard from "./GameCard";
import StandingsTable from "./StandingsTable";

export default function Dashboard() {
  const { data, loading, error } = useDashboardData();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="card border-l-4 border-red-500 bg-red-900 bg-opacity-20">
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              ❌ Error Loading Dashboard
            </h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400">
              Please try refreshing the page or check the console for more
              details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-12 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3"></div>
          </div>

          {/* Games skeleton */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Standings skeleton */}
          <div className="h-96 bg-gray-700 rounded animate-pulse mb-8"></div>

          {/* Roster skeleton */}
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-8 bg-gray-700 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((player) => (
                    <div
                      key={player}
                      className="h-64 bg-gray-700 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-oilers-orange mb-2">
            🏒 Edmonton Oilers Dashboard
          </h1>
          <p className="text-gray-400">
            Team roster, upcoming games, and standings
          </p>
        </div>

        {/* Recent and Upcoming Games */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <GameCard game={data.lastGame} type="last" loading={loading} />
          <GameCard game={data.nextGame} type="next" loading={loading} />
        </div>

        {/* Team Standings */}
        <div className="mb-8">
          <StandingsTable
            standing={data.oilersStanding}
            loading={loading}
            teamName="Edmonton Oilers"
          />
        </div>

        {/* Team Roster */}
        <div>
          <h2 className="text-3xl font-bold text-oilers-orange mb-6">
            📋 Team Roster
          </h2>
          <Roster players={data.roster} loading={loading} />
        </div>
      </div>
    </div>
  );
}
