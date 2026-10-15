import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/user.model';
import { UserDialog, UserDialogData } from '../user-list/user-dialog';

@Component({
  selector: 'app-user-list',
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatDialogModule,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>Users</h1>
          <p class="subtitle">Manage user accounts and permissions</p>
        </div>
        <button mat-flat-button class="create-btn" (click)="openCreate()">
          <mat-icon>person_add</mat-icon>
          <span>New User</span>
        </button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search users</mat-label>
        <input matInput [(ngModel)]="searchText" (ngModelChange)="onSearch($event)"
               placeholder="Name, email, or role">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!filtered().length) {
        <div class="empty-state">
          <mat-icon>people_outline</mat-icon>
          <p>No users found</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table mat-table [dataSource]="filtered()" class="user-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <div class="avatar" [ngClass]="'role-' + u.role.toLowerCase()">
                    {{ initials(u.fullName) }}
                  </div>
                  <div class="user-info-cell">
                    <span class="user-name">{{ u.fullName }}</span>
                    <span class="user-email">{{ u.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let u">
                <span class="role-chip" [ngClass]="'role-' + u.role.toLowerCase()">
                  {{ u.role }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let u">
                <span class="status" [ngClass]="u.active ? 'active' : 'inactive'">
                  <span class="dot"></span>
                  {{ u.active ? 'Active' : 'Disabled' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u" class="actions-cell">
                <button mat-icon-button matTooltip="Edit user"
                        (click)="openEdit(u)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button
                        [matTooltip]="u.active ? 'Disable user' : 'Enable user'"
                        (click)="toggleStatus(u)">
                  <mat-icon>{{ u.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 32px 40px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ---------- Header ---------- */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
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

    .create-btn {
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%) !important;
      color: white !important;
      font-weight: 600;
      height: 44px;
      border-radius: 10px;
      padding: 0 20px;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
      transition: all 0.2s ease;

      &:hover {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
        box-shadow: 0 6px 18px rgba(139, 105, 20, 0.35);
        transform: translateY(-1px);
      }

      mat-icon { margin-right: 6px; }
    }

    /* ---------- Search ---------- */
    .search-field {
      width: 100%;
      max-width: 400px;
      margin-bottom: 20px;
    }

    /* ---------- Loading / Empty ---------- */
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state {
      padding: 60px;
      text-align: center;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;

      mat-icon {
        font-size: 56px;
        height: 56px;
        width: 56px;
        color: #D1D5DB;
        margin-bottom: 12px;
      }

      p { color: #6B7280; margin: 0; }
    }

    /* ---------- Table ---------- */
    .table-wrap {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      overflow: hidden;
    }

    .user-table { width: 100%; }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
      background: #FBEDBB;
      color: #8B6914;

      &.role-admin {
        background: #FEE2E2;
        color: #B91C1C;
      }
    }

    .user-info-cell {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .user-name {
      font-weight: 600;
      color: #1F2937;
      font-size: 0.9rem;
    }

    .user-email {
      font-size: 0.78rem;
      color: #6B7280;
    }

    .role-chip {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;

      &.role-admin { background: #FEE2E2; color: #B91C1C; }
      &.role-user  { background: #EFF6FF; color: #2563EB; }
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 500;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        display: inline-block;
      }

      &.active { color: #16A34A; }
      &.inactive { color: #DC2626; }
    }

    .actions-cell {
      text-align: right;
      width: 100px;
      white-space: nowrap;
    }

    ::ng-deep .user-table .mat-mdc-header-row {
      background: #F9FAFB;
    }

    ::ng-deep .user-table .mat-mdc-row:hover {
      background: #FFFDF5;
    }

    @media (max-width: 768px) {
      .page { padding: 20px 16px; }
      .page-header h1 { font-size: 1.4rem; }
      .create-btn { width: 100%; justify-content: center; }
      .search-field { max-width: 100%; }
    }
  `]
})
export class UserList implements OnInit {
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly searchText = signal('');

  readonly filtered = computed(() => {
    const term = this.searchText().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(u =>
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  readonly columns = ['name', 'role', 'active', 'actions'];

  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const list = await this.userService.list();
      this.users.set(list);
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(value: string) {
    this.searchText.set(value);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  // ---------- Create ----------
  openCreate() {
    const data: UserDialogData = { mode: 'create' };
    const ref = this.dialog.open(UserDialog, {
      data,
      width: '560px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    ref.afterClosed().subscribe(async (result?: User) => {
      if (result) {
        this.notify.success(`User "${result.fullName}" created`);
        await this.load();
      }
    });
  }

  // ---------- Edit ----------
  openEdit(user: User) {
    const data: UserDialogData = { mode: 'edit', user };
    const ref = this.dialog.open(UserDialog, {
      data,
      width: '560px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    ref.afterClosed().subscribe(async (result?: User) => {
      if (result) {
        this.notify.success('User updated');
        await this.load();
      }
    });
  }

  // ---------- Toggle ----------
  async toggleStatus(user: User) {
    const action = user.active ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} "${user.fullName}"?`)) return;

    try {
      const updated = await this.userService.toggleStatus(user.id);
      this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
      this.notify.success(`User ${action}d`);
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to update user');
    }
  }
}