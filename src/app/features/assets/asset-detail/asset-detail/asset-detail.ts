import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AssetService } from '../../../../core/services/asset.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Asset, AssetAssignment, AssetCondition, AssetStatus
} from '../../../../core/models/asset.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-asset-detail',
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatExpansionModule, MatTooltipModule, MatDialogModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <button mat-icon-button (click)="goBack()" matTooltip="Back">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ asset()?.barcode }}</h1>
        </div>
        @if (auth.isAdmin() && asset()) {
          <button mat-stroked-button color="primary" [routerLink]="['/assets', asset()!.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!asset()) {
        <mat-card class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <p>Asset not found.</p>
        </mat-card>
      } @else {
        <!-- ===== Asset Info Card ===== -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>{{ asset()!.assetType }}</mat-card-title>
            <mat-card-subtitle>{{ asset()!.model }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <label>Barcode</label>
                <span>{{ asset()!.barcode }}</span>
              </div>
              <div class="info-item">
                <label>Serial Number</label>
                <span>{{ asset()!.serialNumber }}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="chip" [ngClass]="'status-' + asset()!.status.toLowerCase()">
                  {{ asset()!.status }}
                </span>
              </div>
              <div class="info-item">
                <label>Condition</label>
                <span>{{ asset()!.condition }}</span>
              </div>
              @if (asset()!.createdAt) {
                <div class="info-item">
                  <label>Created</label>
                  <span>{{ asset()!.createdAt | date:'medium' }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ===== Assign / Return Actions (Admin only) ===== -->
        @if (auth.isAdmin()) {
          <mat-card class="action-card">
            <mat-card-header>
              <mat-card-title>
                {{ asset()!.status === 'ASSIGNED' ? 'Return Asset' : 'Assign Asset' }}
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              @if (asset()!.status === 'ASSIGNED') {
                <p class="action-hint">
                  This asset is currently assigned.
                  @if (currentAssignment()) {
                    <strong> To: {{ currentAssignment()!.user.fullName }}</strong>
                    since {{ currentAssignment()!.assignedAt | date:'medium' }}.
                  }
                </p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Return Notes</mat-label>
                  <textarea matInput rows="2" [(ngModel)]="returnNotes"
                            placeholder="Condition of returned item"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Condition at Return</mat-label>
                  <mat-select [(ngModel)]="returnCondition">
                    @for (c of conditions; track c) {
                      <mat-option [value]="c">{{ c }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <button mat-flat-button color="warn"
                        (click)="submitReturn()"
                        [disabled]="!returnCondition || actionLoading()">
                  @if (actionLoading()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <span><mat-icon>assignment_return</mat-icon> Mark as Returned</span>
                  }
                </button>
              } @else {
                <p class="action-hint">
                  Assign this asset to a user. The asset status will change to <strong>ASSIGNED</strong>.
                </p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Assign To</mat-label>
                  <mat-select [(ngModel)]="assignToUserId">
                    @for (u of users(); track u.id) {
                      <mat-option [value]="u.id">
                        {{ u.fullName }} ({{ u.email }})
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Assign Notes</mat-label>
                  <textarea matInput rows="2" [(ngModel)]="assignNotes"
                            placeholder="Reason, department, etc."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Condition at Assignment</mat-label>
                  <mat-select [(ngModel)]="assignCondition">
                    @for (c of conditions; track c) {
                      <mat-option [value]="c">{{ c }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <button mat-flat-button color="primary"
                        (click)="submitAssign()"
                        [disabled]="!assignToUserId || actionLoading()">
                  @if (actionLoading()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <span><mat-icon>assignment_ind</mat-icon> Assign Asset</span>
                  }
                </button>
              }
            </mat-card-content>
          </mat-card>
        }

        <!-- ===== Assignment History ===== -->
        <mat-card class="history-card">
          <mat-card-header>
            <mat-card-title>Assignment History</mat-card-title>
            <mat-card-subtitle>{{ history().length }} record(s)</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            @if (!history().length) {
              <p class="no-history">This asset has never been assigned.</p>
            } @else {
              <mat-accordion>
                @for (h of history(); track h.id) {
                  <mat-expansion-panel [expanded]="h.open">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        {{ h.user.fullName }}
                        <span class="badge" [ngClass]="h.open ? 'badge-open' : 'badge-closed'">
                          {{ h.open ? 'ASSIGNED' : 'RETURNED' }}
                        </span>
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ h.assignedAt | date:'medium' }}
                        @if (h.returnedAt) {
                          <span> → {{ h.returnedAt | date:'medium' }}</span>
                        }
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="history-body">
                      <div class="history-row">
                        <label>Assigned By:</label>
                        <span>{{ h.assignedBy }}</span>
                      </div>
                      @if (h.assignedAt) {
                        <div class="history-row">
                          <label>Assigned At:</label>
                          <span>{{ h.assignedAt | date:'medium' }}</span>
                        </div>
                      }
                      @if (h.conditionAtAssign) {
                        <div class="history-row">
                          <label>Condition (Assign):</label>
                          <span>{{ h.conditionAtAssign }}</span>
                        </div>
                      }
                      @if (h.assignNotes) {
                        <div class="history-row">
                          <label>Notes:</label>
                          <span>{{ h.assignNotes }}</span>
                        </div>
                      }

                      @if (!h.open) {
                        <mat-divider></mat-divider>
                        <div class="history-row">
                          <label>Returned By:</label>
                          <span>{{ h.returnedBy }}</span>
                        </div>
                        @if (h.returnedAt) {
                          <div class="history-row">
                            <label>Returned At:</label>
                            <span>{{ h.returnedAt | date:'medium' }}</span>
                          </div>
                        }
                        @if (h.conditionAtReturn) {
                          <div class="history-row">
                            <label>Condition (Return):</label>
                            <span>{{ h.conditionAtReturn }}</span>
                          </div>
                        }
                        @if (h.returnNotes) {
                          <div class="history-row">
                            <label>Return Notes:</label>
                            <span>{{ h.returnNotes }}</span>
                          </div>
                        }
                      }
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1000px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      > div { display: flex; align-items: center; gap: 12px; }
    }

    h1 { margin: 0; font-size: 1.4rem; }

    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state {
      padding: 60px;
      text-align: center;

      mat-icon { font-size: 64px; height: 64px; width: 64px; color: #ccc; }
    }

    .info-card, .action-card, .history-card {
      margin-bottom: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #888;
        font-weight: 600;
      }

      span { font-size: 0.95rem; }
    }

    .chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      width: fit-content;
    }

    .status-available         { background: #d4edda; color: #155724; }
    .status-assigned          { background: #cce5ff; color: #004085; }
    .status-under_maintenance { background: #fff3cd; color: #856404; }
    .status-retired           { background: #e2e3e5; color: #383d41; }
    .status-lost              { background: #f8d7da; color: #721c24; }

    .action-hint {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      color: #555;
    }

    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }

    button mat-icon { margin-right: 4px; }

    .no-history {
      color: #888;
      padding: 20px 0;
      text-align: center;
    }

    .badge {
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-open   { background: #cce5ff; color: #004085; }
    .badge-closed { background: #d4edda; color: #155724; }

    .history-body {
      padding: 12px 0;

      mat-divider { margin: 12px 0; }
    }

    .history-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 0.9rem;

      label {
        min-width: 160px;
        color: #666;
        font-weight: 500;
      }

      span { color: #222; }
    }

    /* Clear, consistent surfaces in the shared dark theme */
    :host-context(html.ppra-dark) .page { color: #e8eef5; padding: 32px 40px; }
    :host-context(html.ppra-dark) h1 { color: #f1f5fa; letter-spacing: -.025em; }
    :host-context(html.ppra-dark) .info-card,
    :host-context(html.ppra-dark) .action-card,
    :host-context(html.ppra-dark) .history-card,
    :host-context(html.ppra-dark) .empty-state {
      background: #18273a !important;
      color: #e8eef5;
      border: 1px solid rgba(210,226,242,.11);
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(0,0,0,.14);
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-card-title { color: #f0f5fa; }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-card-subtitle { color: #aab9ca; }
    :host-context(html.ppra-dark) .info-item label,
    :host-context(html.ppra-dark) .history-row label { color: #9db0c4; }
    :host-context(html.ppra-dark) .info-item > span,
    :host-context(html.ppra-dark) .history-row span { color: #e4ecf4; }
    :host-context(html.ppra-dark) .action-hint {
      background: #20364c;
      border: 1px solid rgba(123,173,210,.14);
      color: #cfdae5;
    }
    :host-context(html.ppra-dark) .action-hint strong { color: #fff; }
    :host-context(html.ppra-dark) .no-history { color: #aab9ca; }
    :host-context(html.ppra-dark) .history-row label { min-width: 160px; }
    :host-context(html.ppra-dark) ::ng-deep .mat-expansion-panel {
      background: #1d3046;
      border: 1px solid rgba(210,226,242,.1);
      box-shadow: none;
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-expansion-panel-header,
    :host-context(html.ppra-dark) ::ng-deep .mat-expansion-panel-header-title,
    :host-context(html.ppra-dark) ::ng-deep .mat-expansion-panel-header-description {
      color: #e4ecf4;
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-expansion-panel-body { color: #e4ecf4; }
    :host-context(html.ppra-dark) ::ng-deep .mat-divider { border-top-color: rgba(210,226,242,.14); }
    :host-context(html.ppra-dark) .mat-mdc-form-field {
      --mdc-outlined-text-field-input-text-color: #edf3f9;
      --mdc-outlined-text-field-label-text-color: #aab9ca;
      --mdc-outlined-text-field-outline-color: rgba(191,210,230,.26);
      --mdc-outlined-text-field-hover-outline-color: rgba(244,189,69,.55);
      --mdc-outlined-text-field-focus-outline-color: #f4bd45;
    }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-input-element,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-select-value,
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-select-arrow { color: #edf3f9 !important; }
    :host-context(html.ppra-dark) ::ng-deep .mat-mdc-input-element::placeholder { color: #91a4b9; opacity: 1; }
    @media (max-width: 700px) {
      :host-context(html.ppra-dark) .page { padding: 20px 16px; }
      :host-context(html.ppra-dark) .history-row { flex-wrap: wrap; }
    }
  `]
})
export class AssetDetail implements OnInit {
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly asset = signal<Asset | null>(null);
  readonly history = signal<AssetAssignment[]>([]);
  readonly users = signal<User[]>([]);
  readonly currentAssignment = signal<AssetAssignment | null>(null);

  readonly conditions = Object.values(AssetCondition);

  // Form state
  assignToUserId: string | null = null;
  assignNotes = '';
  assignCondition: AssetCondition = AssetCondition.GOOD;

  returnNotes = '';
  returnCondition: AssetCondition = AssetCondition.GOOD;

  readonly auth = inject(AuthService);

  private assetService = inject(AssetService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private assetId = '';

  async ngOnInit() {
    this.assetId = this.route.snapshot.paramMap.get('id')!;
    await this.load();

    if (this.auth.isAdmin()) {
      await this.loadUsers();
    }
  }

  private async load() {
    this.loading.set(true);
    try {
      const [asset, history] = await Promise.all([
        this.assetService.get(this.assetId),
        this.assetService.history(this.assetId)
      ]);
      this.asset.set(asset);
      this.history.set(history);
      this.currentAssignment.set(history.find(h => h.open) ?? null);

      // Pre-fill form defaults
      if (asset.condition) {
        this.assignCondition = asset.condition;
        this.returnCondition = asset.condition;
      }
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load asset');
      this.router.navigate(['/assets']);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadUsers() {
    try {
      const list = await this.userService.list();
      this.users.set(list.filter(u => u.active));
    } catch (err: any) {
      this.notify.error('Failed to load users');
    }
  }

  async submitAssign() {
    if (!this.assignToUserId) return;

    this.actionLoading.set(true);
    try {
      await this.assetService.assign(
        this.assetId,
        this.assignToUserId,
        this.assignNotes,
        this.assignCondition
      );
      this.notify.success('Asset assigned');
      this.resetForms();
      await this.load();
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Assignment failed');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async submitReturn() {
    if (!this.returnCondition) return;

    this.actionLoading.set(true);
    try {
      await this.assetService.returnAsset(
        this.assetId,
        this.returnNotes,
        this.returnCondition
      );
      this.notify.success('Asset returned');
      this.resetForms();
      await this.load();
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Return failed');
    } finally {
      this.actionLoading.set(false);
    }
  }

  private resetForms() {
    this.assignToUserId = null;
    this.assignNotes = '';
    this.assignCondition = AssetCondition.GOOD;
    this.returnNotes = '';
    this.returnCondition = AssetCondition.GOOD;
  }

  goBack() {
    this.router.navigate(['/assets']);
  }
}
