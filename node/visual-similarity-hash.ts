import sharp from 'sharp';
import phash from 'sharp-phash';
import * as fs from 'fs';

/**
 * Generates a perceptual hash for a given image file.
 * @param imagePath - The full path to the image file.
 * @returns Promise<string | null> - The perceptual hash as a string, or null if it fails.
 */
export async function generatePerceptualHash(imagePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      console.warn(`Image file does not exist: ${imagePath}`);
      return null;
    }
    const stats = fs.statSync(imagePath);
    if (stats.size === 0) {
      console.warn(`Image file is empty: ${imagePath}`);
      return null;
    }
    const imageBuffer = await sharp(imagePath).raw().toBuffer();
    // phash expects the buffer directly, not the sharp instance
    const hash = await phash(imageBuffer);
    return hash;
  } catch (error) {
    console.error(`Error generating perceptual hash for ${imagePath}:`, error);
    return null;
  }
}
