import type { Session } from "../../types";

export interface SessionRepository {
  create(token: string, expiresAt: string): Promise<void>;
  getByToken(token: string): Promise<Session | null>;
  delete(token: string): Promise<void>;
}
