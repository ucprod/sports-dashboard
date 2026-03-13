/**
 * GameCard Component
 * Compact horizontal strip showing a single game result or upcoming game.
 */

import { Game } from "@/types/database";

interface GameCardProps {
  game: Game | null;
  type: "last" | "next";
  loading?: boolean;
}

export default function GameCard({ game, type, loading = false }: GameCardProps) {
  const isLast = type === "last";
  const label = isLast ? "LAST GAME" : "NEXT GAME";
  const emptyMessage = isLast ? "No recent games" : "No games scheduled";

  const labelColor = isLast ? "text-oilers-orange" : "text-[#6699ff]";

  if (loading) {
    return (
      <div className="flex items-center gap-3 bg-[#111827] rounded-lg border border-white/5 px-4 py-3 h-full">
        <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
        <div className="flex-1 h-3 bg-white/10 rounded animate-pulse" />
        <div className="w-10 h-5 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className={`flex items-center gap-3 bg-[#111827] rounded-lg border border-white/5 px-4 py-3`}>
        <span className={`text-[10px] font-bold tracking-widest shrink-0 ${labelColor}`}>{label}</span>
        <span className="text-gray-500 text-xs">{emptyMessage}</span>
      </div>
    );
  }

  const isTeamHome = game.is_team_home;
  const opponentTeam = isTeamHome ? game.away_team_name : game.home_team_name;
  const ourScore = isTeamHome ? game.home_score : game.away_score;
  const opponentScore = isTeamHome ? game.away_score : game.home_score;

  // Shorten opponent name to last word (e.g. "Toronto Maple Leafs" -> "Maple Leafs")
  const opponentShort = opponentTeam.split(" ").slice(-2).join(" ");

  const isDateOnly = !game.game_date.includes("T");
  const gameDate = new Date(
    isDateOnly ? game.game_date + "T12:00:00" : game.game_date
  );
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Edmonton",
    ...(isDateOnly ? {} : { hour: "numeric", minute: "2-digit" }),
  }).format(gameDate);

  let resultBadge = "";
  let resultClasses = "text-gray-500";

  if (isLast && ourScore !== null && opponentScore !== null) {
    if (ourScore > opponentScore) {
      resultClasses = "text-emerald-400 bg-emerald-400/10 border border-emerald-400/30";
      resultBadge = "W";
    } else if (ourScore < opponentScore) {
      resultClasses = "text-red-400 bg-red-400/10 border border-red-400/30";
      resultBadge = "L";
    } else {
      resultClasses = "text-gray-400 bg-gray-400/10 border border-gray-400/30";
      resultBadge = "T";
    }
  }

  return (
    <div className="flex items-center gap-3 bg-[#111827] rounded-lg border border-white/5 px-4 py-3 h-full">
      {/* Type label */}
      <span className={`text-[10px] font-bold tracking-widest shrink-0 uppercase ${labelColor}`}>
        {label}
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 shrink-0" />

      {/* Date */}
      <span className="text-gray-400 text-xs shrink-0">{formattedDate}</span>

      {/* Home/Away */}
      <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">
        {isTeamHome ? "vs" : "@"}
      </span>

      {/* Opponent */}
      <span className="text-white text-xs font-semibold truncate flex-1 min-w-0">
        {opponentShort}
      </span>

      {/* Score or result */}
      {isLast && ourScore !== null && opponentScore !== null ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold text-sm tabular-nums">
            {ourScore}–{opponentScore}
          </span>
          {resultBadge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${resultClasses}`}>
              {resultBadge}
            </span>
          )}
        </div>
      ) : (
        <span className="text-gray-500 text-xs shrink-0">
          {game.status || "Scheduled"}
        </span>
      )}
    </div>
  );
}
