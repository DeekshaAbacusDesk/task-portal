export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

/** Claims carried in the JWT and attached to authenticated requests. */
export interface AuthPrincipal {
  id: string;
  email: string;
}
