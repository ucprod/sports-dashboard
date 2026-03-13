/**
 * RosterPlayer Component
 * Displays a single player card with portrait, name, position, and stats
 */

import { Player } from "@/types/database";
import Image from "next/image";

interface RosterPlayerProps {
  player: Player;
}

export default function RosterPlayer({ player }: RosterPlayerProps) {
  const positionCode = player.position || "";
  const positionName = {
    C: "Center",
    LW: "Left Wing",
    RW: "Right Wing",
    L: "Left",
    R: "Right",
    D: "Defense",
    G: "Goalie",
  }[positionCode] || positionCode;

  // Determine if player is forward, defense, or goalie for styling
  const playerType =
    ["C", "LW", "RW", "L", "R"].includes(positionCode)
      ? "forward"
      : positionCode === "D"
        ? "defense"
        : "goalie";

  const borderColor = {
    forward: "border-orange-500",
    defense: "border-blue-500",
    goalie: "border-yellow-500",
  }[playerType];

  return (
    <div
      className={`card border-2 ${borderColor} rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-200`}
    >
      {/* Player Portrait */}
      <div className="relative w-full h-48 bg-gray-700">
        {player.portrait_url ? (
          <Image
            src={player.portrait_url}
            alt={player.first_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-600 to-gray-700">
            <span className="text-gray-400 text-sm text-center px-2">
              {player.first_name?.[0]}
              {player.last_name?.[0]}
            </span>
          </div>
        )}

        {/* Jersey Number Overlay */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center">
          <span className="text-white font-bold text-sm">#{player.jersey_number}</span>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-3">
        {/* Name */}
        <h3 className="font-bold text-white text-sm truncate">
          {player.first_name} {player.last_name}
        </h3>

        {/* Position */}
        <p className="text-gray-300 text-xs mb-2">{positionName}</p>
      </div>
    </div>
  );
}
