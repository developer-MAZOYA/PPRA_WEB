export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface AuthPayload {
  token: string;
}

