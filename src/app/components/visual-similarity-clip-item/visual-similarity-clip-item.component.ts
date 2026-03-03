import { ChangeDetectorRef } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { FilePathService } from '../views/file-path.service';

import type { ImageClipElement } from '../../../../interfaces/final-object.interface';
import type { RightClickEmit, VideoClickEmit } from '../../../../interfaces/shared-interfaces';

import { metaAppear, textAppear } from '../../common/animations';

@Component({
  selector: 'app-visual-similarity-clip-item',
  templateUrl: './visual-similarity-clip-item.component.html',
  styleUrls: [
      '../../common/scss/clip-and-preview.scss',
      '../../common/scss/time-and-rez.scss',
      '../views/clip/clip.component.scss', // Using original clip styles
      '../../common/scss/selected.scss'
    ],
  animations: [ textAppear,
                metaAppear ]
})
export class VisualSimilarityClipItemComponent implements OnInit {

  @Output() rightClick = new EventEmitter<RightClickEmit>();
  @Output() sheetClick = new EventEmitter<any>();
  @Output() videoClick = new EventEmitter<VideoClickEmit>();

  @Input() clip: ImageClipElement;

  @Input() autoplay: boolean;
  @Input() compactView: boolean;
  @Input() darkMode: boolean;
  @Input() elHeight: number;
  @Input() elWidth: number;
  @Input() folderPath: string;
  @Input() forceMute: boolean;
  @Input() defaultThumbnailMode: boolean;
  @Input() returnToFirstScreenshot: boolean;
  @Input() hubName: string;
  @Input() imgHeight: number;
  @Input() largerFont: boolean;
  @Input() showMeta: boolean;

  appInFocus = true;
  folderPosterPaths: string[] = [];
  folderThumbPaths: string[] = [];
  hover: boolean;
  noError = true;
  pathToVideo = '';
  poster: string;
  posterFolderType: any = 'clips';

  constructor(
    public filePathService: FilePathService,
    public sanitizer: DomSanitizer,
    public cd: ChangeDetectorRef
  ) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.hover = true;
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.hover = false;
  }
  @HostListener('window:blur', ['$event'])
  onBlur(event: any): void {
    this.appInFocus = false;
  }
  @HostListener('window:focus', ['$event'])
  onFocus(event: any): void {
    this.appInFocus = true;
  }

  stopPreview(event): any {
    if (this.defaultThumbnailMode && this.returnToFirstScreenshot) {
      event.target.load();
    } else {
      event.target.pause();
    }
  }

  ngOnInit() {

    if (this.defaultThumbnailMode) {
      this.posterFolderType = 'thumbnails';
    }

    if (this.clip.keyframePath) {
      this.poster = this.clip.keyframePath;
      this.pathToVideo = this.clip.keyframePath;
      this.folderThumbPaths.push(this.pathToVideo);
      this.folderPosterPaths.push(this.poster);
    } else {
      if (this.clip.hash.indexOf(':') !== -1) {
        const hashes = this.clip.hash.split(':');

        hashes.slice(0, 4).forEach((hash) => {
          this.folderThumbPaths.push( this.filePathService.createFilePath(this.folderPath, this.hubName, 'clips', hash, true));
          this.folderPosterPaths.push(this.filePathService.createFilePath(this.folderPath, this.hubName, this.posterFolderType, hash));
        });
      } else {
        if (this.clip.hash === undefined) {
          this.noError = false;
        }
        this.pathToVideo = this.filePathService.createFilePath(this.folderPath, this.hubName, 'clips', this.clip.hash, true);
        this.poster =      this.filePathService.createFilePath(this.folderPath, this.hubName, this.posterFolderType, this.clip.hash);

        this.folderThumbPaths.push(this.pathToVideo);
        this.folderPosterPaths.push(this.poster);
      }
    }
  }

  handleClick(event): void {
    const videoClickEmit: VideoClickEmit = {
      mouseEvent: event,
      clipTimestamp: this.clip.clipTimestamp,
      originalVideoHash: this.clip.hash,
    };
    this.videoClick.emit(videoClickEmit);
  }

}
