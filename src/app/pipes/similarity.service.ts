import { Injectable } from '@angular/core';
import { ElectronService } from '../providers/electron.service'; // Import ElectronService
import { ImageElementService } from '../services/image-element.service'; // Import ImageElementService
import {
  VisualSimilaritySearchRequest,
  VisualSimilaritySearchResponse
} from './../../../interfaces/shared-interfaces'; // Import IPC interfaces

@Injectable()
export class SimilarityService {

  // map from index of element in array to num of elements in common with chosen file
  similarityMap: Map<number, number> = new Map();

  fileNameElements: string[]; // array of words in the original file name

  constructor(
    private electronService: ElectronService, // Inject ElectronService
    private imageElementService: ImageElementService // Inject ImageElementService
  ) {
    // Set up IPC listener for visual similarity search results
    this.electronService.ipcRenderer.on('visual-similarity-clips-results', (event, response: VisualSimilaritySearchResponse) => {
      if (response.error) {
        console.error('Visual similarity search error:', response.error);
        // TODO: Display error to user via a notification service
      } else {
        this.imageElementService.setSimilarVideoClipElements(response.results);
      }
    });
  }

  /**
   * Resets the map to empty and sets the new filename to compare to
   */
  public restartWith(filename: string): void {
    // lowercase everything, remove `the`, ` - `, and trim space if `the` was the first word
    const cleanedFileName = filename.toLowerCase().replace(/the /g, ' ').replace(/ - /g, ' ').trim();
    this.fileNameElements = cleanedFileName.split(' ');
    this.similarityMap = new Map();
  }

  /**
   * Return how many words this filename has in common with original file (`fileNameElements`)
   * @param filename filename to compare to `fileNameElements`
   */
  public numInCommon(filename: string): number {
    const fileElements: string[] = filename.toLowerCase().split(' ');
    let numSimilar = 0;

    this.fileNameElements.forEach((element) => {
      if (fileElements.includes(element)) {
        numSimilar++;
      }
    });

    return numSimilar;
  }

  /**
   * Update map with {index => number of elements in common} pair for every new file
   * @param index     index within original array
   * @param filename  filename of file to compare to current filename
   */
  public processThisWord(index: number, filename: string): void {
    this.similarityMap.set(index, this.numInCommon(filename));
  }

  /**
   * Finds filename with greatest number of similar words
   * removes it from the map,
   * and returns its index
   */
  private getMostCommon(): number {
    let currNumSimilar = 0;
    let currBestMatch = 0;

    this.similarityMap.forEach((value, key) => {
      if (value > currNumSimilar) {
        currNumSimilar = value;
        currBestMatch = key;
      }
    });

    this.similarityMap.delete(currBestMatch);

    if (currNumSimilar > 1) {
      return currBestMatch;
    } else {
      return null;
    }

  }

  /**
   * Return in order from largest to fewest number of elements in common
   * must have 2 or more similar words to be returned
   * maximum of 25 returned
   */
  public getIndexesBySimilarity(): number[] {

    let stillSimilarFound = true;
    let tempIndex = 0;
    const finalResult = []; // array of objects

    while (stillSimilarFound) {
      const currMostCommon = this.getMostCommon();

      if (currMostCommon !== null) {
        finalResult[tempIndex] = currMostCommon;
        tempIndex++;
      } else {
        stillSimilarFound = false;
      }

      if (tempIndex > 24) { // HARD CODED 25 limit
        stillSimilarFound = false; // end the while loop
      }
    }

    return finalResult;
  }

  /**
   * Sends an IPC request to the Electron main process to find visually similar clips.
   * Results will be returned via the 'visual-similarity-clips-results' IPC channel.
   * @param videoId - The ID (hash) of the video from which the clip was selected.
   * @param clipTimestamp - The start timestamp of the 5-second clip to find similarities for.
   */
  public findVisualSimilarClips(videoId: string, clipTimestamp: number): void {
    const request: VisualSimilaritySearchRequest = { videoId, clipTimestamp };
    this.electronService.ipcRenderer.send('visual-similarity-search-clips', request);
  }

}
