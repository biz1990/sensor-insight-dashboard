
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// SQL Server Configuration
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    instanceName: process.env.DB_INSTANCE_NAME || undefined,
    connectTimeout: 30000, // Increased connection timeout
    requestTimeout: 30000   // Increased request timeout
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

module.exports = { sqlConfig };
