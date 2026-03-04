import { HierarchicalNSW } from 'hnswlib-node';
import * as path from 'path';
import * as fs from 'fs';
import distance from 'sharp-phash/distance';

// Interface for storing metadata associated with each vector
export interface ClipMetadata {
  videoId: string;
  timestamp: number; // Start timestamp of the 5-second clip
  keyframePath: string; // Path to the extracted keyframe image
  perceptualHash: string;
}

export interface SimilarityResult {
  videoId: string;
  timestamp: number;
  keyframePath: string;
  similarityScore: number; // A normalized score (e.g., 0-100)
}

class VisualSimilarityIndex {
  private index: HierarchicalNSW;
  private metadata: ClipMetadata[] = [];
  private dim: number = 64; // Perceptual hash length from sharp-phash is typically 64 bits

  /**
   * Initializes the HNSW index.
   * @param maxElements - The maximum number of elements the index is expected to hold.
   * @param m - Number of neighbors in a search graph.
   * @param efConstruction - Parameter for controlling the speed/accuracy tradeoff during index construction.
   */
  public async init(maxElements: number = 100000, m: number = 16, efConstruction: number = 200): Promise<void> {
    this.index = new HierarchicalNSW('l2', this.dim); // 'l2' for Euclidean distance, suitable for hash distances too
    this.index.initIndex(maxElements, m, efConstruction);
    console.log('HNSW index initialized.');
  }

  /**
   * Adds a perceptual hash (feature vector) and its metadata to the index.
   * @param hash - The perceptual hash as a bigint (from sharp-phash, which returns a bigint).
   * @param metadata - The ClipMetadata associated with this hash.
   */
  public addClip(hash: bigint, metadata: ClipMetadata): void {
    const vector = this.hashToVector(hash); // Convert bigint hash to a number array (vector)
    const id = this.metadata.length;
    this.index.addPoint(vector, id);
    this.metadata.push(metadata);
  }

  /**
   * Queries the index for similar clips.
   * @param queryHash - The perceptual hash of the clip to query for.
   * @param numResults - The number of similar results to return.
   * @param minSimilarity - Optional minimum similarity score (0-100) to filter results.
   * @param ef - Parameter for controlling the speed/accuracy tradeoff during search.
   * @returns Promise<SimilarityResult[]> - An array of similar clips with their metadata and similarity score.
   */
  public querySimilar(queryHash: bigint, numResults: number = 10, minSimilarity: number = 0, ef: number = 50): SimilarityResult[] {
    if (!this.index) {
      throw new Error('HNSW index not initialized.');
    }

    const queryVector = this.hashToVector(queryHash);
    this.index.setEf(ef);
    const results = this.index.searchKnn(queryVector, numResults);

    return results.neighbors.map((neighborId: number) => {
      const neighborMetadata = this.metadata[neighborId];
      // Calculate Hamming distance directly using sharp-phash's distance utility
      const storedVector = this.index.getPoint(neighborId);
      const storedHash = this.vectorToHash(storedVector);
      const hammingDistance = distance(queryHash.toString(), storedHash.toString());

      // Convert Hamming distance to a similarity score (e.g., 0-100)
      // Max Hamming distance for 64-bit hash is 64
      const similarityScore = Math.round(((this.dim - hammingDistance) / this.dim) * 100);

      return {
        ...neighborMetadata,
        similarityScore: similarityScore,
      };
    }).filter(result => result.similarityScore >= minSimilarity);
  }

  /**
   * Converts a bigint perceptual hash into a number array (vector) for HNSW.
   * HNSW works with Float32Array or number[], not BigInt directly.
   * Each bit of the hash can be represented as a dimension in a binary vector.
   * @param hash - The bigint perceptual hash.
   * @returns number[] - A binary vector representation of the hash.
   */
  private hashToVector(hash: bigint): number[] {
    const vector: number[] = new Array(this.dim);
    for (let i = 0; i < this.dim; i++) {
      vector[i] = Number((hash >> BigInt(i)) & BigInt(1));
    }
    return vector;
  }

  /**
   * Converts a number array (vector) back to a bigint perceptual hash.
   * @param vector - A binary vector representation of the hash.
   * @returns bigint - The perceptual hash as a bigint.
   */
  private vectorToHash(vector: number[]): bigint {
    let hash: bigint = BigInt(0);
    for (let i = 0; i < this.dim; i++) {
      if (vector[i] === 1) {
        hash |= (BigInt(1) << BigInt(i));
      }
    }
    return hash;
  }

  // --- Persistence Placeholder ---
  /**
   * Saves the current index and metadata to disk.
   * @param indexPath - Path to save the HNSW index file.
   * @param metadataPath - Path to save the metadata JSON file.
   */
  public async save(indexPath: string, metadataPath: string): Promise<void> {
    if (this.index) {
      await this.index.writeIndex(indexPath);
      fs.writeFileSync(metadataPath, JSON.stringify(this.metadata));
      console.log('HNSW index and metadata saved.');
    }
  }

  /**
   * Loads the index and metadata from disk.
   * @param indexPath - Path to load the HNSW index file from.
   * @param metadataPath - Path to load the metadata JSON file from.
   */
  public async load(indexPath: string, metadataPath: string): Promise<void> {
    if (fs.existsSync(indexPath) && fs.existsSync(metadataPath)) {
      this.index = new HierarchicalNSW('l2', this.dim);
      this.index.readIndex(indexPath);
      this.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log('HNSW index and metadata loaded.');
    } else {
      console.log('No existing index found, initializing a new one.');
      await this.init(); // Initialize if not found
    }
  }

  public getMetadata(): ClipMetadata[] {
    return this.metadata;
  }

  /**
   * Clears the index and metadata.
   */
  public async clear(): Promise<void> {
    this.metadata = [];
    await this.init(); // Re-initialize a fresh index
    console.log('HNSW index and metadata cleared.');
  }
}

export const visualSimilarityIndex = new VisualSimilarityIndex();
