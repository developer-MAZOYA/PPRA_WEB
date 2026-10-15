import { Injectable } from '@angular/core';
import { GraphQLClient } from 'graphql-request';
import { from, Observable } from 'rxjs';

const GRAPHQL_URL = 'http://localhost:8080/graphql';
const TOKEN_KEY = 'ppra_ams_jwt';

@Injectable({ providedIn: 'root' })
export class GraphqlService {

  request<T = any>(query: string, variables?: Record<string, any>): Observable<T> {
    const client = new GraphQLClient(GRAPHQL_URL, {
      headers: this.buildHeaders(),
    });
    return from(client.request<T>(query, variables));
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
}