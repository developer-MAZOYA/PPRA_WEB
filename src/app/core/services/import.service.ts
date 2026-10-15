import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface AssetDraft {
  row?: number;
  assetType?: string;
  model?: string;
  serialNumber?: string;
  barcode?: string;
  status?: string;
  condition?: string;
  allocatedTo?: string;
  allocatedEmail?: string;
  issues?: string[];
  level?: string;
}

export interface ImportPreview {
  fileName: string;
  method?: string;
  rowCount: number;
  rows: AssetDraft[];
  notes?: string[];
}

export interface ImportResult {
  created: number;
  skipped: number;
  messages?: string[];
}

// ═══════════════════════════════════════════
// Service
// ═══════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class ImportService {

  private gql = inject(GraphqlService);

  /**
   * Upload a file (PDF/XLSX/DOCX/CSV/TXT), have the AI parse it,
   * and return a preview of the parsed rows.
   */
  async preview(filename: string, file: File, instruction?: string): Promise<ImportPreview> {
    const fileBase64 = await this.fileToBase64(file);

    const q = `
      mutation PreviewImport(
        $filename: String!
        $fileBase64: String!
        $instruction: String
      ) {
        previewImport(
          filename: $filename
          fileBase64: $fileBase64
          instruction: $instruction
        ) {
          fileName
          method
          rowCount
          notes
          rows {
            row
            assetType
            model
            serialNumber
            barcode
            status
            condition
            allocatedTo
            allocatedEmail
            issues
            level
          }
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { filename, fileBase64, instruction })
    );
    return r.previewImport;
  }

  /**
   * Confirm and persist the (possibly edited) drafts.
   * Returns counts of created & skipped rows.
   */
  async confirm(rows: AssetDraft[]): Promise<ImportResult> {
    const q = `
      mutation ConfirmImport($rows: [AssetDraftInput!]!) {
        confirmImport(rows: $rows) {
          created
          skipped
          messages
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { rows })
    );
    return r.confirmImport;
  }

  // ---------- Helpers ----------

  /**
   * Convert a File to a raw base64 string (no data URL prefix).
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result looks like "data:application/pdf;base64,JVBERi0x..."
        const base64 = result.split(',')[1] ?? '';
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}