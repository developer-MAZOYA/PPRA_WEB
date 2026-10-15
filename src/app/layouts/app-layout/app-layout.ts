import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ChatWidget } from '../../features/chat/chat-widget';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
    ChatWidget,
  ],
  template: `
    @if (auth.isAuthenticated()) {
      <div class="app-layout"
           [class.sidebar-collapsed]="!sidebarOpen()"
           [class.dark]="theme.dark()">

        <header class="top-bar">
          <div class="top-left">
            <button mat-icon-button class="menu-toggle"
                    (click)="toggleSidebar()" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
            </button>
            <img src="logo-ppra.png"
                 alt="PPRA" class="top-logo"
                 (error)="onImgError($event)" />
            <span class="top-brand">| AMS</span>
          </div>

          <div class="top-right">
            <button mat-icon-button class="icon-btn hide-on-mobile" aria-label="Notifications">
              <mat-icon>notifications_none</mat-icon>
            </button>

            <button type="button"
                    class="theme-toggle"
                    (click)="theme.toggle()"
                    [attr.aria-label]="theme.dark() ? 'Switch to light mode' : 'Switch to dark mode'"
                    [attr.title]="theme.dark() ? 'Light mode' : 'Dark mode'">
              <mat-icon>{{ theme.dark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <button class="user-chip" [matMenuTriggerFor]="userMenu">
              <div class="user-avatar">{{ initials() }}</div>
              <div class="user-info hide-on-mobile">
                <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
                <span class="user-role">{{ auth.currentUser()?.role }}</span>
              </div>
              <mat-icon class="hide-on-mobile">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="menu-header">
                <strong>{{ auth.currentUser()?.fullName }}</strong>
                <small>{{ auth.currentUser()?.email }}</small>
              </div>
              <button mat-menu-item>
                <mat-icon>person_outline</mat-icon>
                <span>My Profile</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <aside class="sidebar">
          <div class="side-brand">
            <img src="emblem.png"
                 alt="PPRA Emblem" class="side-emblem"
                 (error)="onImgError($event)" />
            <div class="side-brand-text">
              <span class="side-brand-title">PPRA</span>
              <span class="side-brand-sub">Asset Management</span>
            </div>
          </div>

          <nav class="side-nav">
            <a class="side-item" routerLink="/dashboard" routerLinkActive="active"
               (click)="closeSidebarOnMobile()">
              <mat-icon>space_dashboard</mat-icon>
              <span>Dashboard</span>
            </a>

            <a class="side-item" routerLink="/my-assets" routerLinkActive="active"
               (click)="closeSidebarOnMobile()">
              <mat-icon>assignment_ind</mat-icon>
              <span>My Assets</span>
            </a>

            @if (auth.isAdmin()) {
              <mat-divider class="side-divider"></mat-divider>

              <a class="side-item" routerLink="/assets" routerLinkActive="active"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>inventory_2</mat-icon>
                <span>All Assets</span>
              </a>

              <a class="side-item" routerLink="/assets/new" routerLinkActive="active"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>add_circle_outline</mat-icon>
                <span>New Asset</span>
              </a>

              <a class="side-item" routerLink="/users" routerLinkActive="active"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>group</mat-icon>
                <span>Users</span>
              </a>
            }

            <mat-divider class="side-divider"></mat-divider>

            <a class="side-item" routerLink="/profile" routerLinkActive="active"
               (click)="closeSidebarOnMobile()">
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </a>
          </nav>

          <div class="side-footer">
            <span>© 2026 PPRA</span>
          </div>
        </aside>

        <main class="main-area">
          <router-outlet />
        </main>

        @if (auth.isAdmin()) {
          <app-chat-widget></app-chat-widget>
        }

        <div class="mobile-overlay" (click)="closeSidebarOnMobile()"></div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    /* ═══════════ LAYOUT ═══════════ */
    .app-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      grid-template-rows: 68px 1fr;
      grid-template-areas:
        "sidebar topbar"
        "sidebar main";
      height: 100vh;
      width: 100%;
      overflow: hidden;
      transition: grid-template-columns 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                  background-color 0.35s ease;
    }
    .app-layout.sidebar-collapsed {
      grid-template-columns: 0 1fr;
    }
    .app-layout.sidebar-collapsed .sidebar {
      transform: translateX(-100%);
    }

    /* ═══════════ TOP BAR ═══════════ */
    .top-bar {
      grid-area: topbar;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: #FFFFFF;
      border-bottom: 1px solid #E5E7EB;
      height: 68px;
      position: sticky;
      top: 0;
      z-index: 20;
      transition: background-color 0.35s ease, border-color 0.35s ease;
    }

    .top-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .menu-toggle {
      color: #4B5563;
      transition: transform 0.25s ease, background-color 0.15s, color 0.15s;
    }
    .menu-toggle:hover {
      background-color: #FEF9E7;
      transform: rotate(90deg);
    }

    .top-logo {
      height: 36px;
      width: auto;
      max-width: 180px;
      display: block;
      object-fit: contain;
    }

    .top-brand {
      font-weight: 300;
      font-size: 1.25rem;
      color: #1F2937;
      letter-spacing: 0.02em;
      margin-left: 8px;
      transition: color 0.35s ease;
    }

    .top-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      color: #4B5563;
      transition: background-color 0.15s, color 0.15s;
    }
    .icon-btn:hover {
      background-color: #FEF9E7;
      color: #8B6914;
    }

    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      color: #78350F;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 0 4px;
    }
    .theme-toggle:hover {
      background-color: #FEF3C7;
      border-color: #FCD34D;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);
    }
    .theme-toggle mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 6px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.2s ease, background-color 0.35s ease, border-color 0.35s ease;
      font-family: inherit;
    }
    .user-chip:hover {
      background-color: #FFFDF5;
      border-color: #FBEDBB;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(245, 225, 164, 0.4);
    }
    .user-chip mat-icon {
      color: #6B7280;
      font-size: 20px;
      height: 20px;
      width: 20px;
      transition: transform 0.2s, color 0.15s;
    }
    .user-chip:hover mat-icon {
      color: #8B6914;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FBEDBB;
      color: #78350F;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: background-color 0.35s ease, color 0.35s ease;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }
    .user-info .user-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #1F2937;
      transition: color 0.35s ease;
    }
    .user-info .user-role {
      font-size: 0.7rem;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      transition: color 0.35s ease;
    }

    .menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #E5E7EB;
      min-width: 220px;
    }
    .menu-header strong {
      font-size: 0.95rem;
      color: #1F2937;
    }
    .menu-header small {
      color: #6B7280;
      font-size: 0.75rem;
      margin-top: 2px;
    }

    /* ═══════════ SIDEBAR ═══════════ */
    .sidebar {
      grid-area: sidebar;
      background: linear-gradient(180deg, #FDF3D0 0%, #FBEDBB 100%);
      border-right: 1px solid #F5E1A4;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      overflow-x: hidden;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                  background-color 0.35s ease, border-color 0.35s ease;
      z-index: 30;
      position: relative;
    }
    .sidebar::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.4) 0%,
        transparent 40%,
        transparent 100%
      );
      pointer-events: none;
      transition: background-color 0.35s ease;
    }

    .side-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid rgba(139, 105, 20, 0.15);
      position: relative;
      z-index: 1;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.5) 0%,
        rgba(255, 255, 255, 0.15) 100%
      );
      transition: background-color 0.35s ease, border-color 0.35s ease;
    }

    .side-emblem {
      height: 88px;
      width: 88px;
      object-fit: contain;
      flex-shrink: 0;
      border-radius: 10px;
      filter: drop-shadow(0 3px 6px rgba(139, 105, 20, 0.15));
    }

    .side-brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      min-width: 0;
    }

    .side-brand-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #8B6914;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: color 0.35s ease;
    }

    .side-brand-sub {
      font-size: 0.8rem;
      font-weight: 500;
      color: #A8812A;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.9;
      margin-top: 3px;
      transition: color 0.35s ease;
    }

    .side-nav {
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .side-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      text-decoration: none;
      color: #8B6914;
      font-weight: 500;
      font-size: 1rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.35s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .side-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.6),
        transparent
      );
      transition: left 0.5s ease, background-color 0.35s ease;
    }
    .side-item mat-icon {
      font-size: 22px;
      height: 22px;
      width: 22px;
      color: #A8812A;
      transition: color 0.25s, transform 0.25s;
      z-index: 1;
    }
    .side-item span {
      position: relative;
      z-index: 1;
    }
    .side-item:hover {
      background-color: rgba(255, 255, 255, 0.7);
      color: #8B6914;
      transform: translateX(4px);
    }
    .side-item:hover mat-icon {
      color: #8B6914;
      transform: scale(1.1);
    }
    .side-item:hover::before {
      left: 100%;
    }
    .side-item.active {
      background-color: #FFFFFF;
      color: #8B6914;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(139, 105, 20, 0.12);
    }
    .side-item.active mat-icon {
      color: #B8860B;
    }
    .side-item.active::after {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      bottom: 20%;
      width: 4px;
      background: #B8860B;
      border-radius: 0 4px 4px 0;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }

    .side-divider {
      margin: 8px 4px;
      border-top-color: rgba(139, 105, 20, 0.15) !important;
    }

    .side-footer {
      padding: 12px;
      text-align: center;
      color: #8B6914;
      font-size: 0.75rem;
      border-top: 1px solid rgba(139, 105, 20, 0.15);
      font-weight: 500;
      opacity: 0.75;
      transition: color 0.35s ease, border-color 0.35s ease;
    }

    /* ═══════════ MAIN AREA ═══════════ */
    .main-area {
      grid-area: main;
      overflow-y: auto;
      background: #F8F9FA;
      animation: fadeIn 0.3s ease;
      transition: background-color 0.35s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════ MOBILE ═══════════ */
    .mobile-overlay { display: none; }

    @media (max-width: 1023px) {
      .app-layout {
        grid-template-columns: 0 1fr;
        grid-template-areas:
          "topbar topbar"
          "main main";
      }
      .app-layout:not(.sidebar-collapsed) .sidebar {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(139, 105, 20, 0.15);
      }
      .app-layout .sidebar {
        position: fixed;
        top: 68px;
        left: 0;
        bottom: 0;
        width: 320px;
        transform: translateX(-100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 40;
      }
      .mobile-overlay {
        display: block;
        position: fixed;
        inset: 68px 0 0 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 35;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .app-layout:not(.sidebar-collapsed) .mobile-overlay {
        opacity: 1;
        pointer-events: auto;
      }
    }

    @media (max-width: 767px) {
      .top-bar { padding: 0 12px; height: 60px; }
      .top-logo { height: 28px; max-width: 120px; }
      .top-brand { font-size: 1rem; }
      .theme-toggle { width: 36px; height: 36px; }
      .app-layout .sidebar { top: 60px; width: 300px; }
      .mobile-overlay { inset: 60px 0 0 0; }
      .side-nav { padding: 12px 10px; gap: 4px; }
      .side-item { padding: 10px 14px; }
      .hide-on-mobile { display: none !important; }
    }

    @media (min-width: 768px) {
      .hide-on-desktop { display: none !important; }
    }

    /* ══════════════════════════════════════════════════
       DARK MODE
       ══════════════════════════════════════════════════ */
    .app-layout.dark {
      background-color: #15100A;
    }

    .app-layout.dark .top-bar {
      background-color: #1A130D;
      border-bottom-color: rgba(253, 185, 19, 0.15);
    }
    .app-layout.dark .menu-toggle {
      color: #B8A382;
    }
    .app-layout.dark .menu-toggle:hover {
      background-color: rgba(253, 185, 19, 0.12);
      color: #FDB913;
    }
    .app-layout.dark .top-brand {
      color: #FBF6EC;
    }
    .app-layout.dark .icon-btn {
      color: #B8A382;
    }
    .app-layout.dark .icon-btn:hover {
      background-color: rgba(253, 185, 19, 0.12);
      color: #FDB913;
    }
    .app-layout.dark .theme-toggle {
      background-color: #2A1A0F;
      border-color: rgba(253, 185, 19, 0.3);
      color: #FDB913;
    }
    .app-layout.dark .theme-toggle:hover {
      background-color: #3B2413;
      border-color: #FDB913;
      box-shadow: 0 4px 16px rgba(253, 185, 19, 0.35);
    }
    .app-layout.dark .user-chip {
      background-color: #221709;
      border-color: rgba(253, 185, 19, 0.2);
    }
    .app-layout.dark .user-chip:hover {
      background-color: #2A1A0F;
      border-color: rgba(253, 185, 19, 0.45);
      box-shadow: 0 2px 12px rgba(253, 185, 19, 0.15);
    }
    .app-layout.dark .user-chip mat-icon {
      color: #B8A382;
    }
    .app-layout.dark .user-chip:hover mat-icon {
      color: #FDB913;
    }
    .app-layout.dark .user-avatar {
      background-color: rgba(253, 185, 19, 0.2);
      color: #FDB913;
    }
    .app-layout.dark .user-info .user-name {
      color: #FBF6EC;
    }
    .app-layout.dark .user-info .user-role {
      color: #8A7A62;
    }

    .app-layout.dark .sidebar {
      background: linear-gradient(180deg, #221709 0%, #1A130D 100%);
      border-right-color: rgba(253, 185, 19, 0.15);
    }
    .app-layout.dark .sidebar::before {
      background: linear-gradient(
        135deg,
        rgba(253, 185, 19, 0.06) 0%,
        transparent 40%,
        transparent 100%
      );
    }
    .app-layout.dark .side-brand {
      border-bottom-color: rgba(253, 185, 19, 0.15);
      background: linear-gradient(
        180deg,
        rgba(253, 185, 19, 0.06) 0%,
        rgba(253, 185, 19, 0.02) 100%
      );
    }
    .app-layout.dark .side-brand-title {
      color: #FDB913;
    }
    .app-layout.dark .side-brand-sub {
      color: #B8A382;
    }
    .app-layout.dark .side-item {
      color: #B8A382;
    }
    .app-layout.dark .side-item::before {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(253, 185, 19, 0.15),
        transparent
      );
    }
    .app-layout.dark .side-item mat-icon {
      color: #B8A382;
    }
    .app-layout.dark .side-item:hover {
      background-color: rgba(253, 185, 19, 0.08);
      color: #FDB913;
    }
    .app-layout.dark .side-item:hover mat-icon {
      color: #FDB913;
    }
    .app-layout.dark .side-item.active {
      background-color: rgba(253, 185, 19, 0.12);
      color: #FDB913;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .app-layout.dark .side-item.active mat-icon {
      color: #FDB913;
    }
    .app-layout.dark .side-item.active::after {
      background-color: #FDB913;
    }
    .app-layout.dark .side-divider {
      border-top-color: rgba(253, 185, 19, 0.15) !important;
    }
    .app-layout.dark .side-footer {
      color: #8A7A62;
      border-top-color: rgba(253, 185, 19, 0.15);
    }

    .app-layout.dark .main-area {
      background-color: #15100A;
    }

    .app-layout.dark .mobile-overlay {
      background-color: rgba(0, 0, 0, 0.6);
    }
  `],
})
export class AppLayout {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private router = inject(Router);

  readonly sidebarOpen = signal(true);

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 1024) this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }

  onImgError(event: Event): void {
    const el = event.target as HTMLImageElement;
    el.style.display = 'none';
  }
}