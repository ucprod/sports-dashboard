/**
 * Dashboard Component
 * Full-screen single-page layout. Nothing scrolls below the fold.
 *
 * Layout (top → bottom):
 *   [Header strip] — team name + live indicator
 *   [Game row]     — Last Game / Next Game as compact horizontal strips
 *   [Roster]       — fills all remaining vertical space
 */

"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import Roster from "./Roster";
import GameCard from "./GameCard";

export default function Dashboard() {
  const { data, loading, error } = useDashboardData();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a0a0a] border border-red-500/40 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-400 mb-2">
            Dashboard unavailable
          </h2>
          <p className="text-gray-300 text-sm mb-3">{error}</p>
          <p className="text-gray-500 text-xs">
            Try refreshing the page. Check the browser console for details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header strip ─────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0d1220] border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Orange accent bar */}
          <div className="w-1 h-6 rounded-full bg-oilers-orange" />
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-none tracking-wide">
              Edmonton Oilers
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-none">
              2025–26 Season
            </p>
          </div>
        </div>

        {/* Live data indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Updated daily · 3 AM EST
          </span>
        </div>
      </header>

      {/* ── Game info row ─────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 sm:px-6 pt-3 pb-2">
        <GameCard game={data?.lastGame ?? null} type="last" loading={loading} />
        <GameCard game={data?.nextGame ?? null} type="next" loading={loading} />
      </div>

      {/* ── Section label ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-4 sm:px-6 pt-1 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
          Roster
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* ── Roster — fills remaining space ────────────────────────────── */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 overflow-hidden">
        <Roster
          players={data?.roster ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
