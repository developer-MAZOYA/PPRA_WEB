import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DraftStoreService } from '../../../core/services/draft-store.service';
import { ImportService, AssetDraft, ImportResult } from '../../../core/services/import.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-asset-draft-page',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>Review Imported Assets</h1>
          <p class="subtitle">
            {{ rows().length }} row(s) parsed — verify the data before saving.
          </p>
        </div>
        <button mat-stroked-button (click)="cancel()" [disabled]="saving()">
          <mat-icon>arrow_back</mat-icon>
          Cancel
        </button>
      </div>

      @if (!rows().length) {
        <mat-card class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>No draft rows. Ask the assistant to import a file from the chat widget.</p>
        </mat-card>
      } @else {
        @for (row of rows(); track $index) {
          <mat-card class="draft-card" [class.has-issues]="row.issues?.length">
            <div class="draft-header">
              <div class="draft-num">{{ $index + 1 }}</div>
              <div class="draft-title">
                <strong>{{ row.model || 'New asset' }}</strong>
                <small>{{ row.serialNumber || '(no serial)' }}</small>
              </div>
              @if (row.issues?.length) {
                <div class="issue-badge">
                  <mat-icon>warning</mat-icon>
                  {{ row.issues!.length }} issue(s)
                </div>
              }
            </div>

            @if (row.issues?.length) {
              <div class="issue-list">
                @for (i of row.issues!; track i) {
                  <div class="issue-row"><mat-icon>info</mat-icon> {{ i }}</div>
                }
              </div>
            }

            <div class="draft-grid">
              <mat-form-field appearance="outline">
                <mat-label>Asset Type</mat-label>
                <input matInput [(ngModel)]="row.assetType" name="type-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Model</mat-label>
                <input matInput [(ngModel)]="row.model" name="model-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Serial Number</mat-label>
                <input matInput [(ngModel)]="row.serialNumber" name="serial-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Barcode</mat-label>
                <input matInput [(ngModel)]="row.barcode" name="barcode-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <input matInput [(ngModel)]="row.status" name="status-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Condition</mat-label>
                <input matInput [(ngModel)]="row.condition" name="condition-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Assigned To</mat-label>
                <input matInput [(ngModel)]="row.allocatedTo" name="allocatedTo-{{ $index }}" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Allocated Email</mat-label>
                <input matInput [(ngModel)]="row.allocatedEmail" name="email-{{ $index }}" />
              </mat-form-field>
            </div>
          </mat-card>
        }

        <div class="sticky-bar">
          <div class="bar-info">
            <mat-icon>info</mat-icon>
            <span>{{ rows().length }} row(s) will be imported</span>
          </div>
          <button mat-flat-button class="save-btn"
                  [disabled]="saving()"
                  (click)="save()">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <ng-container>
                <mat-icon>cloud_done</mat-icon>
                <span>Confirm & Save All</span>
              </ng-container>
            }
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { padding: 32px 40px; max-width: 1100px; margin: 0 auto; padding-bottom: 120px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 16px; margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0; font-size: 1.75rem; font-weight: 700;
      color: #1F2937; letter-spacing: -0.02em;
    }
    .subtitle { margin: 4px 0 0; color: #6B7280; font-size: 0.9rem; }

    .empty-state {
      padding: 60px; text-align: center;
      mat-icon {
        font-size: 60px; height: 60px; width: 60px;
        color: #D1D5DB; margin-bottom: 12px;
      }
      p { color: #6B7280; margin: 0; }
    }

    .draft-card {
      border-radius: 14px !important;
      border: 1px solid #E5E7EB;
      box-shadow: none !important;
      padding: 20px !important;
      margin-bottom: 16px;

      &.has-issues {
        border-color: #FCD34D;
        background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 30%);
      }
    }

    .draft-header {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 16px;
    }
    .draft-num {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: white; display: grid; place-items: center;
      font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
    }
    .draft-title {
      display: flex; flex-direction: column; gap: 2px; flex: 1;
      strong { font-size: 1rem; color: #1F2937; }
      small { font-size: 0.78rem; color: #6B7280; }
    }
    .issue-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #FEF3C7; color: #92400E;
      padding: 4px 10px; border-radius: 12px;
      font-size: 0.75rem; font-weight: 600;
      mat-icon { font-size: 14px; height: 14px; width: 14px; }
    }

    .issue-list {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .issue-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.82rem; color: #78350F;
      padding: 3px 0;
      mat-icon { font-size: 14px; height: 14px; width: 14px; color: #B8860B; }
    }

    .draft-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .sticky-bar {
      position: sticky; bottom: 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px;
      padding: 14px 20px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(139,105,20,0.08);
      z-index: 10;
    }
    .bar-info {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; color: #6B7280;
      mat-icon { font-size: 18px; height: 18px; width: 18px; color: #C9B47A; }
    }

    .save-btn {
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%) !important;
      color: white !important;
      font-weight: 600;
      height: 44px;
      border-radius: 8px;
      min-width: 180px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
        transform: translateY(-1px);
      }
      &:disabled { background: #E5E7EB !important; color: #9CA3AF !important; box-shadow: none; }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }

    @media (max-width: 600px) {
      .page { padding: 20px 16px; padding-bottom: 120px; }
      .draft-grid { grid-template-columns: 1fr; }
      .sticky-bar { flex-direction: column; align-items: stretch; }
      .save-btn { width: 100%; }
    }
  `]
})
export class AssetDraftPage {
  private draftStore = inject(DraftStoreService);
  private importService = inject(ImportService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  readonly rows = this.draftStore.rows;
  readonly saving = signal(false);

  async save() {
    if (!this.rows().length) return;
    this.saving.set(true);
    try {
      const result: ImportResult = await this.importService.confirm(this.rows());
      this.notify.success(`Imported ${result.created} asset(s), skipped ${result.skipped}`);
      this.draftStore.clear();
      this.router.navigate(['/assets']);
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Import failed');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    if (confirm('Discard this import?')) {
      this.draftStore.clear();
      this.router.navigate(['/dashboard']);
    }
  }
}