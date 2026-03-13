/**
 * Roster Component
 * Dense, full-height roster grid organized by position group.
 * Three labeled sections scroll horizontally per group; the overall
 * roster area fills whatever vertical space the layout grants it.
 *
 * Visual theme: NHL '94 player card screen — section headers use dashed
 * gold divider lines, outer panel has a visible retro border, mono font.
 */

import { Player } from "@/types/database";
import RosterPlayer from "./RosterPlayer";

interface RosterProps {
  players: Player[];
  loading?: boolean;
  error?: string;
}

/** Dashed separator line rendered with a repeating gradient — no border-dashed needed */
function DashedLine({ color }: { color: string }) {
  return (
    <div
      className="flex-1 h-px"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`,
      }}
    />
  );
}

/** Skeleton row of player-card-shaped pulses — retro rect shape */
function SkeletonRow({ count }: { count: number }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-[80px] bg-white/5 animate-pulse border border-white/5"
          style={{ aspectRatio: "3/4" }}
        />
      ))}
    </div>
  );
}

export default function Roster({ players, loading = false, error }: RosterProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 bg-[#060c18] border-2 border-dashed border-red-600/50 font-mono">
        <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">
          !! ROSTER ERROR
        </span>
        <span className="text-red-300/60 text-[10px] uppercase">{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 h-full overflow-hidden font-mono">
        {[
          { label: "FORWARDS", count: 13, color: "rgba(255,69,0,0.4)" },
          { label: "DEFENSE", count: 8, color: "rgba(0,51,153,0.6)" },
          { label: "GOALIES", count: 3, color: "rgba(253,184,39,0.4)" },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-700 uppercase">
                {label}
              </span>
              <DashedLine color={color} />
            </div>
            <SkeletonRow count={count} />
          </div>
        ))}
      </div>
    );
  }

  const forwards = players.filter((p) => ["C", "LW", "RW"].includes(p.position));
  const defense = players.filter((p) => p.position === "D");
  const goalies = players.filter((p) => p.position === "G");

  const sections: Array<{
    label: string;
    /** Tailwind text color class for the section label */
    labelColor: string;
    /** CSS color value for the dashed line gradient */
    lineColor: string;
    players: Player[];
  }> = [
    {
      label: "FORWARDS",
      labelColor: "text-oilers-orange",
      lineColor: "rgba(255,69,0,0.45)",
      players: forwards,
    },
    {
      label: "DEFENSE",
      labelColor: "text-[#6699ff]",
      lineColor: "rgba(102,153,255,0.45)",
      players: defense,
    },
    {
      label: "GOALIES",
      labelColor: "text-oilers-gold",
      lineColor: "rgba(253,184,39,0.45)",
      players: goalies,
    },
  ];

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 font-mono">
        <span className="text-gray-600 text-[11px] uppercase tracking-widest">
          — NO PLAYERS FOUND —
        </span>
      </div>
    );
  }

  const activeSections = sections.filter((s) => s.players.length > 0);

  return (
    // Outer retro panel — visible border wrapping the whole roster area
    <div className="h-full border border-oilers-gold/15 overflow-hidden p-1.5">
      <div
        className="h-full overflow-hidden gap-2 font-mono"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${activeSections.length}, 1fr)`,
        }}
      >
        {activeSections.map(({ label, labelColor, lineColor, players: group }) => (
          <div key={label} className="flex flex-col gap-1 min-h-0 overflow-hidden">
            {/* Section header — label + count + dashed line */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold tracking-[0.18em] uppercase ${labelColor}`}>
                {label}
              </span>
              <span className="text-gray-700 text-[10px] tabular-nums">
                [{group.length}]
              </span>
              <DashedLine color={lineColor} />
            </div>

            {/* Horizontal scrolling player row — cards fill the grid cell height */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-thin min-h-0 flex-1">
              {group.map((player) => (
                <div key={player.id} className="shrink-0 h-full aspect-[3/4]">
                  <RosterPlayer player={player} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
