/**
 * Pixel Art Portrait API Route
 * GET /api/portrait/[playerId]
 *
 * Fetches the official NHL headshot for a player, applies a 16-bit pixel art
 * transformation, and returns the resulting PNG. Cached for 24 hours via
 * Next.js route revalidation and Cache-Control headers.
 */

import { applyPixelArt } from "@/lib/pixel-art";
import { getNHLHeadshotUrl } from "@/lib/nhl-api";

// Revalidate at most once per day — subsequent requests within 24h are cached
export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: { playerId: string } }
): Promise<Response> {
  const { playerId } = params;

  if (!playerId || !/^\d+$/.test(playerId)) {
    return new Response("Invalid player ID", { status: 400 });
  }

  const headshotUrl = getNHLHeadshotUrl(parseInt(playerId, 10));

  let sourceBuffer: Buffer;
  try {
    const res = await fetch(headshotUrl);
    if (!res.ok) {
      return Response.redirect(headshotUrl, 302);
    }
    sourceBuffer = Buffer.from(await res.arrayBuffer());
  } catch {
    return Response.redirect(headshotUrl, 302);
  }

  try {
    const pixelArtBuffer = await applyPixelArt(sourceBuffer);

    return new Response(new Uint8Array(pixelArtBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    // If transformation fails, fall back to the original headshot
    return Response.redirect(headshotUrl, 302);
  }
}
