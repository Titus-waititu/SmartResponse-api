# Users Module Documentation

Complete user management system for the Smart Accident Report System with role-based access control.

## Features

- ✅ Full CRUD operations for user management
- ✅ Role-based access control (Admin, Officer, User, Emergency Responder)
- ✅ User search and filtering
- ✅ Pagination support
- ✅ User activation/deactivation
- ✅ User statistics and analytics
- ✅ Query by role
- ✅ Active users listing

## User Roles

| Role                  | Description          | Access Level                           |
| --------------------- | -------------------- | -------------------------------------- |
| `admin`               | System administrator | Full access to all features            |
| `officer`             | Police officer       | Read access to users, manage accidents |
| `emergency_responder` | First responder      | Access to emergency reports            |
| `user`                | Regular user         | Report accidents, view own data        |

## API Endpoints

### Admin Only Endpoints

#### Create User

```http
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "role": "officer",
  "isActive": true
}
```

#### Update User

```http
PATCH /users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "role": "admin",
  "isActive": true
}
```

#### Delete User

```http
DELETE /users/:id
Authorization: Bearer <admin_token>
```

#### Deactivate User

```http
PATCH /users/:id/deactivate
Authorization: Bearer <admin_token>
```

#### Activate User

```http
PATCH /users/:id/activate
Authorization: Bearer <admin_token>
```

#### Get User Statistics

```http
GET /users/stats
Authorization: Bearer <admin_token>
```

Response:

```json
{
  "total": 150,
  "active": 120,
  "inactive": 30,
  "byRole": {
    "admin": 5,
    "officer": 25,
    "emergency_responder": 20,
    "user": 100
  }
}
```

### Admin & Officer Endpoints

#### Get All Users (with filters)

```http
GET /users?role=officer&isActive=true&search=john&page=1&limit=10
Authorization: Bearer <admin_or_officer_token>
```

Query Parameters:

- `role` (optional): Filter by user role
- `isActive` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

Response:

```json
{
  "users": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "role": "officer",
      "isActive": true,
      "createdAt": "2026-01-29T00:00:00.000Z",
      "updatedAt": "2026-01-29T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Get User by ID

```http
GET /users/:id
Authorization: Bearer <admin_or_officer_token>
```

#### Get Users by Role

```http
GET /users/role/:role
Authorization: Bearer <admin_or_officer_token>

Example: GET /users/role/officer
```

#### Get Active Users

```http
GET /users/active
Authorization: Bearer <admin_or_officer_token>
```

## Service Methods

### UsersService

| Method                      | Description                | Returns                                |
| --------------------------- | -------------------------- | -------------------------------------- |
| `create(createUserDto)`     | Create new user            | `Promise<UserResponse>`                |
| `findAll(params)`           | Get all users with filters | `Promise<{users, total, page, limit}>` |
| `findOne(id)`               | Get user by ID             | `Promise<UserResponse>`                |
| `findByEmail(email)`        | Find user by email         | `Promise<User \| null>`                |
| `update(id, updateUserDto)` | Update user                | `Promise<UserResponse>`                |
| `remove(id)`                | Delete user                | `Promise<{message}>`                   |
| `deactivate(id)`            | Deactivate user            | `Promise<UserResponse>`                |
| `activate(id)`              | Activate user              | `Promise<UserResponse>`                |
| `getUsersByRole(role)`      | Get users by role          | `Promise<UserResponse[]>`              |
| `getActiveUsers()`          | Get all active users       | `Promise<UserResponse[]>`              |
| `getUserStats()`            | Get user statistics        | `Promise<Stats>`                       |

## DTOs

### CreateUserDto

```typescript
{
  fullName: string;         // Required
  email: string;            // Required, must be valid email
  password: string;         // Required, min 8 characters
  phoneNumber?: string;     // Optional, must be valid phone
  role: UserRole;           // Required, enum value
  isActive?: boolean;       // Optional, default true
}
```

### UpdateUserDto

```typescript
{
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}
```

### QueryUsersDto

```typescript
{
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;            // Default 1, min 1
  limit?: number;           // Default 10, min 1, max 100
}
```

## Examples

### Creating an Officer Account

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

### Searching Users

```bash
curl -X GET "http://localhost:3000/users?search=john&isActive=true&page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Getting User Statistics

```bash
curl -X GET http://localhost:3000/users/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Deactivating a User

```bash
curl -X PATCH http://localhost:3000/users/{user-id}/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Security

- All endpoints require JWT authentication
- Role-based access control enforced via guards
- Passwords are hashed with bcrypt (10 rounds)
- UUID validation on user IDs
- Email uniqueness enforced
- Input validation with class-validator

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "No fields to update",
  "error": "Bad Request"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User with ID {id} not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## Integration with Auth Module

The Users module integrates seamlessly with the Auth module:

- Uses the same User entity and database table
- Shares the DatabaseService
- Respects JWT authentication
- Enforces role-based access control

## Best Practices

1. **Always use Admin role for user management**
2. **Deactivate users instead of deleting** when possible
3. **Use search and filters** to find users efficiently
4. **Implement pagination** for large user lists
5. **Validate emails** before user creation
6. **Monitor user statistics** regularly

## Future Enhancements

- [ ] Bulk user operations
- [ ] User import/export (CSV)
- [ ] Advanced search with multiple filters
- [ ] User activity logging
- [ ] Email notifications on user creation
- [ ] Password reset by admin
- [ ] User profile pictures
- [ ] Two-factor authentication
