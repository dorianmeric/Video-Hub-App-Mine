import phash from 'sharp-phash';
const sharp = require('sharp');
import * as fs from 'fs';

// Disable sharp's cache to prevent file locking issues on Windows
// This should help with "EPERM" errors when trying to delete temporary keyframes
sharp.cache(false);

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

    // Sometimes sharp can fail if the file is still being locked or written
    // sharp-phash can take a file path directly and handles the sharp processing internally
    try {
      const fileContent = fs.readFileSync(imagePath); // Attempt to read the file to ensure it's not locked or in use
      const hash = await phash(fileContent);
      return hash;
    } catch (innerError) {
      // Retry once after a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const fileContent = fs.readFileSync(imagePath);
      const hash = await phash(fileContent);
      return hash;
    }
  } catch (error) {
    console.error(`Error generating perceptual hash for ${imagePath}:`, error);
    return null;
  }
}
