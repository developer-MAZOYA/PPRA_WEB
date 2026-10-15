import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssetService, AssetSuggestion } from '../../../../core/services/asset.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Asset, AssetCondition, AssetInput, AssetStatus
} from '../../../../core/models/asset.model';

@Component({
  selector: 'app-asset-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page">

      <!-- ═══════════ HERO HEADER ═══════════ -->
      <div class="hero-header">
        <div class="hero-left">
          <button mat-icon-button type="button" class="back-btn" (click)="cancel()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="hero-icon">
            <mat-icon>{{ isEdit() ? 'edit' : 'add_box' }}</mat-icon>
          </div>
          <div class="hero-text">
            <h1>{{ isEdit() ? 'Edit Asset' : 'Register New Asset' }}</h1>
            <p class="subtitle">
              {{ isEdit()
                ? 'Update the details of this asset'
                : 'Fill manually or let the assistant do it' }}
            </p>
          </div>
        </div>

        <div class="hero-badge">
          <mat-icon>inventory_2</mat-icon>
          <span>{{ isEdit() ? 'Editing' : 'New' }}</span>
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="form-wrapper">

          <!-- ═══════════ AI ASSISTANT PANEL ═══════════ -->
          @if (!isEdit()) {
            <div class="ai-panel" [class.expanded]="aiOpen()">
              <div class="ai-header" (click)="aiOpen.set(!aiOpen())">
                <div class="ai-icon">
                  <mat-icon>auto_awesome</mat-icon>
                </div>
                <div class="ai-text">
                  <strong>Let the assistant fill this form</strong>
                  <small>Describe the asset in your own words</small>
                </div>
                <mat-icon class="ai-toggle">
                  {{ aiOpen() ? 'expand_less' : 'expand_more' }}
                </mat-icon>
              </div>

              @if (aiOpen()) {
                <div class="ai-body">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Describe the asset</mat-label>
                    <textarea matInput
                              rows="2"
                              [(ngModel)]="aiPrompt"
                              [ngModelOptions]="{ standalone: true }"
                              [disabled]="aiThinking()"
                              maxlength="500"
                              placeholder="e.g. Dell Latitude 5420, serial DL-5420-001, barcode BAR-DL-001, condition GOOD, MS Office 2024 | Windows 11"></textarea>
                    <mat-hint align="end">{{ aiPrompt.length }} / 500</mat-hint>
                  </mat-form-field>

                  <div class="ai-actions">
                    <button type="button"
                            mat-flat-button
                            class="ai-fill-btn"
                            [disabled]="aiThinking() || !aiPrompt.trim()"
                            (click)="fillWithAi()">
                      @if (aiThinking()) {
                        <mat-spinner diameter="16"></mat-spinner>
                      } @else {
                        <ng-container>
                          <mat-icon>auto_fix_high</mat-icon>
                          <span>Fill Fields</span>
                        </ng-container>
                      }
                    </button>
                  </div>

                  @if (aiMessage()) {
                    <div class="ai-message" [class.error]="aiError()">
                      <mat-icon>{{ aiError() ? 'error_outline' : 'info' }}</mat-icon>
                      <span>{{ aiMessage() }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ═══════════ SECTION 1: IDENTIFICATION ═══════════ -->
          <mat-card class="section-card">
            <div class="section-header">
              <div class="section-icon blue">
                <mat-icon>fingerprint</mat-icon>
              </div>
              <div class="section-text">
                <h2>Identification</h2>
                <p>How to identify this asset in the register</p>
              </div>
            </div>

            <mat-card-content>
              <div class="form-grid two-cols">

                <mat-form-field appearance="outline">
                  <mat-label>Serial Number</mat-label>
                  <input matInput name="serialNumber" [(ngModel)]="model.serialNumber"
                         required placeholder="e.g. VNY39C2D5"
                         [readonly]="isEdit()" />
                  <mat-icon matPrefix>qr_code</mat-icon>
                  @if (isEdit()) {
                    <mat-hint>Serial number cannot be changed</mat-hint>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Barcode</mat-label>
                  <input matInput name="barcode" [(ngModel)]="model.barcode"
                         required placeholder="e.g. TR092*003934" />
                  <mat-icon matPrefix>qr_code_scanner</mat-icon>
                </mat-form-field>

              </div>
            </mat-card-content>
          </mat-card>

          <!-- ═══════════ SECTION 2: CLASSIFICATION ═══════════ -->
          <mat-card class="section-card">
            <div class="section-header">
              <div class="section-icon yellow">
                <mat-icon>category</mat-icon>
              </div>
              <div class="section-text">
                <h2>Classification</h2>
                <p>Type, model and physical condition</p>
              </div>
            </div>

            <mat-card-content>
              <div class="form-grid two-cols">

                <mat-form-field appearance="outline">
                  <mat-label>Asset Type</mat-label>
                  <input matInput name="assetType" [(ngModel)]="model.assetType"
                         required placeholder="e.g. LAPTOP, PRINTER, DESK" />
                  <mat-icon matPrefix>devices</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Model</mat-label>
                  <input matInput name="model" [(ngModel)]="model.model"
                         required placeholder="e.g. HP EliteBook 840" />
                  <mat-icon matPrefix>memory</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Condition</mat-label>
                  <mat-select name="condition" [(ngModel)]="model.condition" required>
                    @for (c of conditions; track c) {
                      <mat-option [value]="c">{{ c }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>star_half</mat-icon>
                </mat-form-field>

                @if (isEdit()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Status</mat-label>
                    <mat-select name="status" [(ngModel)]="model.status">
                      @for (s of statuses; track s) {
                        <mat-option [value]="s">{{ s }}</mat-option>
                      }
                    </mat-select>
                    <mat-icon matPrefix>toggle_on</mat-icon>
                  </mat-form-field>
                }

              </div>
            </mat-card-content>
          </mat-card>

          <!-- ═══════════ SECTION 3: DESCRIPTION ═══════════ -->
          <mat-card class="section-card">
            <div class="section-header">
              <div class="section-icon indigo">
                <mat-icon>description</mat-icon>
              </div>
              <div class="section-text">
                <h2>Description</h2>
                <p>Software, antivirus, OS, or any additional notes</p>
              </div>
            </div>

            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput
                          name="description"
                          [(ngModel)]="model.description"
                          rows="4"
                          maxlength="500"
                          placeholder="e.g. MS Office 2024 | Kaspersky Endpoint Security - June 2027 | Windows 11 Pro"></textarea>
                <mat-hint align="end">{{ (model.description || '').length }} / 500</mat-hint>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- ═══════════ STICKY ACTION BAR ═══════════ -->
          <div class="action-bar">
            <div class="action-hint">
              <mat-icon>info</mat-icon>
              <span>
                @if (!isValid()) {
                  Fill in all required fields (marked with *)
                } @else {
                  All set — click {{ isEdit() ? 'Save Changes' : 'Create Asset' }}
                }
              </span>
            </div>
            <div class="action-buttons">
              <button mat-stroked-button type="button" (click)="cancel()" [disabled]="submitting()">
                Cancel
              </button>
              <button mat-flat-button class="save-btn"
                      type="button"
                      (click)="onSubmit()"
                      [disabled]="submitting() || !isValid()">
                @if (submitting()) {
                  <mat-spinner diameter="18"></mat-spinner>
                } @else {
                  <ng-container>
                    <mat-icon>{{ isEdit() ? 'save' : 'add' }}</mat-icon>
                    <span>{{ isEdit() ? 'Save Changes' : 'Create Asset' }}</span>
                  </ng-container>
                }
              </button>
            </div>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px 40px; max-width: 1000px; margin: 0 auto; }

    /* ═══════════ HERO HEADER ═══════════ */
    .hero-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 20px; flex-wrap: wrap; margin-bottom: 24px;
      padding-bottom: 20px; border-bottom: 1px solid #E5E7EB;
    }
    .hero-left { display: flex; align-items: center; gap: 16px; }
    .back-btn { color: #4B5563; transition: background 0.15s;
      &:hover { background: #F3F4F6; } }
    .hero-icon {
      width: 56px; height: 56px; border-radius: 14px;
      background: linear-gradient(135deg, #FEF9E7 0%, #FBEDBB 100%);
      border: 1px solid #F5E1A4;
      display: grid; place-items: center; flex-shrink: 0;
      mat-icon { font-size: 28px; height: 28px; width: 28px; color: #B8860B; }
    }
    .hero-text h1 {
      margin: 0; font-size: 1.6rem; font-weight: 700;
      color: #1F2937; letter-spacing: -0.02em;
    }
    .subtitle { margin: 4px 0 0; color: #6B7280; font-size: 0.9rem; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: white; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600;
      letter-spacing: 0.5px; text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
      mat-icon { font-size: 16px; height: 16px; width: 16px; }
    }
    .loading { display: flex; justify-content: center; padding: 60px; }

    /* ═══════════ FORM WRAPPER ═══════════ */
    .form-wrapper {
      display: flex; flex-direction: column; gap: 20px;
      padding-bottom: 100px;
    }

    /* ═══════════ AI PANEL ═══════════ */
    .ai-panel {
      background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
      border: 1px solid #DDD6FE;
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow 0.2s;

      &.expanded {
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.1);
      }
    }
    .ai-header {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;

      &:hover { background: rgba(255, 255, 255, 0.4); }
    }
    .ai-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      display: grid; place-items: center; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);

      mat-icon { color: white; font-size: 22px; height: 22px; width: 22px; }
    }
    .ai-text { flex: 1; display: flex; flex-direction: column; line-height: 1.2;
      strong { font-size: 0.95rem; color: #3730A3; }
      small { font-size: 0.78rem; color: #6366F1; margin-top: 2px; }
    }
    .ai-toggle { color: #6366F1; }

    .ai-body {
      padding: 4px 20px 20px;
      background: rgba(255, 255, 255, 0.5);
      border-top: 1px solid rgba(221, 214, 254, 0.6);
    }
    .ai-actions {
      display: flex; justify-content: flex-end; margin-top: 8px;
    }
    .ai-fill-btn {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%) !important;
      color: white !important;
      font-weight: 600;
      height: 42px;
      border-radius: 10px;
      min-width: 150px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(79, 70, 229, 0.4);
      }
      &:disabled {
        background: #E5E7EB !important;
        color: #9CA3AF !important;
        box-shadow: none;
      }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }
    .ai-message {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px;
      padding: 10px 14px;
      background: #EEF2FF;
      border-radius: 8px;
      font-size: 0.82rem;
      color: #3730A3;

      mat-icon { font-size: 16px; height: 16px; width: 16px; color: #4F46E5; }

      &.error {
        background: #FEF2F2; color: #991B1B;
        mat-icon { color: #DC2626; }
      }
    }

    /* ═══════════ SECTION CARDS ═══════════ */
    .section-card {
      border-radius: 14px !important;
      border: 1px solid #E5E7EB;
      box-shadow: none !important;
      padding: 0;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: #FCD34D;
        box-shadow: 0 4px 16px rgba(251, 191, 36, 0.08) !important;
      }
    }
    .section-header {
      display: flex; align-items: center; gap: 14px;
      padding: 18px 24px;
      background: linear-gradient(135deg, #FEF9E7 0%, #FBEDBB 100%);
      border-bottom: 1px solid #F5E1A4;
    }
    .section-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: #FFFFFF; display: grid; place-items: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(139, 105, 20, 0.1);
      mat-icon { font-size: 22px; height: 22px; width: 22px; }
      &.blue mat-icon { color: #2563EB; }
      &.yellow mat-icon { color: #D97706; }
      &.indigo mat-icon { color: #4F46E5; }
    }
    .section-text {
      h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #78350F; }
      p { margin: 2px 0 0; font-size: 0.8rem; color: #8B6914; opacity: 0.85; }
    }
    mat-card-content { padding: 24px !important; }

    /* ═══════════ FORM GRID ═══════════ */
    .form-grid { display: grid; gap: 20px; }
    .form-grid.two-cols { grid-template-columns: repeat(2, 1fr); }
    .full-width { width: 100%; }
    mat-icon[matPrefix] { margin-right: 8px; color: #C9B47A; transition: color 0.2s; }
    ::ng-deep .mat-mdc-form-field.mat-focused mat-icon[matPrefix] { color: #B8860B; }

    /* ═══════════ STICKY ACTION BAR ═══════════ */
    .action-bar {
      position: sticky; bottom: 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px;
      padding: 16px 24px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 12px 32px rgba(139,105,20,0.08);
      z-index: 10;
    }
    .action-hint {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; color: #6B7280;
      mat-icon { font-size: 18px; height: 18px; width: 18px; color: #C9B47A; }
    }
    .action-buttons { display: flex; gap: 10px; }
    .save-btn {
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%) !important;
      color: white !important;
      font-weight: 600;
      height: 44px; border-radius: 8px; min-width: 160px;
      box-shadow: 0 4px 12px rgba(184, 134, 11, 0.25);
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%) !important;
        transform: translateY(-1px);
      }
      &:disabled {
        background: #E5E7EB !important;
        color: #9CA3AF !important;
        box-shadow: none;
      }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }

    /* ═══════════ MATERIAL FIELD TWEAKS ═══════════ */
    ::ng-deep .mat-mdc-form-field.mat-focused {
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: #D4A017 !important;
      }
      .mat-mdc-floating-label { color: #8B6914 !important; }
    }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 900px) {
      .form-grid.two-cols { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .page { padding: 20px 16px; }
      .hero-header { flex-direction: column; align-items: flex-start; }
      .hero-text h1 { font-size: 1.3rem; }
      .action-bar { flex-direction: column; align-items: stretch; padding: 14px 16px; }
      .action-hint { justify-content: center; }
      .action-buttons { flex-direction: column-reverse;
        button { width: 100%; }
      }
    }
  `]
})
export class AssetForm implements OnInit {
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly isEdit = signal(false);

  // AI panel
  readonly aiOpen = signal(true);
  readonly aiThinking = signal(false);
  readonly aiMessage = signal<string | null>(null);
  readonly aiError = signal(false);
  aiPrompt = '';

  readonly conditions = Object.values(AssetCondition);
  readonly statuses = Object.values(AssetStatus);

  model: AssetInput = {
    assetType: '',
    model: '',
    serialNumber: '',
    barcode: '',
    condition: AssetCondition.NEW,
    description: '',
  };

  private assetId: string | null = null;

  private assetService = inject(AssetService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  async ngOnInit() {
    this.assetId = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!this.assetId);
    if (this.assetId) {
      this.aiOpen.set(false);   // hide AI panel in edit mode
      await this.loadAsset(this.assetId);
    }
  }

  private async loadAsset(id: string) {
    this.loading.set(true);
    try {
      const asset: Asset = await this.assetService.get(id);
      this.model = {
        assetType: asset.assetType,
        model: asset.model,
        serialNumber: asset.serialNumber,
        barcode: asset.barcode,
        condition: asset.condition,
        status: asset.status,
        description: asset.description ?? '',
      };
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Failed to load asset');
      this.router.navigate(['/assets']);
    } finally {
      this.loading.set(false);
    }
  }

  async fillWithAi() {
    const text = this.aiPrompt.trim();
    if (!text) return;

    this.aiThinking.set(true);
    this.aiMessage.set(null);
    this.aiError.set(false);

    try {
      const s: AssetSuggestion = await this.assetService.suggestFields(text);

      if (s.message) {
        this.aiMessage.set(s.message);
        this.aiError.set(true);
        return;
      }

      // Patch only the fields the AI returned
      let filled = 0;
      if (s.assetType)     { this.model.assetType = s.assetType; filled++; }
      if (s.model)         { this.model.model = s.model; filled++; }
      if (s.serialNumber)  { this.model.serialNumber = s.serialNumber; filled++; }
      if (s.barcode)       { this.model.barcode = s.barcode; filled++; }
      if (s.condition)     {
        this.model.condition = s.condition as AssetCondition;
        filled++;
      }
      if (s.description)   { this.model.description = s.description; filled++; }

      if (filled === 0) {
        this.aiMessage.set('The assistant could not find any fields in that description.');
        this.aiError.set(true);
      } else {
        this.aiMessage.set(`Filled ${filled} field${filled > 1 ? 's' : ''}. Review below and edit if needed.`);
        this.aiError.set(false);
        this.notify.success('Fields filled by AI');
      }
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message || 'AI fill failed';
      this.aiMessage.set(msg);
      this.aiError.set(true);
    } finally {
      this.aiThinking.set(false);
    }
  }

  isValid(): boolean {
    return !!(
      this.model.assetType?.trim() &&
      this.model.model?.trim() &&
      this.model.serialNumber?.trim() &&
      this.model.barcode?.trim() &&
      this.model.condition
    );
  }

  async onSubmit() {
    if (!this.isValid() || this.submitting()) return;

    this.submitting.set(true);
    try {
      if (this.isEdit() && this.assetId) {
        await this.assetService.update(this.assetId, this.model);
        this.notify.success('Asset updated');
        this.router.navigate(['/assets', this.assetId]);
      } else {
        const created = await this.assetService.create(this.model);
        this.notify.success('Asset registered');
        this.router.navigate(['/assets', created.id]);
      }
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Save failed');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    if (this.assetId) this.router.navigate(['/assets', this.assetId]);
    else this.router.navigate(['/assets']);
  }
}