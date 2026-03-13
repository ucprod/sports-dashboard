/**
 * Dashboard Component
 * Full-screen single-page layout. Nothing scrolls below the fold.
 *
 * Layout (top → bottom):
 *   [Blue stripe]  — top accent stripe
 *   [Header strip] — Oilers orange bar with team name in gold mono
 *   [Blue stripe]  — bottom accent stripe
 *   [Game row]     — Last Game / Next Game as compact retro stat panels
 *   [Roster]       — fills all remaining vertical space
 *
 * Visual theme: NHL '94 / EA Sports 16-bit console aesthetic.
 * Dark navy background with CRT scanline texture, chunky mono font,
 * Oilers orange header bar, blue accent stripes, gold text.
 */

"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import Roster from "./Roster";
import GameCard from "./GameCard";

export default function Dashboard() {
  const { data, loading, error } = useDashboardData();

  if (error) {
    return (
      <div
        className="h-full flex items-center justify-center p-6 bg-[#080d1a] font-mono"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
        }}
      >
        <div className="max-w-md w-full bg-[#0d1428] border-2 border-red-500/60 p-6">
          <div className="h-1 bg-red-600 -mx-6 -mt-6 mb-4" />
          <h2 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-widest">
            !! SYSTEM ERROR !!
          </h2>
          <p className="text-gray-300 text-xs mb-3 leading-relaxed">{error}</p>
          <p className="text-gray-600 text-[10px] uppercase tracking-wider">
            REFRESH PAGE TO RETRY
          </p>
          <div className="h-1 bg-red-600 -mx-6 -mb-6 mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-[#080d1a] font-mono"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
      }}
    >
      {/* ── Top blue accent stripe ─────────────────────────────────────── */}
      <div className="shrink-0 h-1.5 bg-oilers-blue" />

      {/* ── Header bar — orange background, gold mono text ─────────────── */}
      <header className="shrink-0 bg-oilers-orange flex items-center justify-between px-4 sm:px-6 py-2">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-oilers-gold leading-none tracking-[0.15em] uppercase">
            Edmonton Oilers
          </h1>
          <p className="text-[10px] text-oilers-gold/70 mt-0.5 leading-none tracking-widest uppercase">
            2025–26 Season
          </p>
        </div>

        {/* Live data indicator — retro "LIVE" badge */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-oilers-gold animate-pulse" />
          <span className="text-[10px] text-oilers-gold/80 hidden sm:inline tracking-widest uppercase">
            Daily · 3 AM EST
          </span>
        </div>
      </header>

      {/* ── Bottom blue accent stripe ──────────────────────────────────── */}
      <div className="shrink-0 h-1.5 bg-oilers-blue" />

      {/* ── Game info row ─────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 sm:px-5 pt-2.5 pb-2">
        <GameCard game={data?.lastGame ?? null} type="last" loading={loading} />
        <GameCard game={data?.nextGame ?? null} type="next" loading={loading} />
      </div>

      {/* ── Roster section header ──────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 sm:px-5 pt-0.5 pb-1.5">
        <span className="text-[10px] font-bold tracking-[0.2em] text-oilers-gold/60 uppercase">
          Player Cards
        </span>
        {/* Dashed separator line — NHL '94 style */}
        <div
          className="flex-1 h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(253,184,39,0.3) 0px, rgba(253,184,39,0.3) 4px, transparent 4px, transparent 8px)",
          }}
        />
      </div>

      {/* ── Roster — fills remaining space ────────────────────────────── */}
      <div className="flex-1 min-h-0 px-3 sm:px-5 pb-2.5 overflow-hidden">
        <Roster
          players={data?.roster ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
