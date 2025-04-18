/**
 * Sensor Insight Dashboard Configuration
 * 
 * This file contains configuration settings for the Sensor Insight Dashboard.
 * Edit this file to customize the application for your environment.
 */

// Server configuration
const serverConfig = {
  // The port the server will listen on
  port: 3001,
  
  // The hostname or IP address where the server is running
  // Use 0.0.0.0 to listen on all interfaces
  host: '0.0.0.0',
  
  // Database configuration
  database: {
    server: '192.68.191.115',  // SQL Server hostname or IP
    database: 'SensorDB', // Database name
    user: 'user1',           // SQL Server username
    password: '12345678', // SQL Server password
    port: 1433,           // SQL Server port
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  }
};

export default serverConfig;