import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AssetService } from '../../../../core/services/asset.service';
import { GraphqlService } from '../../../../core/services/graphql.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Asset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page" [class.dark]="theme.dark()">

      <!-- ═══════════ HERO BANNER ═══════════ -->
      <section class="hero-banner">
        <div class="hero-content">
          <div class="hero-text">
            <div class="hero-kicker"><span class="hero-kicker-dot"></span> ASSET MANAGEMENT <span>•</span> OVERVIEW</div>
            <h1>Welcome back, {{ firstName() }}</h1>
            <p>
              {{ auth.isAdmin()
                ? 'Manage assets across the organization — assign, track, and report.'
                : 'Here is everything assigned to you.' }}
            </p>
            <div class="hero-actions">
              @if (auth.isAdmin()) {
                <button mat-flat-button class="btn-hero-primary" routerLink="/assets/new">
                  <mat-icon>add</mat-icon> Register New Asset
                </button>
                <button mat-stroked-button class="btn-hero-outline" routerLink="/assets">
                  <mat-icon>list</mat-icon> View All Assets
                </button>
              } @else {
                <button mat-flat-button class="btn-hero-primary" routerLink="/my-assets">
                  <mat-icon>assignment_ind</mat-icon> My Assigned Assets
                </button>
              }
            </div>
          </div>

          <div class="hero-illustration">
            <div class="hero-badge">
              <div class="hero-badge-icon">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <span class="hero-badge-label">Total Assets</span>
              <span class="hero-badge-value">{{ total() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════ STAT CARDS ═══════════ -->
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon blue"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-body">
            <div class="stat-label">Total Assets</div>
            <div class="stat-value">{{ total() }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green"><mat-icon>check_circle</mat-icon></div>
          <div class="stat-body">
            <div class="stat-label">Available</div>
            <div class="stat-value">{{ available() }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon indigo"><mat-icon>assignment_ind</mat-icon></div>
          <div class="stat-body">
            <div class="stat-label">Assigned</div>
            <div class="stat-value">{{ assigned() }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon red"><mat-icon>report_gmailerrorred</mat-icon></div>
          <div class="stat-body">
            <div class="stat-label">Lost / Stolen / Retired</div>
            <div class="stat-value">{{ lost() }}</div>
          </div>
        </div>
      </section>

      <!-- ═══════════ QUICK ACTIONS ═══════════ -->
      <section class="section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="action-grid">
          <a class="action-card" routerLink="/my-assets">
            <div class="action-icon indigo"><mat-icon>assignment_ind</mat-icon></div>
            <div class="action-body">
              <span class="action-title">My Assets</span>
              <span class="action-desc">See items currently assigned to you</span>
            </div>
            <mat-icon class="action-arrow">arrow_forward</mat-icon>
          </a>

          <a class="action-card" routerLink="/assets">
            <div class="action-icon blue"><mat-icon>list_alt</mat-icon></div>
            <div class="action-body">
              <span class="action-title">Assets List</span>
              <span class="action-desc">
                {{ auth.isAdmin()
                  ? 'Browse and manage all registered assets'
                  : 'View all assets in the organization' }}
              </span>
            </div>
            <mat-icon class="action-arrow">arrow_forward</mat-icon>
          </a>

          @if (auth.isAdmin()) {
            <a class="action-card" routerLink="/assets">
              <div class="action-icon yellow"><mat-icon>assignment_turned_in</mat-icon></div>
              <div class="action-body">
                <span class="action-title">Assign Asset</span>
                <span class="action-desc">Hand out an asset to a user</span>
              </div>
              <mat-icon class="action-arrow">arrow_forward</mat-icon>
            </a>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    /* ═══════════ PAGE WRAPPER ═══════════ */
    .page {
      padding: 24px 32px 40px;
      max-width: 1400px;
      margin: 0 auto;
      color: #1F2937;
      transition: background 0.35s ease, color 0.35s ease,
                  max-width 0.35s ease, margin 0.35s ease;
    }

    /* ═══════════ HERO ═══════════ */
    .hero-banner {
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%);
      border: 1px solid #FCD34D;
      border-radius: 16px;
      padding: 32px 36px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      transition: background 0.35s ease, border-color 0.35s ease;
    }
    .hero-banner::before {
      content: '';
      position: absolute;
      right: -80px;
      top: -80px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-banner::after {
      content: '';
      position: absolute;
      right: 120px;
      bottom: -100px;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 32px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .hero-text h1 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #78350F;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
      line-height: 1.15;
      transition: color 0.35s ease;
    }

    .hero-text p {
      font-size: 1rem;
      color: #92400E;
      margin: 0 0 20px;
      max-width: 520px;
      line-height: 1.5;
      transition: color 0.35s ease;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero-actions button {
      height: 44px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0 20px;
    }

    .btn-hero-primary {
      background: #78350F !important;
      color: #FFFFFF !important;
    }
    .btn-hero-primary:hover {
      background: #92400E !important;
    }
    .btn-hero-primary mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-right: 6px;
    }

    .btn-hero-outline {
      border-color: #78350F !important;
      color: #78350F !important;
    }
    .btn-hero-outline:hover {
      background: rgba(120, 53, 15, 0.06) !important;
    }
    .btn-hero-outline mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-right: 6px;
    }

    .hero-illustration {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: #FFFFFF;
      border-radius: 20px;
      padding: 22px 30px 20px;
      box-shadow: 0 12px 40px rgba(120, 53, 15, 0.18);
      border: 1px solid rgba(251, 191, 36, 0.5);
      min-width: 170px;
      transition: transform 0.25s ease, box-shadow 0.25s ease,
                  background 0.35s ease, border-color 0.35s ease;
    }
    .hero-badge:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 48px rgba(120, 53, 15, 0.22);
    }

    .hero-badge-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      display: grid;
      place-items: center;
      margin-bottom: 8px;
      transition: background 0.35s ease;
    }
    .hero-badge-icon mat-icon {
      font-size: 30px;
      height: 30px;
      width: 30px;
      color: #D97706;
      transition: color 0.35s ease;
    }

    .hero-badge-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #92400E;
      font-weight: 700;
      transition: color 0.35s ease;
    }

    .hero-badge-value {
      font-size: 2.4rem;
      font-weight: 800;
      color: #78350F;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      transition: color 0.35s ease;
    }

    /* ═══════════ STATS ═══════════ */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  background 0.35s ease, border-color 0.35s ease;
    }
    .stat-card:hover {
      border-color: #FCD34D;
      box-shadow: 0 8px 24px rgba(251, 191, 36, 0.18);
      transform: translateY(-3px);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background 0.35s ease, color 0.35s ease;
    }
    .stat-icon mat-icon {
      font-size: 26px;
      height: 26px;
      width: 26px;
    }
    .stat-icon.blue   { background: #EFF6FF; color: #0066CC; }
    .stat-icon.green  { background: #F0FDF4; color: #16A34A; }
    .stat-icon.indigo { background: #EEF2FF; color: #4F46E5; }
    .stat-icon.red    { background: #FEF2F2; color: #DC2626; }
    .stat-icon.yellow { background: #FEF3C7; color: #D97706; }

    .stat-body { flex: 1; min-width: 0; }

    .stat-label {
      font-size: 0.72rem;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 4px;
      line-height: 1.2;
      transition: color 0.35s ease;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1F2937;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      transition: color 0.35s ease;
    }

    /* ═══════════ SECTIONS ═══════════ */
    .section { margin-bottom: 32px; }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 16px;
      letter-spacing: -0.01em;
      transition: color 0.35s ease;
    }

    /* ═══════════ QUICK ACTIONS ═══════════ */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .action-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
      color: inherit;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  background 0.35s ease, border-color 0.35s ease;
      cursor: pointer;
    }
    .action-card:hover {
      border-color: #D97706;
      box-shadow: 0 10px 28px rgba(217, 119, 6, 0.15);
      transform: translateY(-3px);
    }
    .action-card:hover .action-arrow {
      color: #D97706;
      transform: translateX(4px);
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background 0.35s ease, color 0.35s ease;
    }
    .action-icon mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    .action-icon.blue   { background: #EFF6FF; color: #0066CC; }
    .action-icon.green  { background: #F0FDF4; color: #16A34A; }
    .action-icon.yellow { background: #FEF3C7; color: #D97706; }
    .action-icon.indigo { background: #EEF2FF; color: #4F46E5; }

    .action-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .action-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #1F2937;
      transition: color 0.35s ease;
    }

    .action-desc {
      font-size: 0.8rem;
      color: #6B7280;
      line-height: 1.4;
      transition: color 0.35s ease;
    }

    .action-arrow {
      color: #9CA3AF;
      font-size: 20px;
      height: 20px;
      width: 20px;
      transition: all 0.25s ease, color 0.35s ease;
    }

    /* ══════════════════════════════════════════════════
       DARK MODE — full-width, full-height background
       ══════════════════════════════════════════════════ */
    .page.dark {
      background: #15100A;
      color: #EFE6D5;
      max-width: none;
      margin: 0;
      min-height: 100%;
      /* padding stays the same as light mode */
    }

    .page.dark .hero-banner {
      background: linear-gradient(135deg,
        rgba(253, 185, 19, 0.06) 0%,
        rgba(253, 185, 19, 0.10) 50%,
        rgba(253, 185, 19, 0.04) 100%);
      border-color: rgba(253, 185, 19, 0.25);
    }
    .page.dark .hero-banner::before {
      background: radial-gradient(circle, rgba(253, 185, 19, 0.15) 0%, transparent 70%);
    }
    .page.dark .hero-banner::after {
      background: radial-gradient(circle, rgba(253, 185, 19, 0.08) 0%, transparent 70%);
    }

    .page.dark .hero-text h1 { color: #FDB913; }
    .page.dark .hero-text p  { color: #B8A382; }

    .page.dark .btn-hero-primary {
      background: #FDB913 !important;
      color: #15100A !important;
    }
    .page.dark .btn-hero-primary:hover {
      background: #FCD34D !important;
      box-shadow: 0 8px 24px rgba(253, 185, 19, 0.35);
    }

    .page.dark .btn-hero-outline {
      border-color: #FDB913 !important;
      color: #FDB913 !important;
    }
    .page.dark .btn-hero-outline:hover {
      background: rgba(253, 185, 19, 0.12) !important;
    }

    .page.dark .hero-badge {
      background: #221709;
      border-color: rgba(253, 185, 19, 0.25);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
    }
    .page.dark .hero-badge:hover {
      box-shadow: 0 18px 48px rgba(253, 185, 19, 0.2);
    }
    .page.dark .hero-badge-icon {
      background: linear-gradient(135deg, #2A1A0F 0%, #3B2413 100%);
    }
    .page.dark .hero-badge-icon mat-icon { color: #FDB913; }
    .page.dark .hero-badge-label { color: #B8A382; }
    .page.dark .hero-badge-value { color: #FDB913; }

    .page.dark .stat-card {
      background: #221709;
      border-color: rgba(253, 185, 19, 0.15);
    }
    .page.dark .stat-card:hover {
      border-color: rgba(253, 185, 19, 0.5);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5), 0 0 40px rgba(253, 185, 19, 0.15);
    }
    .page.dark .stat-icon.blue   { background: rgba(0, 102, 204, 0.15);  color: #60A5FA; }
    .page.dark .stat-icon.green  { background: rgba(22, 163, 74, 0.15);  color: #4ADE80; }
    .page.dark .stat-icon.indigo { background: rgba(79, 70, 229, 0.15);  color: #A5B4FC; }
    .page.dark .stat-icon.red    { background: rgba(220, 38, 38, 0.15);  color: #F87171; }
    .page.dark .stat-icon.yellow { background: rgba(217, 119, 6, 0.15);  color: #FBBF24; }
    .page.dark .stat-label { color: #8A7A62; }
    .page.dark .stat-value { color: #FBF6EC; }

    .page.dark .section-title { color: #FBF6EC; }

    .page.dark .action-card {
      background: #221709;
      border-color: rgba(253, 185, 19, 0.15);
    }
    .page.dark .action-card:hover {
      border-color: #FDB913;
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(253, 185, 19, 0.18);
    }
    .page.dark .action-card:hover .action-arrow {
      color: #FDB913;
    }
    .page.dark .action-icon.blue   { background: rgba(0, 102, 204, 0.18);  color: #60A5FA; }
    .page.dark .action-icon.green  { background: rgba(22, 163, 74, 0.18);  color: #4ADE80; }
    .page.dark .action-icon.yellow { background: rgba(217, 119, 6, 0.18);  color: #FBBF24; }
    .page.dark .action-icon.indigo { background: rgba(79, 70, 229, 0.18);  color: #A5B4FC; }
    .page.dark .action-title { color: #FBF6EC; }
    .page.dark .action-desc  { color: #8A7A62; }
    .page.dark .action-arrow { color: #B8A382; }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 900px) {
      .hero-content {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .hero-illustration { justify-content: flex-start; }

      .hero-badge {
        flex-direction: row;
        align-items: center;
        gap: 14px;
        padding: 14px 22px;
        min-width: auto;
      }
      .hero-badge-icon {
        width: 44px;
        height: 44px;
        margin-bottom: 0;
      }
      .hero-badge-icon mat-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
      }
      .hero-badge-label { margin-right: 6px; }
      .hero-badge-value { font-size: 1.75rem; }
      .hero-text h1 { font-size: 1.5rem; }
    }

    @media (max-width: 600px) {
      .page { padding: 16px 16px 32px; }
      .hero-banner { padding: 22px 20px; }
      .hero-text h1 { font-size: 1.35rem; }

      .hero-actions {
        flex-direction: column;
      }
      .hero-actions button { width: 100%; }

      .stats-section { grid-template-columns: 1fr; }
      .action-grid   { grid-template-columns: 1fr; }
    }

    /* ═══════════ PRODUCT POLISH ═══════════ */
    .page {
      --ink: #17243a;
      --muted: #718096;
      --line: rgba(29, 48, 76, 0.09);
      min-height: 100%;
      max-width: none;
      padding: clamp(20px, 3vw, 42px) clamp(18px, 3.5vw, 52px) 56px;
      background: transparent;
      color: var(--ink);
    }
    .hero-banner {
      min-height: 252px;
      padding: clamp(28px, 4vw, 48px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 24px;
      background: linear-gradient(112deg, #101e36 0%, #183c67 62%, #205782 100%);
      box-shadow: 0 20px 55px rgba(20, 46, 78, 0.16);
      animation: dashboard-rise 650ms cubic-bezier(.2,.75,.25,1) both;
    }
    .hero-banner::before {
      right: -40px;
      top: -140px;
      width: 460px;
      height: 460px;
      background: radial-gradient(circle, rgba(62, 154, 210, 0.34) 0%, transparent 67%);
    }
    .hero-banner::after {
      right: 22%;
      bottom: -225px;
      width: 430px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(253, 185, 19, 0.15) 0%, transparent 70%);
    }
    .hero-content { gap: 24px; }
    .hero-kicker {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 15px;
      color: #b9d5ed;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: .14em;
    }
    .hero-kicker > span:last-child { color: #f4bd45; }
    .hero-kicker-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #57d3a4;
      box-shadow: 0 0 0 4px rgba(87, 211, 164, .13);
    }
    .hero-text h1 {
      max-width: 680px;
      color: #fff;
      font-size: clamp(1.8rem, 3vw, 2.45rem);
      letter-spacing: -.045em;
    }
    .hero-text p { color: #c4d5e6; }
    .btn-hero-primary {
      background: #f4bd45 !important;
      color: #17243a !important;
      box-shadow: 0 7px 18px rgba(3, 14, 31, .18);
    }
    .btn-hero-primary:hover { background: #ffd36e !important; transform: translateY(-1px); }
    .btn-hero-outline {
      border-color: rgba(219, 235, 249, .46) !important;
      color: #eff7ff !important;
      background: rgba(255, 255, 255, .035) !important;
    }
    .btn-hero-outline:hover { background: rgba(255, 255, 255, .1) !important; }
    .hero-badge {
      min-width: 188px;
      padding: 24px 30px;
      border: 1px solid rgba(255,255,255,.62);
      border-radius: 22px;
      background: rgba(255,255,255,.94);
      box-shadow: 0 20px 45px rgba(4,17,35,.23);
      backdrop-filter: blur(14px);
    }
    .hero-badge-icon { border-radius: 17px; background: #fff4d8; }
    .hero-badge-icon mat-icon { color: #bb8111; }
    .stats-section { gap: 18px; margin: 0 0 38px; }
    .stat-card {
      position: relative;
      min-height: 128px;
      padding: 24px;
      border-color: var(--line);
      border-radius: 18px;
      box-shadow: 0 6px 20px rgba(31, 50, 75, .035);
      overflow: hidden;
      animation: dashboard-rise 650ms cubic-bezier(.2,.75,.25,1) both;
    }
    .stat-card:nth-child(2) { animation-delay: 70ms; }
    .stat-card:nth-child(3) { animation-delay: 140ms; }
    .stat-card:nth-child(4) { animation-delay: 210ms; }
    .stat-card::after {
      content: '';
      position: absolute;
      right: -24px;
      bottom: -38px;
      width: 100px;
      height: 100px;
      border: 1px solid rgba(33, 84, 133, .06);
      border-radius: 50%;
      box-shadow: 0 0 0 12px rgba(33,84,133,.025), 0 0 0 24px rgba(33,84,133,.018);
      pointer-events: none;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(28, 102, 163, .22);
      box-shadow: 0 15px 32px rgba(31, 67, 102, .10);
    }
    .stat-icon { width: 54px; height: 54px; border-radius: 17px; }
    .stat-label { color: var(--muted); letter-spacing: .075em; }
    .stat-value { color: var(--ink); font-size: 2rem; letter-spacing: -.035em; }
    .section { margin-bottom: 30px; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 11px;
      margin-bottom: 17px;
      color: var(--ink);
      font-size: 1.08rem;
      letter-spacing: -.02em;
    }
    .section-title::before {
      content: '';
      width: 4px;
      height: 20px;
      border-radius: 8px;
      background: linear-gradient(#f3bd45, #d99c1c);
    }
    .action-grid { gap: 18px; }
    .action-card {
      min-height: 102px;
      padding: 21px;
      border-color: var(--line);
      border-radius: 18px;
      box-shadow: 0 6px 20px rgba(31, 50, 75, .035);
    }
    .action-card:hover {
      transform: translateY(-4px);
      border-color: rgba(28, 102, 163, .2);
      box-shadow: 0 16px 32px rgba(31, 67, 102, .10);
    }
    .action-icon { width: 50px; height: 50px; border-radius: 16px; }
    .action-title { color: var(--ink); font-size: .96rem; }
    .action-desc { color: var(--muted); }
    .action-arrow { color: #9aa9ba; }
    .page.dark {
      --ink: #f1f5fa;
      --muted: #a6b5c6;
      --line: rgba(208, 222, 239, .10);
      background: transparent;
    }
    .page.dark .hero-banner {
      background: linear-gradient(112deg, #111c2e 0%, #142e4d 62%, #17405f 100%);
      border-color: rgba(178, 207, 236, .12);
      box-shadow: 0 20px 55px rgba(0, 0, 0, .25);
    }
    .page.dark .hero-text h1 { color: #fff; }
    .page.dark .hero-text p { color: #c4d5e6; }
    .page.dark .btn-hero-primary { background: #f4bd45 !important; color: #17243a !important; }
    .page.dark .btn-hero-outline { color: #eff7ff !important; border-color: rgba(219,235,249,.35) !important; }
    .page.dark .hero-badge { background: rgba(27, 43, 62, .9); border-color: rgba(255,255,255,.12); }
    .page.dark .hero-badge-label { color: #b9c7d6; }
    .page.dark .hero-badge-value { color: #f4bd45; }
    .page.dark .hero-badge-icon { background: rgba(244,189,69,.14); }
    .page.dark .stat-card, .page.dark .action-card {
      background: #1a2738;
      border-color: var(--line);
      box-shadow: 0 8px 22px rgba(0,0,0,.12);
    }
    .page.dark .stat-card:hover, .page.dark .action-card:hover {
      border-color: rgba(244,189,69,.34);
      box-shadow: 0 15px 32px rgba(0,0,0,.24);
    }
    .page.dark .stat-label, .page.dark .action-desc { color: var(--muted); }
    .page.dark .stat-value, .page.dark .section-title, .page.dark .action-title { color: var(--ink); }
    .page.dark .action-arrow { color: #a6b5c6; }
    @keyframes dashboard-rise {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero-banner, .stat-card { animation: none; }
      .stat-card, .action-card, .hero-badge { transition: none; }
    }
    @media (max-width: 600px) {
      .hero-banner { border-radius: 20px; }
      .hero-badge { padding: 12px 16px; }
      .stat-card { min-height: 106px; padding: 18px; }
    }
  `],
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private assetService = inject(AssetService);
  private gql = inject(GraphqlService);
  private notify = inject(NotificationService);

  readonly total = signal(0);
  readonly available = signal(0);
  readonly assigned = signal(0);
  readonly lost = signal(0);

  firstName(): string {
    const full = this.auth.currentUser()?.fullName ?? '';
    return full.split(' ')[0] || 'User';
  }

  async ngOnInit() {
    try {
      if (this.auth.isAdmin()) {
        const assets: Asset[] = await this.assetService.list();
        this.total.set(assets.length);
        this.available.set(assets.filter(a => a.status === 'AVAILABLE').length);
        this.assigned.set(assets.filter(a => a.status === 'ASSIGNED').length);
        this.lost.set(
          assets.filter(a =>
            a.status === 'LOST' ||
            a.status === 'RETIRED' ||
            a.status === 'STOLEN'
          ).length
        );
      } else {
        const q = `query { myCurrentAssets { id } myAssetHistory { id } }`;
        const r: any = await firstValueFrom(this.gql.request(q));
        this.total.set((r.myAssetHistory ?? []).length);
        this.assigned.set((r.myCurrentAssets ?? []).length);
        this.available.set(0);
        this.lost.set(0);
      }
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load stats');
    }
  }
}
