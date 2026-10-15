import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private gql = inject(GraphqlService);

  /**
   * Send a question to the backend AI and get a response.
   * Uses the `askAssets` GraphQL query (admin-only).
   */
  async ask(question: string): Promise<string> {
    const q = `
      query AskAssets($question: String!) {
        askAssets(question: $question)
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { question })
    );
    return r.askAssets;
  }
}