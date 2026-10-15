import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface ReportSpec {
  title?: string;
  status?: string;
  condition?: string;
  assetType?: string;
  heldBy?: string;
  text?: string;
  groupBy?: string;
  columns?: string[];
  sortBy?: string;
  format?: string;
  includeSummary?: boolean;
  showRows?: boolean;
}

export interface ReportTable {
  name: string;
  counts?: Record<string, number>;
}

export interface ReportPlan {
  spec: ReportSpec;
  total: number;
  summaries?: ReportTable[];
  narrative?: string;
  sample?: Record<string, string>[];
  notes?: string[];
}

export interface ReportFile {
  filename: string;
  contentType: string;
  contentBase64: string;
}

// ═══════════════════════════════════════════
// Service
// ═══════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class ReportService {

  private gql = inject(GraphqlService);

  /**
   * Ask the AI to interpret a report request and produce a plan.
   * Returns a report spec, count, narrative, sample rows, and notes.
   */
  async plan(instruction: string): Promise<ReportPlan> {
    const q = `
      mutation PlanReport($instruction: String!) {
        planReport(instruction: $instruction) {
          total
          narrative
          notes
          sample
          summaries {
            name
            counts
          }
          spec {
            title
            status
            condition
            assetType
            heldBy
            text
            groupBy
            columns
            sortBy
            format
            includeSummary
            showRows
          }
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { instruction })
    );
    return r.planReport;
  }

  /**
   * Generate the actual file (xlsx/pdf/csv) from a spec.
   * Returns a base64-encoded payload ready to download.
   */
  async generate(spec: ReportSpec, narrative?: string): Promise<ReportFile> {
    const q = `
      mutation GenerateReport($spec: ReportSpecInput!, $narrative: String) {
        generateReport(spec: $spec, narrative: $narrative) {
          filename
          contentType
          contentBase64
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { spec, narrative })
    );
    return r.generateReport;
  }

  /**
   * Trigger a browser download from the base64 payload.
   * Creates a temporary <a> element and clicks it.
   */
  download(file: ReportFile): void {
    const byteString = atob(file.contentBase64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: file.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}