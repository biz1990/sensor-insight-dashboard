# Network Setup Guide for Sensor Insight Dashboard

This guide will help you set up the Sensor Insight Dashboard to work across multiple computers on your network.

## Server Setup

1. **Configure the Server**

   Edit the `config.js` file to set your server's IP address or hostname:

   ```javascript
   // Server configuration
   const serverConfig = {
     // The port the server will listen on
     port: 3001,
     
     // The hostname or IP address where the server is running
     // Use 0.0.0.0 to listen on all interfaces
     host: '0.0.0.0',
     
     // Database configuration
     database: {
       // Your database settings
     }
   };
   ```

2. **Update Environment Variables**

   The `.env` file has been updated to use relative URLs, which should work for most setups:

   ```
   # Database API URL
   VITE_DB_API_URL=/api
   
   # Set to 'true' to use real API instead of mock data in development
   VITE_USE_REAL_API=true
   ```

   If you need to specify an absolute URL, you can change it to:

   ```
   VITE_DB_API_URL=http://your-server-ip:3001/api
   ```

3. **Start the Server**

   Run the server with:

   ```
   npm run server
   ```

## Client Setup

For clients to access the dashboard from other computers:

1. **Access via Server IP**

   Other computers should access the dashboard using the server's IP address:

   ```
   http://server-ip:8080
   ```

   Where `server-ip` is the IP address of the computer running the server.

2. **Firewall Configuration**

   Make sure your firewall allows incoming connections on ports:
   - 8080 (for the web interface)
   - 3001 (for the API server)

## Troubleshooting

If clients cannot connect:

1. **Check Server IP**
   - Make sure you're using the correct IP address for your server
   - The IP must be accessible from other computers on the network

2. **Verify Ports**
   - Ensure ports 8080 and 3001 are open in your firewall
   - Test with `telnet server-ip 3001` from another computer

3. **CORS Issues**
   - If you see CORS errors in the browser console, check the server logs
   - The server is configured to allow requests from any origin

4. **Network Restrictions**
   - Some corporate networks may block connections between computers
   - Try using a different network or consult your network administrator

## Testing the Connection

You can test if the API server is accessible from another computer by opening:

```
http://server-ip:3001/api
```

You should see a JSON response indicating the API is running.