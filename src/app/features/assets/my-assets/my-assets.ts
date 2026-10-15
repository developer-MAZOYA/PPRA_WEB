import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from '../../../core/services/graphql.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { AssetAssignment } from '../../../core/models/asset.model';

@Component({
  selector: 'app-my-assets',
  imports: [
    CommonModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatExpansionModule,
    MatDividerModule, MatChipsModule,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>My Assigned Assets</h1>
          <p class="subtitle">
            {{ current().length }} active
            @if (history().length) {
              · {{ history().length }} past
            }
          </p>
        </div>
      </div>

      <!-- ═══════════ CURRENT ASSETS ═══════════ -->
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (!current().length) {
        <mat-card class="empty">
          <mat-icon>inventory_2</mat-icon>
          <p>You have no assets assigned to you.</p>
        </mat-card>
      } @else {
        <div class="cards-grid">
          @for (a of current(); track a.id) {
            <mat-card class="asset-card">
              <mat-card-header>
                <div class="asset-icon">
                  <mat-icon>inventory_2</mat-icon>
                </div>
                <div class="asset-header-text">
                  <mat-card-title>{{ a.asset.assetType }}</mat-card-title>
                  <mat-card-subtitle>{{ a.asset.model }}</mat-card-subtitle>
                </div>
              </mat-card-header>

              <mat-card-content>
                <div class="info-row">
                  <span class="label">Barcode</span>
                  <span class="value">{{ a.asset.barcode }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Serial</span>
                  <span class="value">{{ a.asset.serialNumber }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Condition</span>
                  <span class="value">{{ a.asset.condition }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Assigned</span>
                  <span class="value">{{ a.assignedAt | date:'mediumDate' }}</span>
                </div>

                @if (a.assignNotes) {
                  <mat-divider></mat-divider>
                  <div class="notes">
                    <span class="label">Notes</span>
                    <p>{{ a.assignNotes }}</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- ═══════════ PAST ASSIGNMENTS ═══════════ -->
      @if (history().length) {
        <h2 class="section-title">Past Assignments</h2>

        <mat-accordion>
          @for (h of history(); track h.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  {{ h.asset.assetType }} — {{ h.asset.model }}
                </mat-panel-title>
                <mat-panel-description>
                  {{ h.assignedAt | date:'mediumDate' }}
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="history-body">
                <div class="info-row">
                  <span class="label">Barcode</span>
                  <span class="value">{{ h.asset.barcode }}</span>
                </div>
                @if (h.returnedAt) {
                  <div class="info-row">
                    <span class="label">Returned</span>
                    <span class="value">{{ h.returnedAt | date:'medium' }}</span>
                  </div>
                }
                @if (h.returnNotes) {
                  <div class="info-row">
                    <span class="label">Return Notes</span>
                    <span class="value">{{ h.returnNotes }}</span>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
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

    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty {
      padding: 60px;
      text-align: center;
      border-radius: 12px;

      mat-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        color: #D1D5DB;
        margin-bottom: 16px;
      }

      p {
        color: #6B7280;
        font-size: 1rem;
        margin: 0;
      }
    }

    /* ═══════════ CARDS ═══════════ */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .asset-card {
      display: flex;
      flex-direction: column;
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #FCD34D;
        box-shadow: 0 8px 24px rgba(251, 191, 36, 0.15);
        transform: translateY(-3px);
      }
    }

    mat-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 8px;
    }

    .asset-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #FEF3C7;
      display: grid;
      place-items: center;
      flex-shrink: 0;

      mat-icon {
        color: #B8860B;
        font-size: 24px;
        height: 24px;
        width: 24px;
      }
    }

    .asset-header-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    ::ng-deep .asset-header-text .mat-mdc-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    ::ng-deep .asset-header-text .mat-mdc-card-subtitle {
      font-size: 0.8rem;
      color: #6B7280;
      margin: 2px 0 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.85rem;

      .label {
        color: #9CA3AF;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-size: 0.7rem;
      }

      .value {
        color: #1F2937;
        font-weight: 500;
      }
    }

    .notes {
      margin-top: 12px;

      .label {
        color: #9CA3AF;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      p {
        margin: 6px 0 0;
        font-size: 0.85rem;
        color: #374151;
      }
    }

    /* ═══════════ HISTORY ═══════════ */
    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1F2937;
      margin: 40px 0 16px;
    }

    .history-body {
      padding: 12px 0;
    }

    ::ng-deep .mat-expansion-panel {
      border-radius: 10px !important;
      margin-bottom: 8px !important;
      border: 1px solid #E5E7EB !important;
      box-shadow: none !important;

      &.mat-expanded {
        border-color: #FCD34D !important;
      }
    }

    ::ng-deep .mat-expansion-panel-header {
      &:hover {
        background: #FFFDF5 !important;
      }
    }

    @media (max-width: 600px) {
      .page { padding: 20px 16px; }
      .page-header h1 { font-size: 1.4rem; }
      .cards-grid {
        grid-template-columns: 1fr;
        gap: 14px;
      }
    }
  `]
})
export class MyAssets implements OnInit {
  readonly loading = signal(true);
  readonly current = signal<AssetAssignment[]>([]);
  readonly history = signal<AssetAssignment[]>([]);

  private gql = inject(GraphqlService);
  private notify = inject(NotificationService);
  private auth = inject(AuthService);

  async ngOnInit() {
    try {
      const q = `
        query {
          myCurrentAssets {
            id assignedAt assignNotes
            asset { id assetType model serialNumber barcode condition status }
          }
          myAssetHistory {
            id assignedAt returnedAt returnNotes
            asset { id assetType model serialNumber barcode condition }
          }
        }
      `;
      const r: any = await firstValueFrom(this.gql.request(q));

      const current = r.myCurrentAssets ?? [];
      const allHistory = r.myAssetHistory ?? [];

      this.current.set(current);
      // Filter out open items from history to avoid showing them twice
      this.history.set(allHistory.filter((h: any) => !!h.returnedAt));
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load assets');
    } finally {
      this.loading.set(false);
    }
  }
}