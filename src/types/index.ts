export enum UserRole {
  ADMIN = 'admin',
  REPORTER = 'reporter', // Citizens who report accidents
  POLICE = 'police', // Police officers
  MEDICAL = 'medical', // Medical/Ambulance services
  FIRE_DEPARTMENT = 'fire_department', // Fire department
  INSURANCE_AGENT = 'insurance_agent', // Insurance company agents
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
