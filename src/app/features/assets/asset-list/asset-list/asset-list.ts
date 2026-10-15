import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../../../core/services/asset.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Asset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-asset-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule, MatChipsModule,
    MatFormFieldModule, MatInputModule,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>Assets</h1>
          <p class="subtitle">{{ filtered().length }} of {{ assets().length }} assets</p>
        </div>
        @if (auth.isAdmin()) {
          <button mat-flat-button class="create-btn" routerLink="/assets/new">
            <mat-icon>add</mat-icon> New Asset
          </button>
        }
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search assets</mat-label>
        <input matInput [(ngModel)]="searchText" (ngModelChange)="onSearch($event)"
               placeholder="Barcode, model, serial, or description">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!filtered().length) {
        <div class="empty-state">
          <mat-icon>inventory_2</mat-icon>
          <p>No assets found</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table mat-table [dataSource]="filtered()">

            <ng-container matColumnDef="barcode">
              <th mat-header-cell *matHeaderCellDef>Barcode</th>
              <td mat-cell *matCellDef="let a"><strong>{{ a.barcode }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let a">{{ a.assetType }}</td>
            </ng-container>

            <ng-container matColumnDef="model">
              <th mat-header-cell *matHeaderCellDef>Model</th>
              <td mat-cell *matCellDef="let a">{{ a.model }}</td>
            </ng-container>

            <ng-container matColumnDef="serial">
              <th mat-header-cell *matHeaderCellDef>Serial</th>
              <td mat-cell *matCellDef="let a">{{ a.serialNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let a">
                <span class="chip" [ngClass]="'status-' + a.status.toLowerCase()">
                  {{ a.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="condition">
              <th mat-header-cell *matHeaderCellDef>Condition</th>
              <td mat-cell *matCellDef="let a">{{ a.condition }}</td>
            </ng-container>

            <!-- 👇 NEW: Description column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let a">
                <span class="description-cell"
                      [matTooltip]="a.description || 'No description'">
                  {{ a.description || '—' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a" class="actions-cell">
                <button mat-icon-button [routerLink]="['/assets', a.id]" matTooltip="View">
                  <mat-icon>visibility</mat-icon>
                </button>
                @if (auth.isAdmin()) {
                  <button mat-icon-button (click)="deleteAsset(a)" matTooltip="Delete">
                    <mat-icon color="warn">delete</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
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

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
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

      &:hover {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
        box-shadow: 0 6px 18px rgba(139, 105, 20, 0.35);
      }

      mat-icon { margin-right: 6px; }
    }

    .search-field {
      width: 100%;
      max-width: 420px;
      margin-bottom: 20px;
    }

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

    .table-wrap {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      overflow: auto;
      max-height: calc(100vh - 320px);
    }

    table {
      width: 100%;
    }

    ::ng-deep .mat-mdc-header-row {
      background: #F9FAFB;
    }

    ::ng-deep .mat-mdc-row:hover {
      background: #FFFDF5;
    }

    .chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .status-available         { background: #DCFCE7; color: #15803D; }
    .status-assigned          { background: #DBEAFE; color: #1D4ED8; }
    .status-under_maintenance { background: #FEF3C7; color: #92400E; }
    .status-retired           { background: #E5E7EB; color: #4B5563; }
    .status-lost              { background: #FEE2E2; color: #B91C1C; }
    .status-stolen            { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }

    .description-cell {
      display: inline-block;
      max-width: 260px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.82rem;
      color: #6B7280;
      cursor: help;
    }

    .actions-cell {
      text-align: right;
      width: 100px;
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      .page { padding: 20px 16px; }
      .page-header h1 { font-size: 1.4rem; }
      .create-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class AssetList implements OnInit {
  readonly assets = signal<Asset[]>([]);
  readonly loading = signal(false);
  readonly searchText = signal('');

  readonly auth = inject(AuthService);

  readonly columns = [
    'barcode', 'type', 'model', 'serial',
    'status', 'condition', 'description', 'actions'
  ];

  private assetService = inject(AssetService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const list = await this.assetService.list();
      this.assets.set(list);
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load assets');
    } finally {
      this.loading.set(false);
    }
  }

  filtered(): Asset[] {
    const term = this.searchText().toLowerCase().trim();
    if (!term) return this.assets();
    return this.assets().filter(a =>
      (a.barcode ?? '').toLowerCase().includes(term) ||
      (a.model ?? '').toLowerCase().includes(term) ||
      (a.serialNumber ?? '').toLowerCase().includes(term) ||
      (a.assetType ?? '').toLowerCase().includes(term) ||
      (a.description ?? '').toLowerCase().includes(term)
    );
  }

  onSearch(value: string) {
    this.searchText.set(value);
  }

  async deleteAsset(asset: Asset) {
    if (!confirm(`Delete asset "${asset.barcode}"? This cannot be undone.`)) return;
    try {
      await this.assetService.remove(asset.id);
      this.notify.success('Asset deleted');
      await this.load();
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Delete failed');
    }
  }
}