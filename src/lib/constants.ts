/**
 * Application constants and configuration
 */

// NHL Configuration
export const NHL_CONFIG = {
  TEAM_ID: parseInt(process.env.NEXT_PUBLIC_NHL_TEAM_ID || "25"),
  TEAM_NAME: process.env.NEXT_PUBLIC_NHL_TEAM_NAME || "Edmonton Oilers",
  TEAM_ABBREVIATION: process.env.NEXT_PUBLIC_NHL_TEAM_ABBREVIATION || "EDM",
  BASE_URL: "https://api-web.nhle.com/v1",
};

// Refresh Schedule (Vercel Cron: 0 8 * * * = 3 AM EST = 8 AM UTC)
export const REFRESH_CONFIG = {
  SCHEDULE_UTC: "0 8 * * *", // 8 AM UTC = 3 AM EST
  TIMEZONE: "America/Edmonton",
  DESCRIPTION: "Daily refresh at 3 AM EST",
};

// Image Generation
export const IMAGE_CONFIG = {
  DALL_E_MODEL: "dall-e-3",
  DALL_E_SIZE: "1024x1024" as const,
  DALL_E_QUALITY: "standard" as const,
  PLACEHOLDER_URL:
    process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL ||
    "https://via.placeholder.com/256x256?text=NO+PHOTO",
  PORTRAIT_BUCKET: "player-portraits",
  PORTRAIT_SIZE: "256x256",
};

// API Endpoints
export const NHL_ENDPOINTS = {
  ROSTER: (teamId: number) => `/teams/${teamId}/roster`,
  PLAYER: (playerId: number) => `/people/${playerId}`,
  SCHEDULE: (teamId: number) => `/teams/${teamId}/schedule`,
  STANDINGS: () => `/standings`,
};

// Supabase Tables
export const DB_TABLES = {
  TEAMS: "teams",
  PLAYERS: "players",
  GAMES: "games",
  STANDINGS: "standings",
  REFRESH_LOG: "refresh_log",
  ROSTER_SNAPSHOTS: "roster_snapshots",
};

// Cache Durations (in milliseconds)
export const CACHE_DURATIONS = {
  ROSTER: 24 * 60 * 60 * 1000, // 24 hours
  GAMES: 24 * 60 * 60 * 1000, // 24 hours
  STANDINGS: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_LOG: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Error Messages
export const ERROR_MESSAGES = {
  SUPABASE_CONNECTION: "Unable to connect to database. Please try again later.",
  NHL_API: "Unable to fetch NHL data. Please try again later.",
  IMAGE_GENERATION: "Unable to generate player portrait. Using placeholder.",
  REFRESH_FAILED: "Daily refresh job failed. Check logs for details.",
};

// Position Groups
export const POSITION_GROUPS = {
  FORWARDS: ["C", "LW", "RW"],
  DEFENSE: ["D"],
  GOALIES: ["G"],
};

// Team Colors (Oilers)
export const TEAM_COLORS = {
  PRIMARY: "#FF4500", // Orange
  SECONDARY: "#003399", // Blue
  GOLD: "#FDB827",
  WHITE: "#FFFFFF",
};

// Logging
export const LOG_PREFIX = {
  REFRESH: "[Refresh]",
  DALLE: "[DALL-E]",
  NHL_API: "[NHL API]",
  SUPABASE: "[Supabase]",
  ERROR: "[ERROR]",
};
