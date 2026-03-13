/**
 * StandingsTable Component
 * Displays team standings with key stats
 */

import { Standing } from "@/types/database";

interface StandingsTableProps {
  standing: Standing | null;
  loading?: boolean;
  teamName?: string;
}

export default function StandingsTable({
  standing,
  loading = false,
  teamName = "Edmonton Oilers",
}: StandingsTableProps) {
  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">📊 Standings</h2>
        <div className="bg-gray-700 rounded h-32 animate-pulse" />
      </div>
    );
  }

  if (!standing) {
    return (
      <div className="card">
        <h2 className="card-title">📊 Standings</h2>
        <div className="text-center py-6 text-gray-400">
          <p>Standings data not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">📊 Standings</h2>

      {/* Team Info Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-oilers-orange mb-2">
          {teamName}
        </h3>
        <p className="text-sm text-gray-400">
          {standing.division} Division • {standing.conference} Conference
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {/* Rank */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Division Rank</p>
          <p className="text-2xl font-bold text-white">
            {standing.division_rank || "—"}
          </p>
        </div>

        {/* Games Played */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Games Played</p>
          <p className="text-2xl font-bold text-white">{standing.games_played}</p>
        </div>

        {/* Wins */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Wins</p>
          <p className="text-2xl font-bold text-green-400">{standing.wins}</p>
        </div>

        {/* Losses */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Losses</p>
          <p className="text-2xl font-bold text-red-400">{standing.losses}</p>
        </div>

        {/* OT Losses */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">OT Losses</p>
          <p className="text-2xl font-bold text-blue-400">
            {standing.overtime_losses}
          </p>
        </div>

        {/* Points */}
        <div className="bg-orange-900 bg-opacity-30 rounded p-3 border border-oilers-orange">
          <p className="text-xs text-gray-400 mb-1">Points</p>
          <p className="text-2xl font-bold text-oilers-orange">
            {standing.points}
          </p>
        </div>

        {/* Goals For */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Goals For</p>
          <p className="text-2xl font-bold text-white">{standing.goals_for}</p>
        </div>

        {/* Goals Against */}
        <div className="bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Goals Against</p>
          <p className="text-2xl font-bold text-white">{standing.goals_against}</p>
        </div>
      </div>

      {/* Goal Differential */}
      <div className="bg-gray-700 rounded p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Goal Differential</span>
          <span
            className={`text-lg font-bold ${standing.goal_differential >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {standing.goal_differential >= 0 ? "+" : ""}
            {standing.goal_differential}
          </span>
        </div>
      </div>
    </div>
  );
}
