import type { ImageElement } from './final-object.interface';

// Identical to settings buttons
export type SupportedView = 'showThumbnails'
                          | 'showFilmstrip'
                          | 'showFullView'
                          | 'showDetails'
                          | 'showDetails2'
                          | 'showFiles'
                          | 'showClips';

export const AllSupportedViews: SupportedView[] = [
                            'showThumbnails',
                            'showFilmstrip',
                            'showFullView',
                            'showDetails',
                            'showDetails2',
                            'showFiles',
                            'showClips',
];

export type SupportedTrayView = 'showDetailsTray'
                              | 'showFreq'
                              | 'showRecentlyPlayed'
                              | 'showRelatedVideosTray'
                              | 'showTagTray';

export const AllSupportedBottomTrayViews: SupportedTrayView[] = [
                                'showDetailsTray',
                                'showFreq',
                                'showRecentlyPlayed',
                                'showRelatedVideosTray',
                                'showTagTray',
];

// Mouse click events
export interface VideoClickEmit {
  mouseEvent: MouseEvent;
  thumbIndex?: number;
  doubleClick?: boolean;
  clipTimestamp?: number; // Added for visual similarity clips
  originalVideoHash?: string; // Added for visual similarity clips
}

export interface RightClickEmit {
  mouseEvent: Event;
  item: ImageElement;
}

// Tags stuffs
export interface Tag {
  name: string;
  colour: string;
  removable: boolean;
}

export interface TagEmit {
  tag: Tag;
  event: Event;
}

export interface TagEmission {
  index: number;
  tag: string;
  type: 'add' | 'remove';
}

export interface HistoryItem {
  vhaFilePath: string;
  hubName: string;
}

export interface RenameFileResponse {
  index: number;
  success: boolean;
  renameTo: string;
  oldFileName: string;
  errMsg?: string;
}

export interface RemoteVideoClick {
  video: ImageElement;
  thumbIndex?: number;
}

export interface VisualSimilaritySearchRequest {
  videoId: string; // The ID of the video from which the clip was selected
  clipTimestamp: number; // The start timestamp of the 5-second clip
}

export interface VisualSimilarityClipResult {
  videoId: string; // The ID of the similar video
  clipTimestamp: number; // The start timestamp of the similar 5-second clip
  similarityScore: number; // The similarity score (e.g., 0-100)
  keyframePath: string; // Path to the keyframe for display
}

export interface VisualSimilaritySearchResponse {
  results: VisualSimilarityClipResult[];
  error?: string;
}

