import {
  Component, inject, signal, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../core/services/chat.service';
import { ReportService, ReportPlan } from '../../core/services/report.service';
import { ImportService } from '../../core/services/import.service';
import { DraftStoreService } from '../../core/services/draft-store.service';
import { NotificationService } from '../../core/services/notification.service';

type MessageKind = 'text' | 'report-plan' | 'import-preview';

interface ChatMessage {
  role: 'user' | 'assistant';
  kind: MessageKind;
  text: string;
  timestamp: Date;
  plan?: ReportPlan;
  draftCount?: number;
}

@Component({
  selector: 'app-chat-widget',
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <!-- Floating Button -->
    <button class="chat-fab"
            matTooltip="Ask, generate reports, or import files"
            [matTooltipPosition]="'left'"
            (click)="toggle()">
      <mat-icon>{{ open() ? 'close' : 'smart_toy' }}</mat-icon>
    </button>

    <!-- Chat Panel -->
    @if (open()) {
      <div class="chat-panel">

        <!-- Header -->
        <div class="chat-header">
          <div class="header-brand">
            <div class="header-icon"><mat-icon>smart_toy</mat-icon></div>
            <div class="header-text">
              <strong>PPRA Assistant</strong>
              <small>Ask · Report · Import</small>
            </div>
          </div>
          <button mat-icon-button class="header-close" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Messages -->
        <div class="chat-body" #messageContainer>
          @if (!messages().length) {
            <div class="welcome">
              <mat-icon>waving_hand</mat-icon>
              <p>Hi! I can answer questions, build reports, or import asset files.</p>
              <div class="suggestions">
                <button class="suggestion" (click)="quickAsk('How many assets do we have?')">
                  How many assets do we have?
                </button>
                <button class="suggestion" (click)="quickAsk('List all stolen laptops')">
                  List all stolen laptops
                </button>
                <button class="suggestion" (click)="quickAsk('Generate a PDF report of HP laptops')">
                  📄 Generate a PDF report of HP laptops
                </button>
                <button class="suggestion" (click)="fileInput.click()">
                  📎 Upload a file to import
                </button>
              </div>
            </div>
          }

          @for (msg of messages(); track msg.timestamp) {
            <div class="message" [class.user]="msg.role === 'user'"
                                 [class.assistant]="msg.role === 'assistant'">
              <div class="message-avatar">
                <mat-icon>{{ msg.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
              </div>

              <div class="message-bubble">
                <!-- Plain text -->
                @if (msg.kind === 'text') {
                  <p>{{ msg.text }}</p>
                }

                <!-- Report plan -->
                @if (msg.kind === 'report-plan' && msg.plan) {
                  <p>{{ msg.text }}</p>
                  <div class="plan-summary">
                    <div class="plan-meta">
                      <span class="meta-item">
                        <strong>{{ msg.plan.total }}</strong> rows
                      </span>
                      <span class="meta-item format">
                        {{ (msg.plan.spec.format || 'xlsx') | uppercase }}
                      </span>
                    </div>
                    @if (msg.plan.spec.columns?.length) {
                      <div class="plan-columns">
                        @for (c of msg.plan.spec.columns!; track c) {
                          <span class="col-pill">{{ c }}</span>
                        }
                      </div>
                    }
                    <button class="plan-action-btn"
                            [disabled]="msg.plan.total === 0"
                            (click)="downloadReport(msg.plan)">
                      <mat-icon>download</mat-icon>
                      Download Report
                    </button>
                  </div>
                }

                <!-- Import preview -->
                @if (msg.kind === 'import-preview') {
                  <p>{{ msg.text }}</p>
                  @if (msg.draftCount) {
                    <div class="plan-summary">
                      <div class="plan-meta">
                        <span class="meta-item">
                          <strong>{{ msg.draftCount }}</strong> row(s) parsed
                        </span>
                      </div>
                      <button class="plan-action-btn" (click)="goToDraftPage()">
                        <mat-icon>edit_note</mat-icon>
                        Review & Confirm
                      </button>
                    </div>
                  }
                }

                <span class="message-time">
                  {{ msg.timestamp | date:'shortTime' }}
                </span>
              </div>
            </div>
          }

          @if (thinking()) {
            <div class="message assistant">
              <div class="message-avatar"><mat-icon>smart_toy</mat-icon></div>
              <div class="message-bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="chat-footer">
          <input type="file"
                 #fileInput
                 hidden
                 accept=".pdf,.xlsx,.xls,.docx,.txt,.csv"
                 (change)="onFileSelected($event)" />

          <div class="footer-actions">
            <button class="action-btn"
                    matTooltip="Import assets from a file"
                    [disabled]="thinking()"
                    (click)="fileInput.click()">
              <mat-icon>upload_file</mat-icon>
              <span>Import</span>
            </button>
          </div>

          <div class="footer-input">
            <input class="chat-input"
                   type="text"
                   name="question"
                   [(ngModel)]="question"
                   (keydown.enter)="send()"
                   [disabled]="thinking()"
                   placeholder="Ask a question or request a report..." />
            <button class="send-btn"
                    (click)="send()"
                    [disabled]="!question.trim() || thinking()">
              @if (thinking()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ═══════════ FLOATING BUTTON ═══════════ */
    .chat-fab {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: white; cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 6px 20px rgba(184, 134, 11, 0.4);
      z-index: 999;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(139, 105, 20, 0.5); }
      &:active { transform: scale(0.98); }
      mat-icon { font-size: 26px; height: 26px; width: 26px; }
    }

    /* ═══════════ PANEL ═══════════ */
    .chat-panel {
      position: fixed; bottom: 96px; right: 24px;
      width: 420px; height: 600px;
      max-height: calc(100vh - 120px);
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E5E7EB;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 24px 60px rgba(139, 105, 20, 0.15);
      display: flex; flex-direction: column;
      overflow: hidden; z-index: 998;
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════ HEADER ═══════════ */
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, #FEF9E7 0%, #FBEDBB 100%);
      border-bottom: 1px solid #F5E1A4;
    }
    .header-brand { display: flex; align-items: center; gap: 12px; }
    .header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #FFFFFF; display: grid; place-items: center;
      box-shadow: 0 2px 6px rgba(139, 105, 20, 0.15);
      mat-icon { font-size: 22px; height: 22px; width: 22px; color: #B8860B; }
    }
    .header-text {
      display: flex; flex-direction: column; line-height: 1.2;
      strong { font-size: 0.95rem; color: #78350F; }
      small { font-size: 0.72rem; color: #8B6914; opacity: 0.85; }
    }
    .header-close { color: #8B6914; &:hover { background: rgba(255,255,255,0.6); } }

    /* ═══════════ BODY ═══════════ */
    .chat-body {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      background: #FAFBFC;

      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
    }

    /* Welcome */
    .welcome {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 20px 12px;

      mat-icon { font-size: 40px; height: 40px; width: 40px; color: #B8860B; margin-bottom: 12px; }
      p { color: #6B7280; font-size: 0.9rem; margin: 0 0 20px; max-width: 300px; }
    }
    .suggestions { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .suggestion {
      background: #FFFFFF; border: 1px solid #E5E7EB;
      border-radius: 10px; padding: 10px 14px;
      font-size: 0.82rem; color: #4B5563; text-align: left;
      cursor: pointer; transition: all 0.2s ease;

      &:hover {
        border-color: #D4A017; background: #FFFDF5;
        color: #78350F; transform: translateX(2px);
      }
    }

    /* Messages */
    .message {
      display: flex; gap: 10px; align-items: flex-start;
      max-width: 92%;

      &.user {
        flex-direction: row-reverse; align-self: flex-end;
        .message-avatar { background: #D4A017; color: white; }
        .message-bubble {
          background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
          color: white;
          border-radius: 14px 14px 4px 14px;
          .message-time { color: rgba(255,255,255,0.75); }
        }
      }

      &.assistant {
        align-self: flex-start;
        .message-avatar { background: #FBEDBB; color: #78350F; }
        .message-bubble {
          background: #FFFFFF; border: 1px solid #E5E7EB;
          color: #1F2937; border-radius: 14px 14px 14px 4px;
          .message-time { color: #9CA3AF; }
        }
      }
    }
    .message-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: grid; place-items: center; flex-shrink: 0;
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }
    .message-bubble {
      padding: 10px 14px; position: relative;

      p {
        margin: 0; font-size: 0.88rem; line-height: 1.5;
        white-space: pre-wrap; word-break: break-word;
      }
      .message-time {
        display: block; font-size: 0.65rem; margin-top: 4px;
      }
    }

    /* Plan summary */
    .plan-summary {
      margin-top: 10px; padding-top: 10px;
      border-top: 1px dashed #E5E7EB;
    }
    .plan-meta {
      display: flex; gap: 10px; margin-bottom: 8px;
      font-size: 0.82rem;
    }
    .meta-item {
      color: #6B7280;
      strong { color: #78350F; font-size: 1rem; }
    }
    .meta-item.format {
      background: #FEF3C7; color: #92400E;
      padding: 2px 8px; border-radius: 10px;
      font-weight: 700; font-size: 0.72rem;
    }
    .plan-columns {
      display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0;
    }
    .col-pill {
      background: #FEF9E7; border: 1px solid #FBEDBB;
      padding: 3px 10px; border-radius: 14px;
      font-size: 0.72rem; color: #78350F;
    }
    .plan-action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; margin-top: 8px;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: white; border: none; border-radius: 8px;
      font-weight: 600; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(184, 134, 11, 0.35);
      }
      &:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; }
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }

    /* Typing */
    .typing {
      display: flex; gap: 4px; align-items: center; padding: 14px 18px;
      span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #B8A876;
        animation: bounce 1.4s infinite ease-in-out both;
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
      }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40%           { transform: scale(1);   opacity: 1; }
    }

    /* ═══════════ FOOTER ═══════════ */
    .chat-footer {
      display: flex; flex-direction: column; gap: 10px;
      padding: 12px;
      background: #FFFFFF;
      border-top: 1px solid #E5E7EB;
    }
    .footer-actions {
      display: flex; gap: 8px;
    }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      background: #FEF9E7;
      border: 1px solid #FBEDBB;
      border-radius: 8px;
      font-size: 0.78rem; font-weight: 600; color: #78350F;
      cursor: pointer; transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #FBEDBB; border-color: #D4A017;
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      mat-icon { font-size: 16px; height: 16px; width: 16px; color: #B8860B; }
    }
    .footer-input { display: flex; gap: 8px; }
    .chat-input {
      flex: 1;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 11px 14px;
      font-size: 0.88rem;
      color: #1F2937; outline: none;
      caret-color: #000000;
      transition: border-color 0.2s;

      &::placeholder { color: #9CA3AF; }
      &:focus {
        border-color: #D4A017;
        box-shadow: 0 0 0 3px rgba(212, 160, 23, 0.12);
      }
      &:disabled { background: #F9FAFB; cursor: not-allowed; }
    }
    .send-btn {
      width: 44px; height: 44px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%);
      color: white; cursor: pointer;
      display: grid; place-items: center;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(184, 134, 11, 0.35);
      }
      &:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }

    @media (max-width: 480px) {
      .chat-panel {
        width: calc(100vw - 24px);
        height: calc(100vh - 120px);
        right: 12px; bottom: 90px;
      }
      .chat-fab { bottom: 16px; right: 16px; }
    }
  `]
})
export class ChatWidget implements AfterViewChecked {

  private chatService = inject(ChatService);
  private reportService = inject(ReportService);
  private importService = inject(ImportService);
  private draftStore = inject(DraftStoreService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  @ViewChild('messageContainer') messageContainer?: ElementRef<HTMLDivElement>;

  readonly open = signal(false);
  readonly thinking = signal(false);
  readonly messages = signal<ChatMessage[]>([]);

  question = '';

  toggle() { this.open.update(v => !v); }
  close() { this.open.set(false); }

  // ---------- Simple text chat ----------
  async quickAsk(text: string) {
    this.question = text;
    await this.send();
  }

  async send() {
    const text = this.question.trim();
    if (!text || this.thinking()) return;

    // Route to report flow if the text looks like a report request
    if (this.looksLikeReportRequest(text)) {
      this.question = '';
      await this.quickReport(text);
      return;
    }

    this.pushMessage({ role: 'user', kind: 'text', text, timestamp: new Date() });
    this.question = '';
    this.thinking.set(true);

    try {
      const answer = await this.chatService.ask(text);
      this.pushMessage({ role: 'assistant', kind: 'text', text: answer, timestamp: new Date() });
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message || 'AI service unavailable';
      this.notify.error(msg);
      this.pushMessage({ role: 'assistant', kind: 'text', text: `⚠️ ${msg}`, timestamp: new Date() });
    } finally {
      this.thinking.set(false);
    }
  }

  /**
   * Broad detection: any of these routes the message to the report flow
   * instead of the chat pipeline.
   */
  private looksLikeReportRequest(text: string): boolean {
    const low = text.toLowerCase();

    // Direct triggers
    if (low.startsWith('report')) return true;
    if (low.startsWith('generate') || low.startsWith('create') || low.startsWith('make')) {
      if (low.includes('report')) return true;
      if (low.includes('pdf') || low.includes('excel') || low.includes('xlsx') || low.includes('csv')) return true;
    }

    // Phrase triggers
    const phrases = [
      'generate report', 'generate a report',
      'generate a pdf', 'generate pdf',
      'create report', 'create a report', 'create a pdf',
      'make report', 'make a report', 'make a pdf',
      'give me a report', 'give me a pdf',
      'i need a report', 'i need a pdf',
      'i need a excel', 'i need an excel',
      'download report', 'download a report',
      'export report', 'export as',
      'save as pdf', 'save as excel',
      'as pdf', 'as excel', 'as xlsx', 'as csv', 'as spreadsheet',
      'report as',
      'pdf report', 'excel report', 'csv report',
      'report of', 'report on', 'report for',
      'report listing', 'report showing',
    ];
    return phrases.some(p => low.includes(p));
  }

  // ---------- Report flow ----------
  async quickReport(instruction: string) {
    this.pushMessage({
      role: 'user', kind: 'text',
      text: `📄 Generate report: ${instruction}`,
      timestamp: new Date()
    });
    this.thinking.set(true);

    try {
      const plan = await this.reportService.plan(instruction);
      this.pushMessage({
        role: 'assistant',
        kind: 'report-plan',
        text: plan.narrative || `Report plan ready — ${plan.total} rows will be included.`,
        timestamp: new Date(),
        plan,
      });
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message || 'Report planning failed';
      this.notify.error(msg);
      this.pushMessage({ role: 'assistant', kind: 'text', text: `⚠️ ${msg}`, timestamp: new Date() });
    } finally {
      this.thinking.set(false);
    }
  }

  async downloadReport(plan: ReportPlan) {
    try {
      const file = await this.reportService.generate(plan.spec, plan.narrative);
      this.reportService.download(file);
      this.notify.success('Report downloaded');
    } catch (err: any) {
      this.notify.error(err?.response?.errors?.[0]?.message || 'Download failed');
    }
  }

  // ---------- Import flow ----------
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pushMessage({
      role: 'user', kind: 'text',
      text: `📎 Uploaded: ${file.name}`,
      timestamp: new Date()
    });
    this.thinking.set(true);

    try {
      const preview = await this.importService.preview(file.name, file);
      this.draftStore.set(preview.rows);
      this.pushMessage({
        role: 'assistant',
        kind: 'import-preview',
        text: `I parsed ${preview.rows.length} row(s) from "${file.name}". Click below to review and confirm.`,
        timestamp: new Date(),
        draftCount: preview.rows.length,
      });
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message || 'Preview failed';
      this.notify.error(msg);
      this.pushMessage({ role: 'assistant', kind: 'text', text: `⚠️ ${msg}`, timestamp: new Date() });
    } finally {
      this.thinking.set(false);
      input.value = '';
    }
  }

  goToDraftPage() {
    this.close();
    this.router.navigate(['/assets/draft']);
  }

  // ---------- Helpers ----------
  private pushMessage(msg: ChatMessage) {
    this.messages.update(list => [...list, msg]);
  }

  ngAfterViewChecked() {
    const el = this.messageContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}