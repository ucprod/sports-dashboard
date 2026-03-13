/**
 * Pixel Art Portrait Generator
 * Transforms an image buffer into a 16-bit pixel art style image using:
 * 1. Sharp — head-aligned crop, downscale and upscale with nearest-neighbor
 * 2. image-q — reduce palette for the retro look with Floyd-Steinberg dithering
 */

import sharp from "sharp";
import * as imageq from "image-q";

// ~60% pixelation: 64×85 grid with 6× upscale (384×510 output).
const PIXEL_GRID_W = 64;
const PIXEL_GRID_H = 85;

// 6× upscale — each block = 6×6px in the PNG
const OUTPUT_W = 384;
const OUTPUT_H = 510;

// 48 colors — larger palette preserves detail, reduces aggressive dithering.
const PALETTE_COLORS = 48;

// Neutral gray matching the NHL headshot background
const BACKGROUND = { r: 178, g: 178, b: 178 };

// Fraction of output height to leave as padding above the top of the head
const HEAD_TOP_MARGIN = 0.06;

/**
 * Scan the image at 3 horizontal positions near the center to find the first
 * row where pixels deviate from the background — i.e. the top of the head.
 * Returns the fraction of image height where the head starts (0–1).
 */
async function findHeadTopFraction(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .resize(120, null, { fit: "inside", kernel: "nearest" })
    .flatten({ background: BACKGROUND })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const checkCols = [
    Math.floor(width * 0.3),
    Math.floor(width * 0.5),
    Math.floor(width * 0.7),
  ];

  let headTopY = height;
  for (const x of checkCols) {
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * channels;
      const diff =
        Math.abs(data[i] - BACKGROUND.r) +
        Math.abs(data[i + 1] - BACKGROUND.g) +
        Math.abs(data[i + 2] - BACKGROUND.b);
      if (diff > 35) {
        headTopY = Math.min(headTopY, y);
        break;
      }
    }
  }

  return headTopY / height;
}

export async function applyPixelArt(inputBuffer: Buffer): Promise<Buffer> {
  // Step 1: Pre-process — flatten background, light sharpening and contrast.
  const preprocessed = await sharp(inputBuffer)
    .flatten({ background: BACKGROUND })
    .sharpen({ sigma: 0.8 })
    .linear(1.1, -8)
    .toBuffer();

  // Step 2: Head-aligned crop — find where the head starts, then extract
  // from that point to the bottom of the image so every player's head sits
  // at the same position. NHL headshots are square, so we crop a region
  // starting just above the head and let Sharp's cover+top resize handle
  // the rest without needing to extend with blank padding.
  const headTopFraction = await findHeadTopFraction(preprocessed);
  const cropTopFraction = Math.max(0, headTopFraction - HEAD_TOP_MARGIN);

  const origMeta = await sharp(preprocessed).metadata();
  const origW = origMeta.width!;
  const origH = origMeta.height!;

  const cropTopPx = Math.round(cropTopFraction * origH);
  const availableHeight = origH - cropTopPx;

  const alignedBuffer = await sharp(preprocessed)
    .extract({ left: 0, top: cropTopPx, width: origW, height: availableHeight })
    .toBuffer();

  // Step 3: Downscale the aligned crop to the pixel grid.
  // fit:"cover" + position:"top" keeps the head at the top and fills width.
  const downscaled = await sharp(alignedBuffer)
    .resize(PIXEL_GRID_W, PIXEL_GRID_H, {
      fit: "cover",
      position: "top",
      kernel: "lanczos3",
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: rawPixels, info } = downscaled;
  const { width, height, channels } = info;

  // Step 4: Build palette and apply Floyd-Steinberg dithering.
  const inContainer = imageq.utils.PointContainer.fromUint8Array(
    new Uint8Array(rawPixels),
    width,
    height
  );

  const palette = await imageq.buildPalette([inContainer], {
    colorDistanceFormula: "euclidean",
    paletteQuantization: "neuquant",
    colors: PALETTE_COLORS,
  });

  const outContainer = await imageq.applyPalette(inContainer, palette, {
    colorDistanceFormula: "euclidean",
    imageQuantization: "floyd-steinberg",
  });

  const quantizedPixels = Buffer.from(outContainer.toUint8Array());

  // Step 5: Upscale with nearest-neighbor — hard pixel edges, no blurring
  const pixelArtBuffer = await sharp(quantizedPixels, {
    raw: { width, height, channels: channels as 1 | 2 | 3 | 4 },
  })
    .resize(OUTPUT_W, OUTPUT_H, { kernel: "nearest" })
    .png()
    .toBuffer();

  return pixelArtBuffer;
}
