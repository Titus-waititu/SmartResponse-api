export class User {
  id: string;
  email: string;
  username: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // For Google OAuth
  displayName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
