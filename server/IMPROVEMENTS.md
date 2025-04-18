# Server API Improvements

This document outlines the improvements made to the Sensor Insight Dashboard API.

## Authentication System

A complete authentication system has been implemented with the following features:

1. **Login API Endpoint**
   - Path: `/api/auth/login`
   - Method: POST
   - Accepts email and password
   - Returns user data and JWT token

2. **Registration API Endpoint**
   - Path: `/api/auth/register`
   - Method: POST
   - Creates new user accounts
   - Validates for duplicate emails

3. **Current User API Endpoint**
   - Path: `/api/auth/me`
   - Method: GET
   - Protected route that requires authentication
   - Returns current user data

4. **Authentication Middleware**
   - Validates JWT tokens
   - Protects routes that require authentication
   - Sets user data in request object

## Timezone Handling (UTC+7 Ho Chi Minh)

The system now properly handles UTC+7 (Ho Chi Minh) timezone:

1. **Server-side**
   - Sensor readings are stored with UTC+7 timestamp
   - SQL Server uses `DATEADD(HOUR, 7, GETUTCDATE())` for timestamp creation

2. **Client-side**
   - Charts display time in Asia/Ho_Chi_Minh timezone
   - Date formatting uses `formatInTimeZone` with 'Asia/Ho_Chi_Minh' timezone

## Implementation Notes

### Required Dependencies

The following dependencies have been added:
- `bcryptjs` - For password hashing
- `jsonwebtoken` - For JWT token generation and validation

Install these dependencies with:
```
npm install bcryptjs jsonwebtoken
```

### Database Schema Updates

The Users table should have the following columns:
- id (INT, Primary Key)
- username (NVARCHAR)
- email (NVARCHAR)
- password (NVARCHAR)
- role (NVARCHAR)
- isActive (BIT)
- createdAt (DATETIME)
- updatedAt (DATETIME)

### Environment Variables

Add the following to your .env file:
```
JWT_SECRET=your-secret-key-here
```

### Client Integration

The AuthContext has been updated to:
- Use the real API endpoints when VITE_USE_REAL_API is true
- Store JWT tokens in localStorage
- Handle authentication state properly