
/**
 * Database configuration for MS SQL Server connection
 * 
 * Note: In a browser environment, this configuration is used for:
 * 1. UI display purposes
 * 2. Sending to a backend API that would perform the actual connection
 * 3. Simulation in development
 */

// Always retrieve the latest values from localStorage on module import
export const getDbConfig = () => {
  return {
    server: localStorage.getItem('db_server') || 'localhost',
    database: localStorage.getItem('db_database') || 'SensorDB',
    user: localStorage.getItem('db_username') || 'sa',
    password: localStorage.getItem('db_password') || '',
    port: parseInt(localStorage.getItem('db_port') || '1433', 10),
    options: {
      encrypt: JSON.parse(localStorage.getItem('db_encrypt') || 'false'),
      trustServerCertificate: JSON.parse(localStorage.getItem('db_trustCert') || 'true')
    }
  };
};

// Export the current config, but ensure it's always fresh
export const dbConfig = getDbConfig();

/**
 * Save database configuration to localStorage
 */
export const saveDbConfig = (config: {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
  options?: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  }
}) => {
  localStorage.setItem('db_server', config.server);
  localStorage.setItem('db_database', config.database);
  localStorage.setItem('db_username', config.user);
  localStorage.setItem('db_password', config.password);
  localStorage.setItem('db_port', config.port.toString());
  
  if (config.options) {
    localStorage.setItem('db_encrypt', JSON.stringify(config.options.encrypt));
    localStorage.setItem('db_trustCert', JSON.stringify(config.options.trustServerCertificate));
  }
  
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
  localStorage.removeItem('db_encrypt');
  localStorage.removeItem('db_trustCert');
  
  // Return the new default config
  return {
    server: 'localhost',
    database: 'SensorDB',
    user: 'sa',
    password: '',
    port: 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };
};

/**
 * Get the current database configuration
 */
export const getCurrentDbConfig = () => {
  return getDbConfig();
};

