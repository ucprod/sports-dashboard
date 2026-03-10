/**
 * Health check endpoint
 * GET /api/health
 *
 * Used to verify app is running and Supabase connection is working
 */

import { NextRequest, NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check Supabase connection
    const isConnected = await checkSupabaseConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          status: "degraded",
          message: "App is running but database connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "App and database are operational",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health Check] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
