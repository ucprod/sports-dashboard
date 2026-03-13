/**
 * Refresh endpoint
 * POST /api/refresh
 *
 * Triggered by Vercel Cron at 3 AM EST (0 8 * * * UTC)
 * Fetches latest roster, games, standings from NHL API
 * Generates portraits for new players
 * Updates all cached data in Supabase
 *
 * TODO: Implement in Phase 7
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    // Verify this is from Vercel Cron (or local testing)
    // In production, Vercel sets x-vercel-cron header

    console.log("[Refresh] Starting daily job...");

    // Phase 7 implementation will go here:
    // 1. Fetch NHL API roster
    // 2. Load last roster snapshot
    // 3. Detect changes (new/removed players)
    // 4. Generate portraits for new players via DALL-E
    // 5. Upload to Supabase Storage
    // 6. Update players table
    // 7. Fetch and cache games
    // 8. Fetch and cache standings
    // 9. Log completion to refresh_log

    return NextResponse.json({
      success: true,
      message:
        "Refresh job placeholder - implement in Phase 7 (Daily Refresh Job)",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Refresh] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  // Allow manual triggering for testing
  return POST(_request);
}
