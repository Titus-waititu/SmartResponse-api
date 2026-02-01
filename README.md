# 🚨 Smart Accident Report System - API

A modern, AI-powered accident reporting and emergency dispatch system built with NestJS, TypeScript, and OpenAI Vision API.

## 📖 Overview

SmartResponse API is a comprehensive backend system designed to streamline accident reporting and emergency response coordination. The system leverages AI to analyze accident scene images, automatically assess severity, and dispatch appropriate emergency services in real-time.

### 🌟 Key Features

- **AI-Powered Image Analysis**: Analyzes accident scenes using OpenAI GPT-4 Vision to determine severity, detect injuries, and assess vehicle damage
- **Automated Emergency Dispatch**: Intelligently routes emergency services (Police, Ambulance, Fire Department) based on AI-determined severity levels
- **Secure Authentication**: JWT-based authentication with OAuth2 (Google) integration and role-based access control
- **Real-time Notifications**: Automated alerts for users and emergency services
- **Comprehensive Reporting**: Track accidents, vehicles, locations, and media with detailed reports
- **RESTful API**: Well-documented endpoints with Swagger/OpenAPI integration

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: TypeORM
- **AI Integration**: OpenAI GPT-4 Vision API
- **Authentication**: Passport JWT & Google OAuth2
- **File Upload**: Multer
- **Validation**: class-validator & class-transformer

### Module Structure

```
src/
├── accidents/       # Accident reporting and analysis
├── ai/             # AI image analysis service
├── auth/           # Authentication & authorization
├── dispatch/       # Emergency service dispatch
├── emergency-services/ # Emergency service management
├── locations/      # Location tracking
├── media/          # Media file management
├── notifications/  # Notification system
├── reports/        # Report generation
├── upload/         # File upload handling
├── users/          # User management
└── vehicles/       # Vehicle registration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- PostgreSQL database (Neon recommended)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SmartResponse-api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL=your_neon_database_url_here

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRATION=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_REFRESH_EXPIRATION=7d

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # File Upload
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760

   # Application
   PORT=3000
   NODE_ENV=development
   ```

4. **Run database migrations**
   ```bash
   # Execute migrations in your database
   psql $DATABASE_URL -f migrations/001_create_users_table.sql
   ```

### Running the Application

```bash
# Development mode with hot-reload
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the application is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:3000/api`

### Key Endpoints

#### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google` - Google OAuth login

#### Accidents

- `POST /accidents/report` - Report accident with AI analysis
- `GET /accidents` - List all accidents
- `GET /accidents/:id` - Get accident details
- `PATCH /accidents/:id` - Update accident
- `DELETE /accidents/:id` - Delete accident

#### Emergency Services

- `GET /emergency-services` - List services
- `POST /emergency-services` - Create service
- `GET /emergency-services/:id` - Get service details

#### Users

- `GET /users` - List users (Admin only)
- `GET /users/:id` - Get user profile
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin only)

## 🤖 AI Integration

### Severity-Based Dispatch Rules

The system automatically dispatches emergency services based on AI-analyzed severity:

| Severity Level | Score Range | Dispatched Services                  |
| -------------- | ----------- | ------------------------------------ |
| **Critical**   | 70-100      | Police + Ambulance + Fire Department |
| **High**       | 50-69       | Police + Ambulance                   |
| **Medium**     | 30-49       | Police Only                          |
| **Low**        | 0-29        | Notification Only                    |

### AI Analysis Output

The AI service provides:

- Severity score (0-100)
- Detailed scene analysis
- Injury detection and assessment
- Vehicle damage evaluation
- Recommended emergency response

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Admin, Responder, and User roles
- **Password Hashing**: bcrypt encryption for user passwords
- **Google OAuth2**: Social login integration
- **File Validation**: Type and size validation for uploads
- **CORS Protection**: Configurable cross-origin resource sharing

## 📦 Project Structure

```
SmartResponse-api/
├── src/
│   ├── accidents/          # Accident management
│   ├── ai/                 # AI analysis service
│   ├── auth/               # Authentication & guards
│   ├── dispatch/           # Emergency dispatch
│   ├── database/           # Database configuration
│   ├── emergency-services/ # Emergency services
│   ├── locations/          # Location tracking
│   ├── media/              # Media management
│   ├── notifications/      # Notification system
│   ├── reports/            # Report generation
│   ├── upload/             # File upload
│   ├── users/              # User management
│   └── vehicles/           # Vehicle registration
├── migrations/             # Database migrations
├── test/                   # E2E tests
├── uploads/                # Uploaded files (generated)
└── docs/                   # Documentation files
```

## 📄 Additional Documentation

- [Complete Setup Guide](SETUP_GUIDE.md)
- [AI Integration Guide](AI_INTEGRATION_GUIDE.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Users Module Documentation](USERS_MODULE.md)

## 🔧 Development

### Code Quality

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Build for production
pnpm run build
```

### Database Migrations

SQL migrations are located in the `migrations/` directory. Execute them in order:

1. `001_create_users_table.sql`

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up proper CORS policies
5. Enable HTTPS
6. Configure file storage (AWS S3, Azure Blob, etc.)
7. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

Built with ❤️ using [NestJS](https://nestjs.com/)
