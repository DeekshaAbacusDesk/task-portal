import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Config } from '../config/env.js';
import type { AuthPrincipal, User, UserRecord } from '../domain/user.js';
import type { UserRepository } from '../repositories/user.repository.js';
import { UnauthorizedError } from '../utils/errors.js';

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', 10);

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtConfig: Config['jwt'],
  ) {}

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const record = await this.users.findByEmail(email);
    const valid = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);

    // Same error for unknown email and wrong password — don't leak which one failed.
    if (!record || !valid) throw new UnauthorizedError('Invalid email or password');

    const principal: AuthPrincipal = { id: record.id, email: record.email };
    const token = jwt.sign(principal, this.jwtConfig.secret, {
      subject: record.id,
      expiresIn: this.jwtConfig.expiresIn as SignOptions['expiresIn'],
    });

    return { token, user: toPublicUser(record) };
  }

  verifyToken(token: string): AuthPrincipal {
    try {
      const payload = jwt.verify(token, this.jwtConfig.secret) as jwt.JwtPayload & AuthPrincipal;
      return { id: payload.id, email: payload.email };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async getUser(id: string): Promise<User> {
    const record = await this.users.findById(id);
    if (!record) throw new UnauthorizedError('User no longer exists');
    return toPublicUser(record);
  }
}

function toPublicUser({ id, name, email }: UserRecord): User {
  return { id, name, email };
}
