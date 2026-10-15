import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User, UserRole } from '../../../../core/models/user.model';
import { UserService, AdminUserInput } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface UserDialogData {
  mode: 'create' | 'edit';
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <!-- Header -->
    <div class="dialog-header" [class.edit-mode]="data.mode === 'edit'">
      <div class="header-icon">
        <mat-icon>{{ data.mode === 'create' ? 'person_add' : 'edit' }}</mat-icon>
      </div>
      <div class="header-text">
        <h2>{{ data.mode === 'create' ? 'Create New User' : 'Edit User' }}</h2>
        <p>
          {{ data.mode === 'create'
            ? 'Add a new user to the system'
            : 'Update user details below' }}
        </p>
      </div>
      <button mat-icon-button class="close-btn" (click)="cancel()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- Form -->
    <mat-dialog-content>
      <form #f="ngForm" class="user-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput name="fullName" [(ngModel)]="model.fullName"
                 required placeholder="e.g. John Doe" />
          <mat-icon matPrefix>person_outline</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" name="email" [(ngModel)]="model.email"
                 required email placeholder="user@ppra.go.tz" />
          <mat-icon matPrefix>mail_outline</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>
            {{ data.mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)' }}
          </mat-label>
          <input matInput [type]="showPassword ? 'text' : 'password'"
                 name="password" [(ngModel)]="model.password"
                 [required]="data.mode === 'create'"
                 [minlength]="data.mode === 'create' ? 6 : null"
                 placeholder="At least 6 characters" />
          <mat-icon matPrefix>lock_outline</mat-icon>
          <button mat-icon-button matSuffix type="button"
                  (click)="showPassword = !showPassword">
            <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>

        <div class="row-two">

          <!-- Role — only editable by admins, and never for your own account -->
          @if (canEditRole()) {
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select name="role" [(ngModel)]="model.role" required>
                <mat-option value="USER">User</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
              </mat-select>
              <mat-icon matPrefix>badge</mat-icon>
              <mat-hint>Admins can manage other users</mat-hint>
            </mat-form-field>
          } @else {
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <input matInput [value]="model.role" disabled />
              <mat-icon matPrefix>badge</mat-icon>
              <mat-hint>
                {{ isSelf() ? 'You cannot change your own role' : 'Only admins can change roles' }}
              </mat-hint>
            </mat-form-field>
          }

          <!-- Status — disabled for your own account -->
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select name="active" [(ngModel)]="model.active"
                        [disabled]="isSelf()">
              <mat-option [value]="true">Active</mat-option>
              <mat-option [value]="false">Disabled</mat-option>
            </mat-select>
            <mat-icon matPrefix>check_circle_outline</mat-icon>
            @if (isSelf()) {
              <mat-hint>You cannot disable your own account</mat-hint>
            }
          </mat-form-field>

        </div>
      </form>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="cancel()" [disabled]="submitting">
        Cancel
      </button>
      <button mat-flat-button class="save-btn"
              (click)="save()"
              [disabled]="submitting || !isValid()">
        @if (submitting) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          {{ data.mode === 'create' ? 'Create User' : 'Save Changes' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #FEF9E7 0%, #FBEDBB 100%);
      border-bottom: 1px solid #F5E1A4;
      border-radius: 12px 12px 0 0;
    }
    .dialog-header.edit-mode {
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-bottom-color: #BFDBFE;
    }
    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #FFFFFF;
      display: grid;
      place-items: center;
      box-shadow: 0 2px 6px rgba(139, 105, 20, 0.1);
      flex-shrink: 0;
    }
    .header-icon mat-icon {
      font-size: 26px;
      height: 26px;
      width: 26px;
      color: #B8860B;
    }
    .edit-mode .header-icon mat-icon { color: #2563EB; }
    .header-text { flex: 1; min-width: 0; }
    .header-text h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #4A3B0A;
    }
    .header-text p {
      margin: 2px 0 0;
      font-size: 0.82rem;
      color: #8B6914;
      opacity: 0.85;
    }
    .edit-mode .header-text h2 { color: #1E3A8A; }
    .edit-mode .header-text p { color: #3B82F6; }
    .close-btn { color: #8B6914; flex-shrink: 0; }
    .edit-mode .close-btn { color: #2563EB; }

    mat-dialog-content {
      padding: 24px !important;
      min-width: 480px;
      max-width: 560px;
    }
    .user-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-icon[matPrefix] { margin-right: 8px; color: #C9B47A; }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
      border-top: 1px solid #F0F2F5;
    }
    .save-btn {
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%) !important;
      color: white !important;
      font-weight: 600;
      min-width: 140px;
      height: 42px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
      transition: all 0.2s ease;
    }
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
      box-shadow: 0 6px 18px rgba(139, 105, 20, 0.35);
    }
    .save-btn:disabled {
      background: #E5E7EB !important;
      color: #9CA3AF !important;
      box-shadow: none;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #B8860B !important;
    }
    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #8B6914 !important;
    }

    @media (max-width: 640px) {
      mat-dialog-content { min-width: auto; padding: 16px !important; }
      .row-two { grid-template-columns: 1fr; }
    }

    /* ═══════════ DARK MODE ═══════════ */
    :host-context(html.ppra-dark) .dialog-header {
      background: linear-gradient(135deg, #2A1A0F 0%, #221709 100%);
      border-bottom-color: rgba(253, 185, 19, 0.15);
    }
    :host-context(html.ppra-dark) .dialog-header.edit-mode {
      background: linear-gradient(135deg, #1A2540 0%, #152036 100%);
      border-bottom-color: rgba(96, 165, 250, 0.2);
    }
    :host-context(html.ppra-dark) .header-icon {
      background: #1A130D;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }
    :host-context(html.ppra-dark) .header-icon mat-icon { color: #FDB913; }
    :host-context(html.ppra-dark) .edit-mode .header-icon mat-icon { color: #60A5FA; }
    :host-context(html.ppra-dark) .header-text h2 { color: #FBF6EC; }
    :host-context(html.ppra-dark) .header-text p { color: #B8A382; }
    :host-context(html.ppra-dark) .close-btn { color: #B8A382; }
    :host-context(html.ppra-dark) .close-btn:hover { color: #FDB913; }
    :host-context(html.ppra-dark) mat-icon[matPrefix] { color: #8A7A62; }
    :host-context(html.ppra-dark) mat-dialog-actions {
      border-top-color: rgba(253, 185, 19, 0.15);
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #FDB913 !important;
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #FDB913 !important;
    }
  `]
})
export class UserDialog {
  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<UserDialog>);
  private auth = inject(AuthService);

  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  showPassword = false;
  submitting = false;

model: AdminUserInput = {
  fullName: '',
  email: '',
  password: '',
  role: 'USER',
  active: true,
};

  constructor() {
    if (this.data.mode === 'edit' && this.data.user) {
      this.model = {
        fullName: this.data.user.fullName,
        email: this.data.user.email,
        password: '',
        role: this.data.user.role,
        active: this.data.user.active,
      };
    }
  }

  /**
   * True when the current user is an admin.
   * Only admins can pick the ADMIN role — everyone else can only create USERs.
   */
  canAssignRole(): boolean {
    return this.auth.isAdmin();
  }

  /**
   * True when the dialog is editing the currently signed-in user's own account.
   * Used to prevent self-demotion and self-disable.
   */
  isSelf(): boolean {
    const current = this.auth.currentUser();
    if (!current) return false;
    if (this.data.mode !== 'edit') return false;
    return current.id === this.data.user?.id;
  }

  /**
   * True when the role field should be editable in the UI.
   * Admins can edit others' roles, but nobody can edit their own.
   */
  canEditRole(): boolean {
    return this.canAssignRole() && !this.isSelf();
  }

  isValid(): boolean {
    if (!this.model.fullName?.trim()) return false;
    if (!this.model.email?.trim()) return false;

    if (this.data.mode === 'create') {
      return !!this.model.password && this.model.password.length >= 6;
    }
    if (this.model.password && this.model.password.length < 6) return false;
    return true;
  }

  async save() {
    if (!this.isValid()) return;

    // Non-admins can only ever create/update USER accounts.
    // (The backend must also enforce this — the client is not a security boundary.)
    const role: UserRole = this.canAssignRole()
  ? (this.model.role ?? 'USER')
  : 'USER';

    // Safety net: block self-demotion and self-disable even if the UI was bypassed.
    if (this.isSelf()) {
      if (role !== 'ADMIN') {
        this.notify.error("You cannot remove your own admin role.");
        return;
      }
      if (!this.model.active) {
        this.notify.error("You cannot disable your own account.");
        return;
      }
    }

    this.submitting = true;
    try {
      if (this.data.mode === 'create') {
        const created = await this.userService.create({
          fullName: this.model.fullName,
          email: this.model.email,
          password: this.model.password,
          role,
          active: this.model.active,
        });
        this.dialogRef.close(created);
      } else if (this.data.user) {
        const payload: AdminUserInput = {
          fullName: this.model.fullName,
          email: this.model.email,
          role,
          active: this.model.active,
        };
        if (this.model.password) {
          payload.password = this.model.password;
        }

        const updated = await this.userService.update(this.data.user.id, payload);
        this.dialogRef.close(updated);
      }
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Save failed');
    } finally {
      this.submitting = false;
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}