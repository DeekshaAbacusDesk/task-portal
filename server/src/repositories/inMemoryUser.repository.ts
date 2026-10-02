import type { UserRecord } from '../domain/user.js';
import type { UserRepository } from './user.repository.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, UserRecord>;

  constructor(users: UserRecord[] = []) {
    this.users = new Map(users.map((user) => [user.id, user]));
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalised = email.trim().toLowerCase();
    return [...this.users.values()].find((user) => user.email.toLowerCase() === normalised) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }
}
