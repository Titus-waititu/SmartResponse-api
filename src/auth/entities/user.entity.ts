export class User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
