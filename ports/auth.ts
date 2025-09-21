export interface AuthSession {
  userId: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface AuthPort {
  getSession(): Promise<AuthSession>;
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}
