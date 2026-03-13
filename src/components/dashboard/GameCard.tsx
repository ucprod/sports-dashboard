/**
 * GameCard Component
 * Retro 16-bit stat panel showing a single game result or upcoming game.
 * Styled after NHL '94 player card stat panels — dark field, gold dashed border,
 * chunky mono font, color-coded label tabs.
 */

import { Game } from "@/types/database";

interface GameCardProps {
  game: Game | null;
  /** "last" = completed game with score; "next" = upcoming game */
  type: "last" | "next";
  loading?: boolean;
}

/** Dashed gold border style shared across all card states */
const panelBase =
  "flex items-center gap-3 bg-[#060c18] border-2 border-dashed px-3 py-2.5 h-full";

export default function GameCard({ game, type, loading = false }: GameCardProps) {
  const isLast = type === "last";
  const label = isLast ? "LAST GAME" : "NEXT GAME";
  const emptyMessage = isLast ? "NO RECENT GAMES" : "NO GAMES SCHEDULED";

  // Last game uses orange tab; next game uses blue tab — matching Oilers palette
  const borderColor = isLast ? "border-oilers-orange/50" : "border-oilers-blue/60";
  const labelBg = isLast ? "bg-oilers-orange text-[#080d1a]" : "bg-oilers-blue text-oilers-gold";

  if (loading) {
    return (
      <div className={`${panelBase} ${borderColor} font-mono`}>
        <div className="w-20 h-2.5 bg-white/10 animate-pulse" />
        <div className="flex-1 h-2.5 bg-white/10 animate-pulse" />
        <div className="w-12 h-4 bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className={`${panelBase} ${borderColor} font-mono`}>
        {/* Label tab */}
        <span className={`text-[9px] font-bold tracking-widest shrink-0 uppercase px-1.5 py-0.5 ${labelBg}`}>
          {label}
        </span>
        <span className="text-gray-600 text-[10px] uppercase tracking-wider">{emptyMessage}</span>
      </div>
    );
  }

  const isTeamHome = game.is_team_home;
  const opponentTeam = isTeamHome ? game.away_team_name : game.home_team_name;
  const ourScore = isTeamHome ? game.home_score : game.away_score;
  const opponentScore = isTeamHome ? game.away_score : game.home_score;

  // Shorten opponent name to last two words (e.g. "Toronto Maple Leafs" -> "Maple Leafs")
  const opponentShort = opponentTeam.split(" ").slice(-2).join(" ").toUpperCase();

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

  // W/L/T outcome — retro badge with flat color fill
  let resultBadge = "";
  let resultBg = "";
  let resultText = "";

  if (isLast && ourScore !== null && opponentScore !== null) {
    if (ourScore > opponentScore) {
      resultBg = "bg-emerald-500";
      resultText = "text-[#080d1a]";
      resultBadge = "W";
    } else if (ourScore < opponentScore) {
      resultBg = "bg-red-600";
      resultText = "text-white";
      resultBadge = "L";
    } else {
      resultBg = "bg-gray-500";
      resultText = "text-white";
      resultBadge = "T";
    }
  }

  return (
    <div className={`${panelBase} ${borderColor} font-mono`}>
      {/* Label tab — solid color block, no radius */}
      <span className={`text-[9px] font-bold tracking-widest shrink-0 uppercase px-1.5 py-0.5 ${labelBg}`}>
        {label}
      </span>

      {/* Pixel divider */}
      <div className="w-px h-5 bg-oilers-gold/20 shrink-0" />

      {/* Date */}
      <span className="text-oilers-gold/60 text-[10px] shrink-0 uppercase tracking-wider">
        {formattedDate}
      </span>

      {/* Home/Away indicator */}
      <span className="text-[10px] text-gray-600 uppercase tracking-widest shrink-0">
        {isTeamHome ? "VS" : "@"}
      </span>

      {/* Opponent name */}
      <span className="text-white text-[11px] font-bold truncate flex-1 min-w-0 tracking-wide">
        {opponentShort}
      </span>

      {/* Score + W/L badge, or status */}
      {isLast && ourScore !== null && opponentScore !== null ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-oilers-gold font-bold text-sm tabular-nums tracking-tight">
            {ourScore}–{opponentScore}
          </span>
          {resultBadge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 ${resultBg} ${resultText}`}>
              {resultBadge}
            </span>
          )}
        </div>
      ) : (
        <span className="text-gray-600 text-[10px] shrink-0 uppercase tracking-widest">
          {game.status || "SCHEDULED"}
        </span>
      )}
    </div>
  );
}
