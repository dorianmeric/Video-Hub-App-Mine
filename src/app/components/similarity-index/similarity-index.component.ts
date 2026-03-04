import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { FilePathService } from '../views/file-path.service';
import { VisualSimilarityIndexResult } from '../../../../interfaces/shared-interfaces';

@Component({
  standalone: false,
  selector: 'app-similarity-index',
  templateUrl: './similarity-index.component.html',
  styleUrls: ['./similarity-index.component.scss']
})
export class SimilarityIndexComponent implements OnInit {

  @Input() darkMode: boolean;
  @Input() folderPath: string;
  @Input() hubName: string;

  indexEntries: VisualSimilarityIndexResult[] = [];

  rebuilding = false;
  rebuildProgress = 0;
  rebuildTotal = 0;
  rebuildCurrentFile = '';

  constructor(
    private electronService: ElectronService,
    private filePathService: FilePathService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.electronService.ipcRenderer.on('visual-similarity-index-returning', (event, entries: VisualSimilarityIndexResult[]) => {
      this.indexEntries = entries;
      this.cd.detectChanges();
    });

    this.electronService.ipcRenderer.on('visual-similarity-rebuild-progress', (event, data) => {
      this.rebuilding = true;
      this.rebuildProgress = data.current;
      this.rebuildTotal = data.total;
      this.rebuildCurrentFile = data.fileName;
      this.cd.detectChanges();
    });

    this.electronService.ipcRenderer.on('visual-similarity-rebuild-complete', () => {
      this.rebuilding = false;
      this.cd.detectChanges();
    });

    this.electronService.ipcRenderer.send('get-visual-similarity-index');
  }

  rebuildIndex(): void {
    this.rebuilding = true;
    this.electronService.ipcRenderer.send('rebuild-visual-similarity-index');
  }

  getThumbPath(entry: VisualSimilarityIndexResult): string {
    return entry.keyframePath;
  }
}
