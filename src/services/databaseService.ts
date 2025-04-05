import { getDbConfig } from '@/utils/dbConfig';
import { mockLocations, mockDevices, mockUsers, mockWarningThreshold, generateReadings, getDevicesWithLatestReadings as getMockDevicesWithLatestReadings } from '@/services/mockData';
import { DeviceLocation, Device, User, WarningThreshold, SensorReading } from '@/types';

// This is the proxy API endpoint that would handle database operations in a real environment
// For local testing, you would run a local API server at this address
const DB_API_URL = import.meta.env.VITE_DB_API_URL || 'http://localhost:3001/api';

// Flag to determine if we should use mock data or try the real API
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API;

/**
 * Test the database connection with current settings
 */
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const config = getDbConfig();
    
    // Try to connect to the actual database through an API endpoint
    try {
      const response = await fetch(`${DB_API_URL}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        // Small timeout to prevent long waiting times
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (apiError) {
      console.log('API connection test failed, falling back to simulation', apiError);
      // Continue to simulation if API call fails
    }
    
    // Fallback to simulation mode
    if (USE_MOCK_DATA) {
      // Perform basic validation on the config
      if (!config.server || !config.database || !config.user) {
        return { 
          success: false, 
          message: 'Invalid database configuration. Please check your settings.'
        };
      }
      
      console.log('Database connection simulated with config:', config);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        success: true, 
        message: 'Connection simulation successful. Using mock data in development mode.'
      };
    } else {
      return {
        success: false,
        message: 'Could not connect to database API. Please ensure your backend API is running.'
      };
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database connection error' 
    };
  }
};

/**
 * Execute a query against the database
 */
export const executeQuery = async <T>(query: string, params?: any[]): Promise<T[]> => {
  try {
    const config = getDbConfig();
    
    // Try to execute the query through an API
    try {
      const response = await fetch(`${DB_API_URL}/execute-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, query, params }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (apiError) {
      console.log('API query execution failed, falling back to mock data', apiError);
      // Continue to mock data if API call fails
    }
    
    // Fallback to mock data
    console.log('Using mock data for query:', { query, params });
    await new Promise(resolve => setTimeout(resolve, 300));
    return [] as T[];
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown query execution error');
  }
};

/**
 * Get all locations
 */
export const getLocations = async (): Promise<DeviceLocation[]> => {
  try {
    const result = await executeQuery<DeviceLocation>('SELECT * FROM DeviceLocations');
    if (result && result.length > 0) {
      return result;
    }
    
    // Fall back to mock data if no results
    return mockLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return mockLocations;
  }
};

/**
 * Get all devices
 */
export const getDevices = async (): Promise<Device[]> => {
  try {
    const result = await executeQuery<Device>(
      'SELECT d.*, l.name as locationName FROM Devices d JOIN DeviceLocations l ON d.locationId = l.id'
    );
    
    if (result && result.length > 0) {
      return result;
    }
    
    // Fall back to mock data if no results
    return mockDevices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return mockDevices;
  }
};

/**
 * Get device readings
 */
export const getDeviceReadings = async (deviceId: number, hours = 24): Promise<SensorReading[]> => {
  try {
    const result = await executeQuery<SensorReading>(
      'SELECT * FROM SensorReadings WHERE deviceId = @deviceId AND timestamp >= DATEADD(hour, -@hours, GETDATE()) ORDER BY timestamp',
      [deviceId, hours]
    );
    
    if (result && result.length > 0) {
      return result;
    }
    
    // Fall back to mock data if no results
    return generateReadings(deviceId, hours);
  } catch (error) {
    console.error('Error fetching readings:', error);
    return generateReadings(deviceId, hours);
  }
};

/**
 * Get devices with latest readings
 */
export const getDevicesWithLatestReadings = async (): Promise<Device[]> => {
  try {
    // Try to get real data from the database
    const devices = await getDevices();
    const devicesWithReadings = await Promise.all(
      devices.map(async (device) => {
        const readings = await getDeviceReadings(device.id, 1);
        return {
          ...device,
          lastReading: readings[0]
        };
      })
    );
    
    return devicesWithReadings;
  } catch (error) {
    console.error('Error fetching devices with readings:', error);
    // Fall back to mock data
    return getMockDevicesWithLatestReadings();
  }
};

/**
 * Get warning thresholds
 */
export const getWarningThresholds = async (): Promise<WarningThreshold> => {
  try {
    const result = await executeQuery<WarningThreshold>('SELECT TOP 1 * FROM WarningThresholds ORDER BY updatedAt DESC');
    if (result && result.length > 0) {
      return result[0];
    }
    
    // Fall back to mock data
    return mockWarningThreshold;
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    return mockWarningThreshold;
  }
};

/**
 * Get users
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await executeQuery<User>('SELECT * FROM Users');
    if (result && result.length > 0) {
      return result;
    }
    
    // Fall back to mock data
    return mockUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return mockUsers;
  }
};
