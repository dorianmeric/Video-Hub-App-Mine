import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Dynamically load ffmpeg-static and ffprobe-installer/ffprobe
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
const ffprobePath = require('@ffprobe-installer/ffprobe').path.replace('app.asar', 'app.asar.unpacked');

/**
 * Get video duration using FFprobe.
 * @param filePath - path to video file
 * @returns Promise<number> - video duration in seconds
 */
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const command = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    exec(command, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(parseFloat(stdout.trim()));
      }
    });
  });
}

/**
 * Extract a single frame at a specific timestamp.
 * @param pathToVideo - path to video file
 * @param timestamp - time in seconds to extract the frame
 * @param savePath - output path for the frame (e.g., '/tmp/frame_10s.jpg')
 * @param height - desired height for the frame
 * @returns Promise<boolean> - true if extraction was successful
 */
export function extractFrameAtTimestamp(
  pathToVideo: string,
  timestamp: number,
  savePath: string,
  height: number = 360
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const width = Math.floor(height * (16 / 9)); // Assuming 16:9 aspect ratio

    // Create directory if it doesn't exist
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const args = [
      '-ss', timestamp.toString(),
      '-i', pathToVideo,
      '-frames:v', '1',
      '-q:v', '2', // Quality (2 = high)
      '-vf', `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`,
      '-y',  // overwrite output if exists
      savePath
    ];

    const ffmpegProcess = spawn(ffmpegPath, args);

    const timeoutId = setTimeout(() => {
      if (!ffmpegProcess.killed) {
        console.warn(`FFmpeg extraction timed out for ${pathToVideo} at ${timestamp}s. Killing process...`);
        ffmpegProcess.kill('SIGKILL');
        resolve(false);
      }
    }, 15000); // 15 seconds timeout per frame

    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve(code === 0);
    });

    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      console.error('FFmpeg error:', err);
      reject(err);
    });
  });
}

/**
 * Extracts keyframes from a video at specified intervals (e.g., every 5 seconds).
 * @param pathToVideo - full path to the video file
 * @param outputDir - directory to save the extracted keyframes
 * @param intervalSeconds - interval in seconds for keyframe extraction (default: 5)
 * @param frameHeight - desired height for the extracted frames (default: 360)
 * @returns Promise<{timestamp: number, path: string}[]> - Array of objects with timestamp and path to extracted frame
 */
export async function extractKeyframesForVisualSimilarity(
  pathToVideo: string,
  outputDir: string,
  intervalSeconds: number = 5,
  frameHeight: number = 360
): Promise<{timestamp: number, path: string}[]> {
  try {
    const duration = await getVideoDuration(pathToVideo);
    const keyframes: {timestamp: number, path: string}[] = [];

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoFileName = path.basename(pathToVideo);

    for (let timestamp = 0; timestamp < duration; timestamp += intervalSeconds) {
      const outputPath = path.join(outputDir, `${videoFileName}_${Math.floor(timestamp)}s.jpg`);
      const success = await extractFrameAtTimestamp(pathToVideo, timestamp, outputPath, frameHeight);

      if (success) {
        keyframes.push({ timestamp, path: outputPath });
      }
    }
    return keyframes;
  } catch (error) {
    console.error('Error extracting keyframes:', error);
    return [];
  }
}
