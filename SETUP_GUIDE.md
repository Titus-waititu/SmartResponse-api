# Smart Accident Report System - Complete Setup Guide

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Neon PostgreSQL database

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=your_neon_database_url_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d

# Application
PORT=3000
NODE_ENV=development
```

### 3. Run Database Migration

Execute the SQL in `migrations/001_create_users_table.sql` in your Neon database console or using a PostgreSQL client:

```bash
# Using psql (if you have it installed)
psql $DATABASE_URL -f migrations/001_create_users_table.sql
```

Or copy and paste the SQL directly into your Neon console.

### 4. Start the Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

## 📚 Module Documentation

- **[Authentication Module](AUTH_README.md)** - Complete JWT authentication system
- **[Users Module](USERS_MODULE.md)** - User management and role-based access control

## 🧪 Testing the API

### Using VS Code REST Client

1. Install the **REST Client** extension for VS Code
2. Open `api.http` or `users.http`
3. Update the tokens after signing in
4. Click "Send Request" above any endpoint

### Using cURL

```bash
# Sign up as admin
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "System Admin",
    "email": "admin@system.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'

# Sign in and get tokens
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@system.com",
    "password": "AdminPass123!"
  }'

# Use the access token for authenticated requests
export TOKEN="your_access_token_here"

# Get all users
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

## 🗂️ Project Structure

```
api/
├── src/
│   ├── auth/                     # Authentication Module
│   │   ├── decorators/          # Custom decorators (Public, CurrentUser, Roles)
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── entities/            # User entity
│   │   ├── guards/              # JWT and Roles guards
│   │   ├── strategies/          # Passport strategies
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module configuration
│   ├── users/                    # Users Management Module
│   │   ├── dto/                 # User DTOs
│   │   ├── entities/            # User entity
│   │   ├── users.controller.ts  # User endpoints
│   │   ├── users.service.ts     # User business logic
│   │   └── users.module.ts      # Users module configuration
│   ├── database/                 # Database Module
│   │   ├── database.service.ts  # Neon database service
│   │   └── database.module.ts   # Database module
│   ├── app.module.ts            # Main application module
│   └── main.ts                  # Application entry point
├── migrations/                   # Database migrations
│   └── 001_create_users_table.sql
├── api.http                     # Auth API tests
├── users.http                   # Users API tests
├── AUTH_README.md              # Auth documentation
├── USERS_MODULE.md             # Users documentation
└── SETUP_GUIDE.md              # This file
```

## 🔐 Security Features

- **JWT Authentication**: Access tokens (15 min) + Refresh tokens (7 days)
- **Password Hashing**: Bcrypt with 10 rounds
- **Role-Based Access Control**: Admin, Officer, Emergency Responder, User
- **Protected Routes**: Global JWT guard with @Public() decorator
- **Input Validation**: class-validator decorators on all DTOs
- **UUID Validation**: Parse and validate UUIDs in route parameters

## 👥 User Roles & Permissions

| Role                    | Create User | View Users | Update User | Delete User | Manage Accidents |
| ----------------------- | ----------- | ---------- | ----------- | ----------- | ---------------- |
| **Admin**               | ✅          | ✅         | ✅          | ✅          | ✅               |
| **Officer**             | ❌          | ✅         | ❌          | ❌          | ✅               |
| **Emergency Responder** | ❌          | ❌         | ❌          | ❌          | ✅ (limited)     |
| **User**                | ❌          | ❌         | ❌          | ❌          | View own only    |

## 📝 Common Tasks

### Create First Admin User

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "System Admin",
    "email": "admin@system.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'
```

### Create Officer Account (Admin Required)

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Officer John Smith",
    "email": "officer.smith@police.gov",
    "password": "SecurePass123!",
    "phoneNumber": "+1234567890",
    "role": "officer"
  }'
```

### Change User Password

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!"
  }'
```

### Deactivate User Account

```bash
curl -X PATCH http://localhost:3000/users/{user-id}/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get User Statistics

```bash
curl -X GET http://localhost:3000/users/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🔧 Development Commands

```bash
# Start development server with hot reload
pnpm run start:dev

# Build for production
pnpm run build

# Start production server
pnpm run start:prod

# Run tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Lint code
pnpm run lint

# Format code
pnpm run format
```

## 📊 API Documentation

Once the server is running, you can access:

- **Swagger UI**: `http://localhost:3000/api` (if configured)
- **API Health Check**: `http://localhost:3000`

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env` is correct
2. Check network connectivity to Neon database
3. Ensure database exists and migration has been run

### JWT Token Errors

1. Check `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
2. Verify token hasn't expired (access tokens expire in 15 minutes)
3. Use refresh token endpoint to get new access token

### Permission Denied Errors

1. Verify you're using the correct role token
2. Check the endpoint's required roles in controller decorators
3. Admin token required for user management operations

### 404 Not Found

1. Ensure the server is running
2. Check the endpoint URL is correct
3. Verify the resource ID exists

## 📈 Next Steps

1. **Accidents Module**: Implement accident reporting functionality
2. **Media Module**: Handle accident photos and documents
3. **Notifications**: Real-time alerts for emergency responders
4. **Reports Module**: Generate analytics and reports
5. **Locations Module**: Manage accident locations with maps
6. **Email Service**: Send notifications and password reset emails

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

## 📄 License

UNLICENSED - Private Project

## 🆘 Support

For issues or questions, please contact the development team.

---

**Built with NestJS** | **Database: Neon PostgreSQL** | **Authentication: JWT**
