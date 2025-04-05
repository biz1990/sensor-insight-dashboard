
# Sensor Monitoring API Server

This is the API proxy server for the Sensor Monitoring application. It connects to a Microsoft SQL Server database and provides API endpoints for the frontend application.

## Setup Instructions

### Prerequisites

1. Node.js (v14 or later)
2. Microsoft SQL Server (2014 or later)
3. SQL Server Management Studio (for database setup)

### Database Setup

1. Install Microsoft SQL Server if you haven't already
2. Enable SQL Server Authentication (Mixed Mode):
   - Open SQL Server Management Studio and connect to your instance
   - Right-click on the server name > Properties > Security
   - Under "Server authentication" select "SQL Server and Windows Authentication mode"
   - Click OK and restart the SQL Server service

3. Enable TCP/IP Protocol:
   - Open SQL Server Configuration Manager
   - Expand SQL Server Network Configuration
   - Select "Protocols for [YOUR_INSTANCE_NAME]"
   - Right-click on TCP/IP and select "Enable"
   - Right-click on TCP/IP again and select "Properties"
   - In the "IP Addresses" tab, make sure TCP Port is set to 1433
   - Click OK and restart the SQL Server service

4. Start SQL Server Browser service:
   - Open SQL Server Configuration Manager
   - Go to SQL Server Services
   - Right-click on "SQL Server Browser" and select "Start"
   - Right-click on "SQL Server Browser", select "Properties", set "Start Mode" to "Automatic"

5. Create a SQL Server user with appropriate permissions:
   - Open SQL Server Management Studio
   - Expand Security > Logins
   - Right-click on Logins and select "New Login"
   - Enter login name (e.g., 'sa')
   - Select "SQL Server authentication"
   - Enter a strong password
   - Uncheck "Enforce password policy" if needed
   - On the "Server Roles" page, check "sysadmin" or appropriate roles
   - Click OK

6. Run the `schema.sql` script in SQL Server Management Studio to create the database and tables

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
   DB_SERVER=localhost
   DB_DATABASE=SensorDB
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=1433
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   DB_INSTANCE_NAME=SQLEXPRESS  # Add this if you're using a named instance
   ```

   > Note: If you're using a named instance (e.g., "SQLEXPRESS"), set `DB_SERVER=localhost` and `DB_INSTANCE_NAME=SQLEXPRESS`

3. Start the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## Troubleshooting

### Common Connection Issues

1. **Cannot connect to localhost:1433**
   - Make sure SQL Server is running
   - Verify TCP/IP protocol is enabled in SQL Server Configuration Manager
   - Check if SQL Server Browser service is running
   - Confirm the correct port in SQL Server Configuration Manager > TCP/IP Properties > IP Addresses
   - If using a named instance, set DB_INSTANCE_NAME correctly in .env

2. **Login failed**
   - Verify SQL Server is in Mixed Authentication Mode
   - Check username and password
   - Ensure the user has appropriate permissions

3. **Firewall blocking connection**
   - Add an exception for port 1433 in your firewall settings
   - Allow the Node.js application through the firewall

4. **For SQL Server 2014 Specific Issues**
   - Make sure SQL Server Native Client is installed
   - Ensure you're using a compatible version of the mssql package

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
