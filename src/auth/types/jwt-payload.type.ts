import { UserRole } from "./user-role.type";

export interface JwtPayload {
  sub: string;
  email: string;
  role?: UserRole;
  username?: string;
  [key: string]: any;
}

export interface JwtPayloadWithRt extends JwtPayload {
  refreshToken: string;
}

export type JWTPayload = {
  sub: string;
  email: string;
  role: UserRole;
  username: string;
};
