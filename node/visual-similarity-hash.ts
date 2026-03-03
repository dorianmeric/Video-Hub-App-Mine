import * as sharp from 'sharp';
import phash from 'sharp-phash';

/**
 * Generates a perceptual hash for a given image file.
 * @param imagePath - The full path to the image file.
 * @returns Promise<string> - The perceptual hash as a string.
 */
export async function generatePerceptualHash(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await sharp(imagePath).raw().toBuffer();
    // phash expects the buffer directly, not the sharp instance
    const hash = await phash(imageBuffer);
    return hash;
  } catch (error) {
    console.error(`Error generating perceptual hash for ${imagePath}:`, error);
    throw error;
  }
}
