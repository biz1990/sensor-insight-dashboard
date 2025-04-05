
# Sensor Monitoring API Server

This is the API proxy server for the Sensor Monitoring application. It connects to a Microsoft SQL Server database and provides API endpoints for the frontend application.

## Setup Instructions

### Prerequisites

1. Node.js (v14 or later)
2. Microsoft SQL Server (2019 or later)
3. SQL Server Management Studio (for database setup)

### Database Setup

1. Install Microsoft SQL Server if you haven't already
2. Enable SQL Server Authentication (Mixed Mode)
3. Create a SQL Server user with appropriate permissions
4. Run the `schema.sql` script in SQL Server Management Studio to create the database and tables

### Server Configuration

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your environment variables in the `.env` file:
   ```
   # Server configuration
   PORT=3001

   # Database configuration
   DB_SERVER=your_server_name
   DB_DATABASE=SensorDB
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=1433
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

- `POST /api/test-connection` - Test database connection
- `POST /api/execute-query` - Execute a SQL query
- `DELETE /api/devices/:id` - Delete a device by ID

## Frontend Integration

Update your frontend `.env` file to point to this API server:

```
VITE_DB_API_URL=http://localhost:3001/api
VITE_USE_REAL_API=true
```

This will configure your React application to use the real API instead of mock data.
