/**
 * RosterPlayer Component
 * Compact player card for the dense roster grid.
 * Styled after NHL '94 individual player cards:
 *   - Sharp rectangular corners (no large radius)
 *   - Thick colored border per position group
 *   - Dark near-black card background
 *   - Portrait fills the card; pixel art rendering preserved
 *   - Name strip uses mono font with last name in gold
 *   - Jersey number and position badge in retro flat style
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

  // Border color per position — thicker, sharper, more visible than before
  const borderColor = {
    forward: "border-oilers-orange/70",
    defense: "border-[#6699ff]/70",
    goalie: "border-oilers-gold/70",
  }[playerType];

  // Jersey number color
  const numberColor = {
    forward: "text-oilers-orange",
    defense: "text-[#6699ff]",
    goalie: "text-oilers-gold",
  }[playerType];

  // Position badge — solid flat block, no blur, retro feel
  const badgeBg = {
    forward: "bg-oilers-orange text-[#080d1a]",
    defense: "bg-[#003399] text-[#6699ff]",
    goalie: "bg-oilers-gold text-[#080d1a]",
  }[playerType];

  // Last name color — gold for all, tinted by position
  const lastNameColor = {
    forward: "text-oilers-gold",
    defense: "text-[#aabbff]",
    goalie: "text-oilers-gold",
  }[playerType];

  const imageUrl = player.portrait_url || player.nhl_headshot_url;

  return (
    <div
      className={`
        group relative flex flex-col h-full bg-[#060c18] border-2 ${borderColor}
        overflow-hidden transition-all duration-150 font-mono
        hover:scale-[1.04] hover:brightness-110
        cursor-default select-none
      `}
      // No border-radius — sharp pixel-game corners
    >
      {/* Portrait area — flex-1 fills all space above the name strip */}
      <div className="relative flex-1 min-h-0 bg-[#0a1428] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${player.first_name} ${player.last_name}`}
            fill
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 12vw"
            className="object-cover object-top"
            style={{ imageRendering: "pixelated" }}
            // imageRendering: pixelated keeps pixel art crisp when upscaled
          />
        ) : (
          /* Initials fallback — retro monogram with position color */
          <div className="w-full h-full flex items-center justify-center">
            <span className={`font-bold text-2xl opacity-25 ${numberColor}`}>
              {player.first_name?.[0]}{player.last_name?.[0]}
            </span>
          </div>
        )}

        {/* Jersey number — top-left, flat black bg, no blur, sharp corners */}
        <div className="absolute top-0 left-0 bg-black/80 px-1 py-0.5">
          <span className={`font-bold text-[10px] tabular-nums leading-none ${numberColor}`}>
            {player.jersey_number}
          </span>
        </div>

        {/* Position badge — top-right, solid color block */}
        <div className="absolute top-0 right-0">
          <span className={`text-[8px] font-bold px-1 py-0.5 leading-none ${badgeBg}`}>
            {positionCode}
          </span>
        </div>
      </div>

      {/* Name strip — dark bg with gold last name in mono */}
      <div
        className="px-1.5 py-1 text-center bg-[#060c18] border-t border-white/8"
      >
        <p className={`font-bold text-[10px] leading-tight truncate uppercase tracking-wide ${lastNameColor}`}>
          {player.last_name}
        </p>
        <p className="text-gray-600 text-[9px] truncate uppercase tracking-wider leading-tight">
          {player.first_name?.[0]}.
        </p>
      </div>
    </div>
  );
}
