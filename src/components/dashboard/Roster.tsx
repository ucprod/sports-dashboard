/**
 * Roster Component
 * Displays all players organized by position group
 */

import { Player } from "@/types/database";
import RosterPlayer from "./RosterPlayer";

interface RosterProps {
  players: Player[];
  loading?: boolean;
  error?: string;
}

export default function Roster({ players, loading = false, error }: RosterProps) {
  if (error) {
    return (
      <div className="card border-red-500 border-2">
        <h2 className="card-title text-red-400">⚠️ Error Loading Roster</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">🏒 Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-700 rounded h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Organize players by position group
  const forwards = players.filter(
    (p) => ["C", "LW", "RW", "L", "R"].includes(p.position)
  );
  const defense = players.filter((p) => p.position === "D");
  const goalies = players.filter((p) => p.position === "G");

  return (
    <div className="card">
      <h2 className="card-title">🏒 Roster</h2>

      {/* Forwards Section */}
      {forwards.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-orange-400 mb-3">
            Forwards ({forwards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {forwards.map((player) => (
              <RosterPlayer key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Defense Section */}
      {defense.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-blue-400 mb-3">
            Defense ({defense.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {defense.map((player) => (
              <RosterPlayer key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Goalies Section */}
      {goalies.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-yellow-400 mb-3">
            Goalies ({goalies.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {goalies.map((player) => (
              <RosterPlayer key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No players found</p>
        </div>
      )}
    </div>
  );
}
