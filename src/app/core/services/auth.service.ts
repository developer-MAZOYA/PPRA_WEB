import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { User } from '../models/user.model';

const TOKEN_KEY = 'ppra_ams_jwt';
const USER_KEY = 'ppra_ams_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private gql = inject(GraphqlService);
  private router = inject(Router);

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !this.isExpired(token)) {
      this.isAuthenticated.set(true);
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        try { this.currentUser.set(JSON.parse(userJson)); } catch { /* ignore */ }
      }
    } else {
      this.clear();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const query = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password)
      }
    `;
    const res: any = await firstValueFrom(this.gql.request(query, { email, password }));
    const token: string = res?.login;
    if (!token) throw new Error('No token returned');

    localStorage.setItem(TOKEN_KEY, token);

    const payload = this.decode(token);
    const user: User = {
      id: String(payload.uid),
      email: payload.sub,
      fullName: payload.name,
      role: payload.role,
      active: true,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  async register(fullName: string, email: string, password: string): Promise<void> {
    const query = `
      mutation Register($input: UserInput!) {
        register(input: $input) { id email role }
      }
    `;
    await firstValueFrom(this.gql.request(query, { input: { fullName, email, password } }));
  }

  handleExternalToken(token: string): void {
    if (!token) throw new Error('No token provided');
    if (this.isExpired(token)) throw new Error('Token expired');

    localStorage.setItem(TOKEN_KEY, token);

    const payload = this.decode(token);
    const user: User = {
      id: String(payload.uid),
      email: payload.sub,
      fullName: payload.name,
      role: payload.role,
      active: true,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout(redirect = true): void {
    this.clear();
    if (redirect) this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  private clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  private decode(token: string): any {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return {};
    }
  }

  private isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }
}