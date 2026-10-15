import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GraphqlService } from '../../core/services/graphql.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>My Profile</h1>
          <p class="subtitle">Manage your account and security settings</p>
        </div>
      </div>

      <div class="profile-grid">

        <!-- ═══════════ ACCOUNT INFO ═══════════ -->
        <mat-card class="info-card">
          <div class="card-header">
            <div class="header-icon">
              <mat-icon>person</mat-icon>
            </div>
            <div class="header-text">
              <h2>Account Information</h2>
              <p>Your registered details</p>
            </div>
          </div>

          <mat-card-content>
            <!-- Big avatar + name -->
            <div class="avatar-block">
              <div class="big-avatar">{{ initials() }}</div>
              <div class="avatar-text">
                <div class="avatar-name">{{ user()?.fullName }}</div>
                <div class="avatar-role" [ngClass]="'role-' + (user()?.role || 'USER').toLowerCase()">
                  {{ user()?.role }}
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="info-rows">
              <div class="info-row">
                <div class="row-icon">
                  <mat-icon>badge</mat-icon>
                </div>
                <div class="row-content">
                  <span class="row-label">User ID</span>
                  <span class="row-value">#{{ user()?.id }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="row-icon">
                  <mat-icon>person_outline</mat-icon>
                </div>
                <div class="row-content">
                  <span class="row-label">Full Name</span>
                  <span class="row-value">{{ user()?.fullName }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="row-icon">
                  <mat-icon>mail_outline</mat-icon>
                </div>
                <div class="row-content">
                  <span class="row-label">Email</span>
                  <span class="row-value">{{ user()?.email }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="row-icon">
                  <mat-icon>verified_user</mat-icon>
                </div>
                <div class="row-content">
                  <span class="row-label">Role</span>
                  <span class="row-value">
                    <span class="chip" [ngClass]="'role-' + (user()?.role || 'USER').toLowerCase()">
                      {{ user()?.role }}
                    </span>
                  </span>
                </div>
              </div>

              <div class="info-row">
                <div class="row-icon">
                  <mat-icon>check_circle_outline</mat-icon>
                </div>
                <div class="row-content">
                  <span class="row-label">Status</span>
                  <span class="row-value">
                    <span class="status-chip" [ngClass]="user()?.active ? 'active' : 'inactive'">
                      <span class="dot"></span>
                      {{ user()?.active ? 'Active' : 'Disabled' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ═══════════ CHANGE PASSWORD ═══════════ -->
        <mat-card class="password-card">
          <div class="card-header password-header">
            <div class="header-icon blue">
              <mat-icon>lock</mat-icon>
            </div>
            <div class="header-text">
              <h2>Change Password</h2>
              <p>Update your account password</p>
            </div>
          </div>

          <mat-card-content>
            <form (ngSubmit)="onChangePassword()" #pwForm="ngForm" class="password-form">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current Password</mat-label>
                <input matInput
                       [type]="showCurrent() ? 'text' : 'password'"
                       name="currentPassword"
                       [(ngModel)]="currentPassword"
                       required
                       autocomplete="current-password" />
                <mat-icon matPrefix>lock_outline</mat-icon>
                <button mat-icon-button matSuffix type="button"
                        (click)="showCurrent.set(!showCurrent())">
                  <mat-icon>{{ showCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput
                       [type]="showNew() ? 'text' : 'password'"
                       name="newPassword"
                       [(ngModel)]="newPassword"
                       required
                       minlength="6"
                       autocomplete="new-password" />
                <mat-icon matPrefix>vpn_key</mat-icon>
                <button mat-icon-button matSuffix type="button"
                        (click)="showNew.set(!showNew())">
                  <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>At least 6 characters</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input matInput
                       [type]="showConfirm() ? 'text' : 'password'"
                       name="confirmPassword"
                       [(ngModel)]="confirmPassword"
                       required
                       autocomplete="new-password" />
                <mat-icon matPrefix>vpn_key</mat-icon>
                @if (passwordsMismatch()) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>

              <!-- Password strength hints -->
              @if (newPassword) {
                <div class="strength">
                  <div class="strength-bar">
                    <span [class]="'bar ' + passwordStrength()"></span>
                  </div>
                  <span class="strength-label" [class]="passwordStrength()">
                    {{ passwordStrengthLabel() }}
                  </span>
                </div>
              }

              <button mat-flat-button
                      class="submit-btn"
                      type="submit"
                      [disabled]="saving() || !isValid()">
                @if (saving()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <ng-container>
                    <mat-icon>check</mat-icon>
                    <span>Update Password</span>
                  </ng-container>
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>

      </div>

    </div>
  `,
  styles: [`
    .page {
      padding: 32px 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ═══════════ HEADER ═══════════ */
    .page-header {
      margin-bottom: 28px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1F2937;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #6B7280;
      font-size: 0.9rem;
    }

    /* ═══════════ GRID ═══════════ */
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    /* ═══════════ CARDS ═══════════ */
    mat-card {
      border-radius: 14px !important;
      border: 1px solid #E5E7EB;
      box-shadow: none !important;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #FFFDF5 0%, #FEF9E7 100%);
      border-bottom: 1px solid #FBEDBB;

      &.password-header {
        background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
        border-bottom-color: #BFDBFE;
      }
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #FFFFFF;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(139, 105, 20, 0.1);

      mat-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
        color: #B8860B;
      }

      &.blue mat-icon { color: #2563EB; }
    }

    .header-text {
      h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #4A3B0A;
      }

      p {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #8B6914;
        opacity: 0.85;
      }
    }

    .password-header .header-text h2 { color: #1E3A8A; }
    .password-header .header-text p { color: #3B82F6; }

    mat-card-content {
      padding: 24px !important;
    }

    /* ═══════════ AVATAR BLOCK ═══════════ */
    .avatar-block {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 20px;
    }

    .big-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FBEDBB 0%, #F5E1A4 100%);
      color: #78350F;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(139, 105, 20, 0.15);
    }

    .avatar-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .avatar-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1F2937;
    }

    .avatar-role {
      display: inline-block;
      align-self: flex-start;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;

      &.role-admin { background: #FEE2E2; color: #B91C1C; }
      &.role-user  { background: #EFF6FF; color: #2563EB; }
    }

    /* ═══════════ INFO ROWS ═══════════ */
    .info-rows {
      display: flex;
      flex-direction: column;
      padding-top: 8px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 0;
      border-bottom: 1px solid #F3F4F6;

      &:last-child {
        border-bottom: none;
      }
    }

    .row-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #F9FAFB;
      display: grid;
      place-items: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        color: #9CA3AF;
      }
    }

    .row-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .row-label {
      font-size: 0.7rem;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }

    .row-value {
      font-size: 0.9rem;
      color: #1F2937;
      font-weight: 500;
      word-break: break-word;
    }

    /* ═══════════ CHIPS ═══════════ */
    .chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;

      &.role-admin { background: #FEE2E2; color: #B91C1C; }
      &.role-user  { background: #EFF6FF; color: #2563EB; }
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      &.active { color: #16A34A; }
      &.inactive { color: #DC2626; }
    }

    /* ═══════════ PASSWORD FORM ═══════════ */
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width { width: 100%; }

    mat-icon[matPrefix] {
      margin-right: 8px;
      color: #C9B47A;
    }

    /* ═══════════ STRENGTH METER ═══════════ */
    .strength {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: -8px 0 12px;
    }

    .strength-bar {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #F3F4F6;
      overflow: hidden;

      .bar {
        display: block;
        height: 100%;
        width: 0;
        transition: width 0.3s ease, background 0.3s ease;
        border-radius: 3px;
      }

      .bar.weak   { width: 33%; background: #DC2626; }
      .bar.medium { width: 66%; background: #F59E0B; }
      .bar.strong { width: 100%; background: #16A34A; }
    }

    .strength-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.weak { color: #DC2626; }
      &.medium { color: #F59E0B; }
      &.strong { color: #16A34A; }
    }

    /* ═══════════ SUBMIT BUTTON ═══════════ */
    .submit-btn {
      height: 48px;
      margin-top: 16px;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%) !important;
      color: white !important;
      font-weight: 600;
      font-size: 0.9rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
        box-shadow: 0 6px 18px rgba(139, 105, 20, 0.35);
        transform: translateY(-1px);
      }

      &:disabled {
        background: #E5E7EB !important;
        color: #9CA3AF !important;
        box-shadow: none;
      }

      mat-icon {
        font-size: 20px;
        height: 20px;
        width: 20px;
      }
    }

    /* ═══════════ MATERIAL OVERRIDES ═══════════ */
    ::ng-deep .mat-mdc-form-field.mat-focused {
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: #D4A017 !important;
      }
      .mat-mdc-floating-label { color: #8B6914 !important; }
      .mat-icon[matPrefix] { color: #B8860B; }
    }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 900px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .page { padding: 20px 16px; }
      .page-header h1 { font-size: 1.4rem; }
      mat-card-content { padding: 20px !important; }
      .big-avatar { width: 60px; height: 60px; font-size: 1.25rem; }
      .avatar-name { font-size: 1rem; }
    }
  `]
})
export class Profile {
  private auth = inject(AuthService);
  private gql = inject(GraphqlService);
  private notify = inject(NotificationService);

  // Signals
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly saving = signal(false);

  // Form fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Get current user from AuthService
  user = computed(() => this.auth.currentUser());

  // Password match check
  passwordsMismatch = computed(() => {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  });

  // Password strength
  passwordStrength = computed<'weak' | 'medium' | 'strong' | 'none'>(() => {
    const p = this.newPassword;
    if (!p) return 'none';

    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  });

  passwordStrengthLabel = computed(() => {
    switch (this.passwordStrength()) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  });

  initials(): string {
    const name = this.user()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  isValid(): boolean {
    return !!(
      this.currentPassword &&
      this.newPassword &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  async onChangePassword() {
    if (!this.isValid()) return;

    this.saving.set(true);
    try {
      const token = this.auth.getToken();
      const authHeader = `Bearer ${token}`;

      const q = `
        mutation ChangePassword(
          $authHeader: String!,
          $currentPassword: String!,
          $newPassword: String!
        ) {
          changePassword(
            authHeader: $authHeader,
            currentPassword: $currentPassword,
            newPassword: $newPassword
          )
        }
      `;

      await firstValueFrom(this.gql.request(q, {
        authHeader,
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      }));

      this.notify.success('Password updated successfully');

      // Reset form
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message || 'Failed to update password';
      this.notify.error(msg);
    } finally {
      this.saving.set(false);
    }
  }
}