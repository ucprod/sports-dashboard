/**
 * Types for React components
 */

import { Player, Game, Standing } from "./database";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export interface RosterPlayerCardProps {
  player: Player & {
    stats?: {
      games: number;
      goals: number;
      assists: number;
      points: number;
      gaa?: number;
      savePercentage?: number;
    };
  };
}

export interface GameCardProps {
  game: Game | null;
  type: "last" | "next";
  loading?: boolean;
}

export interface StandingsTableProps {
  standing: Standing | null;
  loading?: boolean;
}

export interface RosterGridProps {
  players: RosterPlayerCardProps["player"][];
  loading?: boolean;
  error?: string;
}

export interface ErrorMessageProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export interface DashboardProps {
  initialData?: {
    players: Player[];
    lastGame: Game | null;
    nextGame: Game | null;
    standings: Standing | null;
  };
}
