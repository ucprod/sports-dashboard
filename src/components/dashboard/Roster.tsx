/**
 * Roster Component
 * Dense, full-height roster grid organized by position group.
 * Three labeled sections scroll horizontally per group; the overall
 * roster area fills whatever vertical space the layout grants it.
 */

import { Player } from "@/types/database";
import RosterPlayer from "./RosterPlayer";

interface RosterProps {
  players: Player[];
  loading?: boolean;
  error?: string;
}

/** Skeleton row of player-card-shaped pulses */
function SkeletonRow({ count }: { count: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-[88px] rounded-lg bg-white/5 animate-pulse"
          style={{ aspectRatio: "3/4" }}
        />
      ))}
    </div>
  );
}

export default function Roster({ players, loading = false, error }: RosterProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/40">
        <span className="text-red-400 text-sm font-semibold">Roster unavailable</span>
        <span className="text-red-300/70 text-xs">{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        {[
          { label: "FORWARDS", count: 13 },
          { label: "DEFENSE", count: 8 },
          { label: "GOALIES", count: 3 },
        ].map(({ label, count }) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{label}</span>
              <div className="flex-1 h-px bg-white/5" />
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
    color: string;
    players: Player[];
  }> = [
    { label: "FORWARDS", color: "text-oilers-orange", players: forwards },
    { label: "DEFENSE", color: "text-[#6699ff]", players: defense },
    { label: "GOALIES", color: "text-oilers-gold", players: goalies },
  ];

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        No players found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      {sections.map(({ label, color, players: group }) => {
        if (group.length === 0) return null;
        return (
          <div key={label} className="flex flex-col gap-1 flex-1 min-h-0">
            {/* Section header */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${color}`}>
                {label}
              </span>
              <span className="text-gray-700 text-[10px]">({group.length})</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Horizontal scrolling player row — cards fill full section height */}
            <div className="flex gap-2 overflow-x-auto scrollbar-thin flex-1 min-h-0">
              {group.map((player) => (
                <div key={player.id} className="shrink-0 h-full aspect-[3/4]">
                  <RosterPlayer player={player} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
