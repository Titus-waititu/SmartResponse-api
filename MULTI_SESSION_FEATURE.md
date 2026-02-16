# Multi-Session Authentication Feature

## Overview

This document describes the multi-session authentication feature that allows users to login from multiple devices simultaneously while tracking IP addresses and device information.

## Features Implemented

### 1. Session Tracking

- Each login creates a new session record in the database
- Sessions store:
  - User ID
  - Hashed refresh token
  - IP address
  - User agent
  - Device name (parsed from user agent)
  - Active status
  - Last activity timestamp
  - Creation and update timestamps

### 2. IP Address Capture

- Automatically captures the IP address on login
- Supports X-Forwarded-For header for proxy/load balancer scenarios
- Falls back to direct connection IP if no proxy headers are present

### 3. Device Recognition

- Automatically detects device type from user agent:
  - iPhone
  - iPad
  - Android Device
  - Windows PC
  - Mac
  - Linux PC
  - Unknown Device (fallback)

### 4. Session Management Endpoints

#### Get Active Sessions

**GET** `/auth/sessions`

- Returns all active sessions for the authenticated user
- Includes IP address, device name, and last activity time
- Sessions ordered by last activity (most recent first)

#### Logout from Specific Session

**DELETE** `/auth/sessions/:sessionId`

- Terminates a specific session
- Useful for logging out from other devices
- Requires authentication

#### Logout from All Sessions

**DELETE** `/auth/sessions`

- Terminates all active sessions for the user
- Useful for security purposes (e.g., password change, suspected account compromise)
- Requires authentication

#### Regular Logout

**POST** `/auth/logout`

- Logs out from all sessions (backward compatible)
- Can be extended to logout from current session only if needed

### 5. Token Refresh with Session Validation

- Refresh tokens are validated against active sessions
- Multiple refresh tokens can be active simultaneously
- Each token refresh updates the session's last activity timestamp
- Invalid or expired sessions are rejected

## Database Schema

### Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  hashed_refresh_token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Indexes

- `idx_sessions_user_id` - For user-specific queries
- `idx_sessions_is_active` - For active session queries
- `idx_sessions_user_active` - Composite for user's active sessions
- `idx_sessions_last_activity` - For cleanup and activity tracking

## API Examples

### 1. Login

```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response includes sessionId
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  },
  "sessionId": "uuid-here"
}
```

### 2. Get Active Sessions

```bash
GET /auth/sessions
Authorization: Bearer <access-token>

# Response
{
  "success": true,
  "message": "Active sessions retrieved successfully",
  "sessions": [
    {
      "id": "uuid-1",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "deviceName": "iPhone",
      "isActive": true,
      "lastActivity": "2026-02-16T10:30:00Z",
      "createdAt": "2026-02-16T08:00:00Z"
    },
    {
      "id": "uuid-2",
      "ipAddress": "192.168.1.101",
      "userAgent": "Mozilla/5.0...",
      "deviceName": "Windows PC",
      "isActive": true,
      "lastActivity": "2026-02-16T09:15:00Z",
      "createdAt": "2026-02-15T14:30:00Z"
    }
  ]
}
```

### 3. Logout from Specific Device

```bash
DELETE /auth/sessions/uuid-1
Authorization: Bearer <access-token>

# Response
{
  "success": true,
  "message": "Session terminated successfully"
}
```

### 4. Logout from All Devices

```bash
DELETE /auth/sessions
Authorization: Bearer <access-token>

# Response
{
  "success": true,
  "message": "All sessions terminated successfully"
}
```

## Migration Instructions

### Step 1: Run the Database Migration

```bash
# Run the sessions table migration
psql -U your_username -d your_database -f migrations/002_create_sessions_table.sql
```

### Step 2: Test the Implementation

1. Login from multiple devices/browsers
2. Check active sessions via GET /auth/sessions
3. Logout from specific session
4. Verify that only that session is terminated
5. Login again and test logout from all sessions

### Step 3: Optional - Remove Old Refresh Token Column

After confirming everything works correctly, you can optionally remove the `hashed_refresh_token` column from the users table:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS hashed_refresh_token;
```

## Security Considerations

### 1. Token Security

- Refresh tokens are hashed before storage using bcrypt
- Each session has its own refresh token
- Tokens cannot be used across different sessions

### 2. Session Expiration

- Consider implementing automatic session expiration based on last activity
- Add a cleanup job to remove old inactive sessions

### 3. Rate Limiting

- Consider adding rate limiting for login attempts per IP address
- Implement maximum active sessions per user if needed

### 4. IP Address Privacy

- IP addresses are stored for security and audit purposes
- Consider data retention policies and privacy regulations (GDPR, etc.)
- Implement IP address anonymization if required

## Future Enhancements

### 1. Enhanced Device Detection

- Use a library like `ua-parser-js` for better device/browser detection
- Store browser name and version separately

### 2. Session Notifications

- Email notifications when new device logs in
- Push notifications for suspicious login attempts

### 3. Geolocation

- Add geolocation data based on IP address
- Show login location in session list

### 4. Session Limits

- Implement maximum concurrent sessions per user
- Automatically revoke oldest session when limit is reached

### 5. Session Activity Log

- Track detailed activity within each session
- Show last action performed in each session

### 6. Trusted Devices

- Allow users to mark devices as trusted
- Skip 2FA for trusted devices

## Code Structure

```
src/auth/
├── entities/
│   └── session.entity.ts          # Session entity definition
├── dto/
│   └── session.dto.ts              # Session DTOs
├── auth.service.ts                 # Updated with session management
├── auth.controller.ts              # Updated with session endpoints
└── auth.module.ts                  # Updated to include Session repository

migrations/
└── 002_create_sessions_table.sql  # Sessions table migration
```

## Backward Compatibility

The implementation maintains backward compatibility:

- Existing logout endpoint still works
- User entity still has `hashedRefreshToken` column (can be removed later)
- All existing authentication flows continue to work

## Testing Checklist

- [ ] Login from multiple browsers/devices
- [ ] Verify IP address is captured correctly
- [ ] Check device name parsing works for different user agents
- [ ] Test session listing endpoint
- [ ] Test logout from specific session
- [ ] Test logout from all sessions
- [ ] Verify refresh token works correctly with sessions
- [ ] Test session validation on token refresh
- [ ] Verify foreign key constraint (session deleted when user is deleted)
- [ ] Check indexes are created correctly for performance

## Support

For issues or questions regarding the multi-session feature, please refer to:

- Session entity: `src/auth/entities/session.entity.ts`
- Session management service methods: `src/auth/auth.service.ts`
- Session endpoints: `src/auth/auth.controller.ts`
