import type { AppStateInterface } from '../src/app/common/app-state';
import type { CustomShortcutAction } from '../src/app/components/shortcuts/shortcuts.service';
import type { SettingsButtonKey } from '../src/app/common/settings-buttons';
import type { HistoryItem } from './shared-interfaces';
import type { WizardOptions } from './wizard-options.interface';

export interface SettingsButtonSavedProperties {
  hidden: boolean;
  toggled: boolean;
}

export interface SettingsObject {
  appState: AppStateInterface;
  buttonSettings: Record<SettingsButtonKey, SettingsButtonSavedProperties>;
  remoteSettings: RemoteSettings;
  shortcuts: Map<string, SettingsButtonKey | CustomShortcutAction>;
  vhaFileHistory: HistoryItem[];
  wizardOptions: WizardOptions;
  // New settings for visual similarity
  visualSimilarityThreshold: number; // 0-64 for Hamming distance, or 0-100 for percentage similarity
  visualSimilarityNumberResults: number; // e.g., 10 results
}

export interface RemoteSettings {
  compactView: boolean;
  darkMode: boolean;
  imgsPerRow: number;
  largerText: boolean;
}
