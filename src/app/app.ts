import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ChatWidget } from './features/chat/chat-widget';
import { LanguageService, AppLanguage } from './core/i18n/language.service';
import { TranslateContentDirective } from './core/i18n/translate-content.directive';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    ChatWidget,                       
    TranslateContentDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
  readonly sidebarOpen = signal(true);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  setLanguage(value: AppLanguage) { this.language.setLanguage(value); }

  closeSidebarOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }

  logout() {
    this.auth.logout();
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
