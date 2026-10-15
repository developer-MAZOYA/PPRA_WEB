import { Component, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <button class="close-btn" (click)="close.emit()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>

        <!-- ═══════════ LEFT: BRAND PANEL ═══════════ -->
        <aside class="brand-panel">
          <div class="glow glow-1"></div>
          <div class="glow glow-2"></div>
          <div class="glow glow-3"></div>

          <div class="brand-inner">
            <div class="brand-top">
              <img src="emblem.png"
                   alt="PPRA" class="brand-emblem"
                   (error)="onImgError($event)" />
              <div class="brand-name">
                <strong>PPRA</strong>
                <small>Asset Management System</small>
              </div>
            </div>

            <div class="brand-mid">
              <h2>
                Join the
                <span>Digital Registry</span>
              </h2>
              <p>
                Create your account to track, assign, and report on
                assets across the Procurement Regulatory Authority.
              </p>
            </div>

            <ul class="brand-perks">
              <li>
                <span class="perk-icon"><mat-icon>check_circle</mat-icon></span>
                Free for all PPRA staff
              </li>
              <li>
                <span class="perk-icon"><mat-icon>check_circle</mat-icon></span>
                Instant access to your assignments
              </li>
              <li>
                <span class="perk-icon"><mat-icon>check_circle</mat-icon></span>
                Secure, encrypted, and audited
              </li>
            </ul>
          </div>
        </aside>

        <!-- ═══════════ RIGHT: FORM PANEL ═══════════ -->
        <section class="form-panel">

          <div class="form-header">
            <h1>Create your account</h1>
            <p>It only takes a minute to get started</p>
          </div>

          <form (ngSubmit)="onSubmit()" #f="ngForm" class="auth-form">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput name="fullName" [(ngModel)]="fullName"
                     required autocomplete="name"
                     placeholder="e.g. Juma Hamisi" />
              <mat-icon matPrefix>person_outline</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email address</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email"
                     required email autocomplete="email"
                     placeholder="you@ppra.go.tz" />
              <mat-icon matPrefix>mail_outline</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput
                     [type]="showPassword() ? 'text' : 'password'"
                     name="password" [(ngModel)]="password"
                     required minlength="6"
                     autocomplete="new-password"
                     placeholder="Create a strong password" />
              <mat-icon matPrefix>lock_outline</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      class="eye-btn"
                      (click)="showPassword.set(!showPassword())"
                      [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (password) {
              <div class="strength">
                <div class="strength-bars">
                  <span [class]="strengthScore() >= 1 ? 'bar active weak' : 'bar'"></span>
                  <span [class]="strengthScore() >= 2 ? 'bar active medium' : 'bar'"></span>
                  <span [class]="strengthScore() >= 3 ? 'bar active strong' : 'bar'"></span>
                </div>
                <span class="strength-label" [class]="strengthLevel()">
                  {{ strengthLabel() }}
                </span>
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput
                     [type]="showConfirm() ? 'text' : 'password'"
                     name="confirmPassword" [(ngModel)]="confirmPassword"
                     required autocomplete="new-password"
                     placeholder="Repeat your password" />
              <mat-icon matPrefix>lock_outline</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      class="eye-btn"
                      (click)="showConfirm.set(!showConfirm())"
                      [attr.aria-label]="showConfirm() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (passwordsMismatch()) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <button type="submit"
                    class="submit-btn"
                    [disabled]="loading() || f.invalid || passwordsMismatch()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <ng-container>
                  <span>Create Account</span>
                  <mat-icon class="arrow">arrow_forward</mat-icon>
                </ng-container>
              }
            </button>

          </form>

          <div class="form-footer">
            Already have an account?
            <a href="#" (click)="$event.preventDefault(); switchToLogin.emit()">Sign in</a>
          </div>

        </section>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px) saturate(120%);
      -webkit-backdrop-filter: blur(8px) saturate(120%);
      animation: backdropIn 0.35s ease;
    }
    @keyframes backdropIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .modal-shell {
      position: relative;
      width: 100%;
      max-width: 920px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 32px 80px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
      animation: shellIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-height: 92vh;
      overflow-y: auto;
    }
    @keyframes shellIn {
      from { opacity: 0; transform: translateY(24px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .close-btn {
      position: absolute;
      top: 16px; right: 16px;
      z-index: 10;
      width: 40px; height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      cursor: pointer;
      display: grid;
      place-items: center;
      backdrop-filter: blur(6px);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }

    .brand-panel {
      position: relative;
      padding: 48px 40px;
      background: linear-gradient(155deg,
        #78350F 0%,
        #8B6914 45%,
        #B8860B 100%);
      color: #FFFFFF;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.4;
      pointer-events: none;
      animation: float 8s ease-in-out infinite;
    }
    .glow-1 { width: 260px; height: 260px; background: #FDB913; top: -60px; left: -80px; }
    .glow-2 { width: 200px; height: 200px; background: #D4A017; bottom: -60px; right: -60px; animation-delay: -3s; }
    .glow-3 { width: 160px; height: 160px; background: #FCD34D; top: 40%; right: 20%; animation-delay: -6s; opacity: 0.25; }
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%      { transform: translate(20px, -20px) scale(1.1); }
    }

    .brand-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
      width: 100%;
    }

    .brand-top { display: flex; align-items: center; gap: 14px; }

    .brand-emblem {
      height: 52px; width: 52px;
      object-fit: contain;
     // filter: brightness(0) invert(1);
      opacity: 0.95;
    }

    .brand-name {
      display: flex; flex-direction: column; line-height: 1.15;
      strong {
        font-size: 1.15rem; font-weight: 800;
        letter-spacing: 0.1em;
        color: #FFFFFF;
      }
      small {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.85);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-top: 2px;
      }
    }

    .brand-mid h2 {
      margin: 0 0 16px;
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      span { display: block; color: #FCD34D; }
    }
    .brand-mid p {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
    }

    .brand-perks {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 14px;
      li {
        display: flex; align-items: center; gap: 12px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
      }
    }
    .perk-icon {
      width: 22px; height: 22px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.15);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      backdrop-filter: blur(6px);
      mat-icon {
        font-size: 16px; height: 16px; width: 16px;
        color: #FCD34D;
      }
    }

    .form-panel {
      padding: 48px 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .form-header {
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 1.65rem; font-weight: 800; color: #1F2937; letter-spacing: -0.02em; }
      p { margin: 8px 0 0; font-size: 0.9rem; color: #6B7280; }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 4px;
    }
    .full-width { width: 100%; }

    .submit-btn {
      height: 52px;
      width: 100%;
      margin-top: 12px;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow:
        0 4px 12px rgba(184, 134, 11, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%);
        transform: translateY(-2px);
        box-shadow:
          0 8px 24px rgba(139, 105, 20, 0.4),
          0 1px 0 rgba(255, 255, 255, 0.15) inset;
        .arrow { transform: translateX(4px); }
      }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }
      .arrow {
        font-size: 20px; height: 20px; width: 20px;
        transition: transform 0.25s;
      }
    }

    .strength {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: -4px 0 12px;
    }
    .strength-bars {
      display: flex;
      gap: 4px;
      flex: 1;
      .bar {
        flex: 1;
        height: 5px;
        border-radius: 3px;
        background: #F0E6C8;
        transition: background 0.3s ease;
        &.active.weak   { background: #DC2626; }
        &.active.medium { background: #F59E0B; }
        &.active.strong { background: #16A34A; }
      }
    }
    .strength-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 50px;
      text-align: right;
      &.weak   { color: #DC2626; }
      &.medium { color: #F59E0B; }
      &.strong { color: #16A34A; }
      &.none   { color: #9CA3AF; }
    }

    .form-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.88rem;
      color: #6B7280;
      a {
        color: #B8860B;
        font-weight: 700;
        text-decoration: none;
        margin-left: 4px;
        transition: color 0.15s;
        cursor: pointer;
        &:hover { color: #8B6914; text-decoration: underline; }
      }
    }

    /* ═══════════ MATERIAL OVERRIDES ═══════════ */
    ::ng-deep .form-panel .mat-mdc-form-field {
      margin-top: 6px;
    }
    ::ng-deep .form-panel .mat-mdc-form-field .mdc-notched-outline__leading {
      border-radius: 999px 0 0 999px !important;
      border-color: #E5E7EB;
      width: 24px;
    }
    ::ng-deep .form-panel .mat-mdc-form-field .mdc-notched-outline__trailing {
      border-radius: 0 999px 999px 0 !important;
      border-color: #E5E7EB;
      width: 24px;
    }
    ::ng-deep .form-panel .mat-mdc-form-field .mdc-notched-outline__notch {
      border-color: #E5E7EB;
    }
    ::ng-deep .form-panel .mat-mdc-text-field-wrapper {
      overflow: visible;
      padding-left: 6px;
      padding-right: 4px;
    }
    ::ng-deep .form-panel .mat-mdc-form-field-subscript-wrapper {
      min-height: 14px;
    }
    ::ng-deep .form-panel .mat-mdc-form-field.mat-focused {
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: #B8860B !important;
        border-width: 2px !important;
      }
      .mat-mdc-floating-label { color: #8B6914 !important; }
      .mat-icon[matPrefix] { color: #B8860B !important; }
    }
    ::ng-deep .form-panel .mat-icon[matPrefix] {
      margin-right: 8px;
      margin-left: 6px;
      color: #9CA3AF;
      transition: color 0.2s;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    ::ng-deep .form-panel .eye-btn {
      color: #6B7280;
      height: 22px;
      width: 22px;
      padding: 0;
      margin-right: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      &:hover {
        background: #FEF9E7;
        color: #B8860B;
      }
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        line-height: 18px;
      }
    }

    /* ══════════════════════════════════════════════════
       DARK MODE — reacts to html.ppra-dark
       ══════════════════════════════════════════════════ */
    :host-context(html.ppra-dark) .modal-shell {
      background: #1A130D;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.5),
        0 32px 80px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(253, 185, 19, 0.1) inset;
    }

    :host-context(html.ppra-dark) .form-header h1 { color: #FBF6EC; }
    :host-context(html.ppra-dark) .form-header p  { color: #B8A382; }

    :host-context(html.ppra-dark) .strength .strength-label.none { color: #8A7A62; }

    :host-context(html.ppra-dark) .form-footer {
      color: #B8A382;
      a { color: #FDB913; &:hover { color: #FCD34D; } }
    }

    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field .mdc-notched-outline__leading,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field .mdc-notched-outline__notch,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field .mdc-notched-outline__trailing {
      border-color: rgba(253, 185, 19, 0.2);
    }

    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field.mat-focused {
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: #FDB913 !important;
      }
      .mat-mdc-floating-label { color: #FDB913 !important; }
      .mat-icon[matPrefix] { color: #FDB913 !important; }
    }

    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-input-element {
      color: #FBF6EC;
    }

    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-floating-label {
      color: #B8A382;
    }

    :host-context(html.ppra-dark) ::ng-deep .eye-btn {
      color: #B8A382;
      &:hover { background: rgba(253, 185, 19, 0.12); color: #FDB913; }
    }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 820px) {
      .modal-shell { grid-template-columns: 1fr; max-width: 480px; }
      .brand-panel { padding: 32px 28px; }
      .brand-mid h2 { font-size: 1.35rem; }
      .brand-perks { display: none; }
      .form-panel { padding: 36px 28px; }
    }
    @media (max-width: 520px) {
      .modal-backdrop { padding: 16px; }
      .modal-shell { border-radius: 20px; }
      .brand-panel { padding: 24px 22px; }
      .brand-emblem { height: 42px; width: 42px; }
      .brand-name strong { font-size: 1rem; }
      .brand-mid h2 { font-size: 1.2rem; margin-bottom: 8px; }
      .brand-mid p { font-size: 0.82rem; }
      .form-panel { padding: 28px 22px; }
      .form-header h1 { font-size: 1.4rem; }
      .submit-btn { height: 48px; }
      .close-btn { top: 12px; right: 12px; width: 36px; height: 36px; }
    }

    /* Refined portal registration */
    .modal-shell {
      max-width: 980px;
      border-radius: 26px;
      box-shadow: 0 30px 90px rgba(5, 17, 31, .32), 0 0 0 1px rgba(255,255,255,.42);
    }
    .brand-panel {
      background: linear-gradient(145deg, #11243b 0%, #173b5b 62%, #205579 100%);
      padding: 52px 44px;
    }
    .glow-1 { background: #2b8cb7; opacity: .22; }
    .glow-2 { background: #f4bd45; opacity: .2; }
    .glow-3 { background: #4a78a5; opacity: .18; }
    .brand-emblem {
      padding: 7px;
      border-radius: 15px;
      background: rgba(255,255,255,.96);
      box-shadow: 0 8px 24px rgba(5,17,31,.16);
    }
    .brand-mid h2 { letter-spacing: -.04em; font-size: 1.9rem; }
    .brand-mid h2 span { color: #f5c65e; }
    .form-panel { padding: 44px 48px; }
    .form-header h1 { color: #172b44; letter-spacing: -.04em; }
    .form-header p { color: #708197; }
    .submit-btn {
      border-radius: 12px;
      background: linear-gradient(110deg, #f4bd45, #e7a927);
      color: #17243a;
      box-shadow: 0 8px 18px rgba(218, 163, 40, .22);
    }
    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(110deg, #ffd36e, #f4bd45);
      box-shadow: 0 12px 24px rgba(218, 163, 40, .27);
    }
    .close-btn { background: rgba(19, 38, 64, .08); color: #38516c; }
    .close-btn:hover { background: rgba(19,38,64,.14); color: #173858; }
    .form-footer a { color: #a67816; }
    :host-context(html.ppra-dark) .modal-shell { background: #14243a; }
    :host-context(html.ppra-dark) .form-panel { background: #14243a; }
    :host-context(html.ppra-dark) .form-header h1 { color: #f0f5fa; }
    :host-context(html.ppra-dark) .form-header p,
    :host-context(html.ppra-dark) .form-footer { color: #aebed0; }
    :host-context(html.ppra-dark) .close-btn { background: rgba(255,255,255,.08); color: #dce6f0; }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-input-text-color: #edf3f9;
      --mdc-outlined-text-field-label-text-color: #aebed0;
      --mdc-outlined-text-field-outline-color: rgba(191,210,230,.24);
      --mdc-outlined-text-field-focus-outline-color: #f4bd45;
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-input-element { color: #edf3f9 !important; }
    @media (max-width: 820px) {
      .modal-shell { border-radius: 22px; }
      .brand-panel { padding: 34px 30px; }
      .form-panel { padding: 36px 30px; }
    }
  `]
})
export class RegisterModal {
  readonly close = output<void>();
  readonly switchToLogin = output<void>();

  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  passwordsMismatch(): boolean {
    return !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  strengthScore = computed(() => {
    const p = this.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return 1;
    if (score <= 4) return 2;
    return 3;
  });

  strengthLevel = computed(() => {
    switch (this.strengthScore()) {
      case 1: return 'weak';
      case 2: return 'medium';
      case 3: return 'strong';
      default: return 'none';
    }
  });

  strengthLabel = computed(() => {
    switch (this.strengthLevel()) {
      case 'weak':   return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default:       return '';
    }
  });

  onImgError(event: Event) {
    const el = event.target as HTMLImageElement;
    el.style.display = 'none';
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.passwordsMismatch()) {
      this.notify.error('Passwords do not match');
      return;
    }
    if (!this.fullName || !this.email || !this.password || this.loading()) return;

    this.loading.set(true);
    try {
      await this.auth.register(this.fullName, this.email, this.password);
      this.notify.success('Account created. Please sign in.');
      this.close.emit();
      this.switchToLogin.emit();
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.errors?.[0]?.message ||
        (err as any)?.error?.message ||
        (err as any)?.message ||
        'Registration failed. Please try again.';
      this.notify.error(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
