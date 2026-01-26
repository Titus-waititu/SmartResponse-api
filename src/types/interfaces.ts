import { Request } from 'express';
import { UserRole } from 'src/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  username: string;
}

export interface JwtPayloadWithRt extends JwtPayload {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  tokens: TokenResponse;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  role: UserRole;
  username: string;
}

export interface ResetTokenPayload {
  userId: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

export interface QueryResult {
  total: string;
}

export interface AccidentReportStatistics {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  closedReports: number;
  severityBreakdown: {
    critical: number;
    severe: number;
    moderate: number;
    minor: number;
  };
  totals: {
    vehicles: number;
    injuries: number;
    fatalities: number;
  };
}

export interface InsuranceClaimStatistics {
  totalClaims: number;
  statusBreakdown: {
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  financialSummary: {
    totalEstimatedCost: number;
    totalApprovedAmount: number;
    approvalRate: number;
  };
}

export interface SystemStatistics {
  totalUsers: number;
  totalReporters: number;
  emergencyResponders: {
    police: number;
    medical: number;
    fireDepartment: number;
    activeResponders: number;
  };
  totalInsuranceAgents: number;
}
