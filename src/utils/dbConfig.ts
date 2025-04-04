
/**
 * Database configuration for MS SQL Server connection
 * 
 * Note: In a browser environment, this configuration is used for:
 * 1. UI display purposes
 * 2. Sending to a backend API that would perform the actual connection
 * 3. Simulation in development
 */
export const dbConfig = {
  server: localStorage.getItem('db_server') || 'localhost',
  database: localStorage.getItem('db_database') || 'SensorDB',
  user: localStorage.getItem('db_username') || 'sa',
  password: localStorage.getItem('db_password') || '',
  port: parseInt(localStorage.getItem('db_port') || '1433', 10),
  options: {
    encrypt: false, // For local development, set to true for Azure
    trustServerCertificate: true // For local development only
  }
};

/**
 * Save database configuration to localStorage
 */
export const saveDbConfig = (config: {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
}) => {
  localStorage.setItem('db_server', config.server);
  localStorage.setItem('db_database', config.database);
  localStorage.setItem('db_username', config.user);
  localStorage.setItem('db_password', config.password);
  localStorage.setItem('db_port', config.port.toString());
  
  // Return true to indicate success
  return true;
};

/**
 * Reset database configuration to defaults
 */
export const resetDbConfig = () => {
  localStorage.removeItem('db_server');
  localStorage.removeItem('db_database');
  localStorage.removeItem('db_username');
  localStorage.removeItem('db_password');
  localStorage.removeItem('db_port');
  
  // Return the new default config
  return {
    server: 'localhost',
    database: 'SensorDB',
    user: 'sa',
    password: '',
    port: 1433
  };
};

/**
 * Get the current database configuration
 */
export const getCurrentDbConfig = () => {
  return {
    server: dbConfig.server,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  };
};
