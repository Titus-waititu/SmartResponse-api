# Authentication Module

Complete authentication module with PassportJS, JWT tokens, local authentication (email/username), and Google OAuth2.

## Features

- ✅ User registration with email and username
- ✅ Login via email OR username
- ✅ JWT-based authentication
- ✅ Google OAuth2 integration
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Comprehensive unit tests
- ✅ API versioning (v1)

## API Endpoints

All endpoints are prefixed with `/api/v1/auth`

### Public Endpoints

#### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "User Name" // optional
}
```

**Response:**

```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "username": "username",
    "displayName": "User Name",
    "createdAt": "2026-01-22T...",
    "updatedAt": "2026-01-22T..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com", // can be email OR username
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "username": "username",
    "displayName": "User Name",
    "createdAt": "2026-01-22T...",
    "updatedAt": "2026-01-22T..."
  }
}
```

#### Google OAuth Login

```http
GET /api/v1/auth/google
```

Redirects to Google login page.

#### Google OAuth Callback

```http
GET /api/v1/auth/google/callback
```

Handles Google OAuth callback and returns JWT token.

### Protected Endpoints

#### Get Profile

```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": "1",
  "email": "user@example.com",
  "username": "username",
  "displayName": "User Name",
  "createdAt": "2026-01-22T...",
  "updatedAt": "2026-01-22T..."
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Application
PORT=3000
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

## Usage in Other Modules

### Protecting Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedResource() {
    return { message: 'This is protected' };
  }
}
```

### Getting Current User

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req) {
    return req.user; // { id, email, username }
  }
}
```

## Testing

Run the tests:

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

## Architecture

### Components

- **AuthService**: Business logic for authentication
- **AuthController**: HTTP endpoints
- **Strategies**:
  - `LocalStrategy`: Email/username + password authentication
  - `JwtStrategy`: JWT token validation
  - `GoogleStrategy`: Google OAuth2 authentication
- **Guards**:
  - `LocalAuthGuard`: Protects login endpoint
  - `JwtAuthGuard`: Protects authenticated routes
  - `GoogleAuthGuard`: Handles Google OAuth flow

### Data Storage

Currently uses in-memory storage for demonstration. In production, replace with a database:

1. Install database ORM (TypeORM, Prisma, etc.)
2. Create User entity/model
3. Update `AuthService` to use database operations
4. Add password reset, email verification, etc.

## Security Considerations

- ✅ Passwords are hashed with bcrypt (salt rounds: 10)
- ✅ JWT tokens expire after 7 days (configurable)
- ✅ Input validation with class-validator
- ✅ CORS enabled
- ⚠️ Store JWT_SECRET securely (use env variables, never commit)
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting for auth endpoints
- ⚠️ Add refresh token mechanism for long-term sessions
