import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { User, UserRole } from '../models/user.model';

export interface AdminUserInput {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private gql = inject(GraphqlService);

  async list(): Promise<User[]> {
    const q = `
      query {
        users {
          id
          fullName
          email
          role
          active
        }
      }
    `;
    const r: any = await firstValueFrom(this.gql.request(q));
    return r.users ?? [];
  }

  async create(input: AdminUserInput): Promise<User> {
    const q = `
      mutation AdminCreateUser($input: AdminUserInput!) {
        adminCreateUser(input: $input) {
          id
          fullName
          email
          role
          active
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, {
        input: {
          fullName: input.fullName,
          email: input.email,
          password: input.password,
          role: input.role,
          active: input.active,
        },
      })
    );
    return r.adminCreateUser;
  }

  async update(id: string, input: AdminUserInput): Promise<User> {
    const q = `
      mutation AdminUpdateUser($id: ID!, $input: AdminUserInput!) {
        adminUpdateUser(id: $id, input: $input) {
          id
          fullName
          email
          role
          active
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, {
        id,
        input: {
          fullName: input.fullName,
          email: input.email,
          password: input.password || null,
          role: input.role,
          active: input.active,
        },
      })
    );
    return r.adminUpdateUser;
  }

  async toggleStatus(id: string): Promise<User> {
    const q = `
      mutation ToggleUserStatus($id: ID!) {
        toggleUserStatus(id: $id) {
          id
          fullName
          email
          role
          active
        }
      }
    `;
    const r: any = await firstValueFrom(this.gql.request(q, { id }));
    return r.toggleUserStatus;
  }
}