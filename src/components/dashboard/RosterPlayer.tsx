/**
 * RosterPlayer Component
 * Compact player card for the dense roster grid.
 * Portrait dominates; jersey number, name, and position shown below.
 */

import { Player } from "@/types/database";
import Image from "next/image";

interface RosterPlayerProps {
  player: Player;
}

export default function RosterPlayer({ player }: RosterPlayerProps) {
  const positionCode = player.position || "";

  const playerType =
    ["C", "LW", "RW"].includes(positionCode)
      ? "forward"
      : positionCode === "D"
        ? "defense"
        : "goalie";

  const accentClasses = {
    forward: "border-oilers-orange/60 shadow-oilers-orange/10",
    defense: "border-oilers-blue/70 shadow-oilers-blue/10",
    goalie: "border-oilers-gold/60 shadow-oilers-gold/10",
  }[playerType];

  const numberClasses = {
    forward: "text-oilers-orange",
    defense: "text-[#6699ff]",
    goalie: "text-oilers-gold",
  }[playerType];

  const positionBadgeClasses = {
    forward: "bg-oilers-orange/15 text-oilers-orange",
    defense: "bg-oilers-blue/30 text-[#6699ff]",
    goalie: "bg-oilers-gold/15 text-oilers-gold",
  }[playerType];

  const imageUrl = player.portrait_url || player.nhl_headshot_url;

  return (
    <div
      className={`
        group relative flex flex-col h-full bg-[#111827] rounded-lg border ${accentClasses}
        overflow-hidden transition-all duration-200
        hover:scale-[1.03] hover:shadow-lg hover:border-opacity-100
        cursor-default select-none
      `}
      style={{ borderWidth: "1.5px" }}
    >
      {/* Portrait area — flex-1 so it fills all space above the name strip */}
      <div className="relative flex-1 min-h-0 bg-gradient-to-b from-[#1a2235] to-[#0d1320] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${player.first_name} ${player.last_name}`}
            fill
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 12vw"
            className="object-cover object-top"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          /* Initials placeholder — keeps the pixel-art vibe with a retro monogram */
          <div className="w-full h-full flex items-center justify-center">
            <span className={`font-bold text-2xl opacity-30 ${numberClasses}`}>
              {player.first_name?.[0]}{player.last_name?.[0]}
            </span>
          </div>
        )}

        {/* Jersey number — top-left badge */}
        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
          <span className={`font-bold text-[11px] tabular-nums ${numberClasses}`}>
            #{player.jersey_number}
          </span>
        </div>

        {/* Position badge — top-right */}
        <div className="absolute top-1.5 right-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${positionBadgeClasses} backdrop-blur-sm`}>
            {positionCode}
          </span>
        </div>
      </div>

      {/* Player name strip */}
      <div className="px-2 py-1.5 text-center">
        <p className="text-white font-semibold text-[11px] leading-tight truncate">
          {player.last_name}
        </p>
        <p className="text-gray-500 text-[10px] truncate">
          {player.first_name}
        </p>
      </div>
    </div>
  );
}
