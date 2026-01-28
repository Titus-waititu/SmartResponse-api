# Authentication System

This API provides complete JWT-based authentication for the Smart Accident Report System.

## Features

- ✅ User registration (sign up)
- ✅ User login (sign in) with JWT access and refresh tokens
- ✅ Token refresh mechanism
- ✅ Password change for authenticated users
- ✅ Password reset flow (forgot password)
- ✅ User profile management
- ✅ Role-based access control (RBAC)
- ✅ Secure password hashing with bcrypt
- ✅ Protected routes with JWT guards

## Setup

1. **Install dependencies** (already done):

   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your Neon database URL
   - Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to secure random strings

3. **Run database migration**:
   Execute the SQL in `migrations/001_create_users_table.sql` in your Neon database

4. **Start the server**:
   ```bash
   pnpm run start:dev
   ```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Sign Up

```http
POST /auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123!",
  "phoneNumber": "+1234567890",
  "role": "user"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

#### Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

Response: Same as Sign Up

#### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

Response:

```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

#### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!"
}
```

### Protected Endpoints (Authentication Required)

Add the access token to the Authorization header:

```
Authorization: Bearer <access_token>
```

#### Get Profile

```http
GET /auth/profile
```

#### Update Profile

```http
PATCH /auth/profile
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phoneNumber": "+1234567890"
}
```

#### Change Password

```http
POST /auth/change-password
Content-Type: application/json

{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

#### Logout

```http
POST /auth/logout
```

## User Roles

- `user` - Regular user (default)
- `officer` - Police officer
- `emergency_responder` - Emergency responder
- `admin` - System administrator

## Token Expiration

- Access Token: 15 minutes (configurable via `JWT_EXPIRATION`)
- Refresh Token: 7 days (configurable via `JWT_REFRESH_EXPIRATION`)

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- Refresh tokens stored as hashes in database
- Reset tokens expire after 1 hour
- Role-based access control with guards
- Public decorator for unprotected routes
- Global JWT authentication guard

## Swagger Documentation

Access API documentation at: `http://localhost:3000/api`

## Example Usage with cURL

```bash
# Sign Up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","password":"Password123!"}'

# Sign In
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123!"}'

# Get Profile (with token)
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
