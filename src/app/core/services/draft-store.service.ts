import { Injectable, signal } from '@angular/core';
import { AssetDraft } from './import.service';

const KEY = 'ppra_ams_draft_rows';

@Injectable({ providedIn: 'root' })
export class DraftStoreService {

  readonly rows = signal<AssetDraft[]>(this.readFromStorage());

  set(rows: AssetDraft[]) {
    this.rows.set(rows);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(rows));
    } catch { /* ignore */ }
  }

  clear() {
    this.rows.set([]);
    sessionStorage.removeItem(KEY);
  }

  private readFromStorage(): AssetDraft[] {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}