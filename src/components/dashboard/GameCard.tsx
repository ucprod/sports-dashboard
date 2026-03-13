/**
 * GameCard Component
 * Displays a single game (last game result or upcoming game)
 */

import { Game } from "@/types/database";

interface GameCardProps {
  game: Game | null;
  type: "last" | "next";
  loading?: boolean;
}

export default function GameCard({ game, type, loading = false }: GameCardProps) {
  const isLast = type === "last";
  const title = isLast ? "🏁 Last Game" : "📅 Next Game";
  const emptyMessage = isLast
    ? "No completed games yet"
    : "No upcoming games scheduled";

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">{title}</h2>
        <div className="bg-gray-700 rounded h-32 animate-pulse" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="card">
        <h2 className="card-title">{title}</h2>
        <div className="text-center py-6 text-gray-400">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Determine which team is ours (Edmonton Oilers)
  const isTeamHome = game.is_team_home;
  const ourTeam = isTeamHome ? game.home_team_name : game.away_team_name;
  const opponentTeam = isTeamHome ? game.away_team_name : game.home_team_name;
  const ourScore = isTeamHome ? game.home_score : game.away_score;
  const opponentScore = isTeamHome ? game.away_score : game.home_score;

  // Format game date
  const gameDate = new Date(game.game_date);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Edmonton",
  });
  const formattedDate = dateFormatter.format(gameDate);

  // Determine game status styling
  const isFinished = game.status === "Final";
  let statusColor = "text-gray-400";
  let resultText = "";

  if (isFinished && ourScore !== null && opponentScore !== null) {
    if (ourScore > opponentScore) {
      statusColor = "text-green-400";
      resultText = "W";
    } else if (ourScore < opponentScore) {
      statusColor = "text-red-400";
      resultText = "L";
    } else {
      statusColor = "text-blue-400";
      resultText = "T";
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>

      <div className="space-y-4">
        {/* Game Date */}
        <div className="text-center text-sm text-gray-400">{formattedDate}</div>

        {/* Teams and Score */}
        <div className="space-y-3">
          {/* Home/Away indicator */}
          <div className="text-center text-xs text-gray-500">
            {isTeamHome ? "HOME" : "AWAY"} GAME
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-between text-center">
            {/* Opponent Team */}
            <div className="flex-1">
              <p className="text-lg font-bold text-white mb-1">{opponentTeam}</p>
              {isFinished && (
                <p className="text-2xl font-bold text-gray-300">
                  {opponentScore ?? "—"}
                </p>
              )}
              {!isFinished && <p className="text-sm text-gray-400">TBA</p>}
            </div>

            {/* Divider / Status */}
            <div className="flex-none mx-4">
              {isFinished && resultText && (
                <div className={`text-lg font-bold ${statusColor}`}>
                  {resultText}
                </div>
              )}
              {!isFinished && <div className="text-gray-500">@</div>}
            </div>

            {/* Our Team (Oilers) */}
            <div className="flex-1">
              <p className="text-lg font-bold text-oilers-orange mb-1">
                {ourTeam}
              </p>
              {isFinished && (
                <p className="text-2xl font-bold text-oilers-orange">
                  {ourScore ?? "—"}
                </p>
              )}
              {!isFinished && <p className="text-sm text-gray-400">TBA</p>}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-700">
          {game.status || (isFinished ? "Final" : "Scheduled")}
        </div>
      </div>
    </div>
  );
}
