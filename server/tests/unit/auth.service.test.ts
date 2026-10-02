import bcrypt from 'bcryptjs';
import { beforeAll, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../../src/repositories/inMemoryUser.repository.js';
import { AuthService } from '../../src/services/auth.service.js';
import { UnauthorizedError } from '../../src/utils/errors.js';
import { DEMO_EMAIL, DEMO_PASSWORD, testConfig } from '../helpers.js';

describe('AuthService', () => {
  let auth: AuthService;

  beforeAll(async () => {
    const users = new InMemoryUserRepository([
      { id: 'u1', name: 'Demo User', email: DEMO_EMAIL, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 4) },
    ]);
    auth = new AuthService(users, testConfig().jwt);
  });

  it('issues a verifiable token for valid credentials (email is case-insensitive)', async () => {
    const { token, user } = await auth.login(DEMO_EMAIL.toUpperCase(), DEMO_PASSWORD);

    expect(user).toEqual({ id: 'u1', name: 'Demo User', email: DEMO_EMAIL });
    expect(user).not.toHaveProperty('passwordHash');
    expect(auth.verifyToken(token)).toEqual({ id: 'u1', email: DEMO_EMAIL });
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    const wrongPassword = auth.login(DEMO_EMAIL, 'nope');
    const unknownEmail = auth.login('nobody@test.dev', DEMO_PASSWORD);

    await expect(wrongPassword).rejects.toThrow('Invalid email or password');
    await expect(unknownEmail).rejects.toThrow('Invalid email or password');
  });

  it('rejects a tampered token', () => {
    expect(() => auth.verifyToken('not.a.jwt')).toThrow(UnauthorizedError);
  });
});
