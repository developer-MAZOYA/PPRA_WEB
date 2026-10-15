import { Injectable, signal, effect } from '@angular/core';

const THEME_KEY = 'ppra.theme';

/**
 * Global theme service — single source of truth for light/dark mode.
 * - Persists to localStorage under `ppra.theme`
 * - Applies `.ppra-dark` class on <html> so global CSS can react
 * - Syncs across browser tabs via the `storage` event
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal<boolean>(this.readInitial());

  constructor() {
    // React to signal changes: sync the <html> class + localStorage
    effect(() => {
      const isDark = this.dark();
      document.documentElement.classList.toggle('ppra-dark', isDark);
      try {
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
      } catch { /* ignore quota errors */ }
    });

    // Sync across browser tabs
    window.addEventListener('storage', (e) => {
      if (e.key === THEME_KEY && e.newValue) {
        const isDark = e.newValue === 'dark';
        this.dark.set(isDark);
        document.documentElement.classList.toggle('ppra-dark', isDark);
      }
    });
  }

  toggle(): void {
    this.dark.update(v => !v);
  }

  set(isDark: boolean): void {
    this.dark.set(isDark);
  }

  private readInitial(): boolean {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return typeof matchMedia !== 'undefined' &&
             matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }
}