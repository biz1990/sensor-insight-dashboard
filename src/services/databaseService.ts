
import { getDbConfig } from '@/utils/dbConfig';
import { mockLocations, mockDevices, mockUsers, mockWarningThreshold, generateReadings, getDevicesWithLatestReadings as getMockDevicesWithLatestReadings } from '@/services/mockData';
import { DeviceLocation, Device, User, WarningThreshold, SensorReading } from '@/types';

// This is the proxy API endpoint that handles database operations
const DB_API_URL = import.meta.env.VITE_DB_API_URL || 'http://localhost:3001/api';

// Flag to determine if we should use mock data or try the real API
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API;

/**
 * Helper function to handle API requests
 */
const fetchApi = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000) // 15 seconds timeout
    };

    console.log(`API ${method} request to: ${endpoint}`);
    const response = await fetch(`${DB_API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Test the database connection with current settings
 */
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const config = getDbConfig();
    
    // Try to connect to the actual database through an API endpoint
    try {
      const result = await fetchApi('/test-connection', 'POST', config);
      return result;
    } catch (apiError) {
      console.log('API connection test failed, falling back to simulation', apiError);
      // If API call fails, try GET endpoint as fallback
      try {
        const result = await fetchApi('/test-connection');
        return result;
      } catch (getError) {
        console.log('GET connection test also failed', getError);
        // Continue to simulation if both POST and GET fail
      }
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
      const result = await fetchApi('/execute-query', 'POST', { config, query, params });
      return result.data;
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
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/locations');
      if (result.success && result.data.length > 0) {
        return result.data;
      }
    }
    
    // Try direct query if the API endpoint didn't work
    try {
      const result = await executeQuery<DeviceLocation>('SELECT * FROM DeviceLocations');
      if (result && result.length > 0) {
        return result;
      }
    } catch (queryError) {
      console.error('Error with direct query:', queryError);
    }
    
    // Fall back to mock data if no results
    console.log('Falling back to mock location data');
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
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/devices');
      if (result.success && result.data.length > 0) {
        return result.data;
      }
    }
    
    // Try direct query if the API endpoint didn't work
    try {
      const result = await executeQuery<Device>(
        'SELECT d.*, l.name as locationName FROM Devices d JOIN DeviceLocations l ON d.locationId = l.id'
      );
      
      if (result && result.length > 0) {
        return result;
      }
    } catch (queryError) {
      console.error('Error with direct query:', queryError);
    }
    
    // Fall back to mock data if no results
    console.log('Falling back to mock device data');
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
    if (!USE_MOCK_DATA) {
      const result = await fetchApi(`/devices/${deviceId}/readings?hours=${hours}`);
      if (result.success && result.data && result.data.length > 0) {
        return result.data;
      }
    }
    
    // Try direct query if the API endpoint didn't work
    try {
      const result = await executeQuery<SensorReading>(
        'SELECT * FROM SensorReadings WHERE deviceId = @deviceId AND timestamp >= DATEADD(hour, -@hours, GETDATE()) ORDER BY timestamp',
        [deviceId, hours]
      );
      
      if (result && result.length > 0) {
        return result;
      }
    } catch (queryError) {
      console.error('Error with direct query:', queryError);
    }
    
    // Fall back to mock data if no results
    console.log('Falling back to mock reading data');
    return generateReadings(deviceId, hours);
  } catch (error) {
    console.error('Error fetching readings:', error);
    return generateReadings(deviceId, hours);
  }
};

/**
 * Add a new device
 */
export const addDevice = async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device | null> => {
  try {
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/devices', 'POST', device);
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Fallback to mock (simulated add)
    console.log('Simulating device addition with data:', device);
    const mockId = Math.floor(Math.random() * 10000) + 100;
    const now = new Date().toISOString();
    return {
      id: mockId,
      createdAt: now,
      updatedAt: now,
      ...device
    };
  } catch (error) {
    console.error('Error adding device:', error);
    throw error;
  }
};

/**
 * Update an existing device
 */
export const updateDevice = async (deviceId: number, deviceData: Partial<Device>): Promise<Device | null> => {
  try {
    if (!USE_MOCK_DATA) {
      const result = await fetchApi(`/devices/${deviceId}`, 'PUT', deviceData);
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Fallback to mock (simulated update)
    console.log('Simulating device update with data:', deviceData);
    return { id: deviceId, ...deviceData, updatedAt: new Date().toISOString() } as Device;
  } catch (error) {
    console.error('Error updating device:', error);
    throw error;
  }
};

/**
 * Get devices with latest readings
 */
export const getDevicesWithLatestReadings = async (): Promise<Device[]> => {
  try {
    // Try to get all devices first
    const devices = await getDevices();
    
    if (!USE_MOCK_DATA) {
      // For each device, get the latest reading
      const devicesWithReadings = await Promise.all(
        devices.map(async (device) => {
          try {
            const readings = await getDeviceReadings(device.id, 1);
            return {
              ...device,
              lastReading: readings.length > 0 ? readings[0] : undefined
            };
          } catch (error) {
            console.error(`Error getting readings for device ${device.id}:`, error);
            return device;
          }
        })
      );
      
      return devicesWithReadings;
    }
    
    // Fall back to mock data
    console.log('Using mock data for devices with readings');
    return getMockDevicesWithLatestReadings();
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
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/thresholds');
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Try direct query if the API endpoint didn't work
    try {
      const result = await executeQuery<WarningThreshold>('SELECT TOP 1 * FROM WarningThresholds ORDER BY updatedAt DESC');
      if (result && result.length > 0) {
        return result[0];
      }
    } catch (queryError) {
      console.error('Error with direct query:', queryError);
    }
    
    // Fall back to mock data
    console.log('Using mock threshold data');
    return mockWarningThreshold;
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    return mockWarningThreshold;
  }
};

/**
 * Update warning thresholds
 */
export const updateWarningThresholds = async (thresholds: Partial<WarningThreshold>): Promise<WarningThreshold | null> => {
  try {
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/thresholds', 'POST', thresholds);
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Fallback to mock (simulated update)
    console.log('Simulating threshold update with data:', thresholds);
    return { ...mockWarningThreshold, ...thresholds, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Error updating thresholds:', error);
    throw error;
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

/**
 * Delete a device
 */
export const deleteDevice = async (deviceId: number): Promise<{ success: boolean; message: string }> => {
  try {
    // Try to delete from the actual database through the API server
    try {
      const result = await fetchApi(`/devices/${deviceId}`, 'DELETE');
      return { 
        success: true, 
        message: result.message || 'Device successfully deleted.' 
      };
    } catch (apiError) {
      if (!USE_MOCK_DATA) {
        throw apiError; // Re-throw if we're not using mock data
      }
      console.log('API delete operation failed, falling back to mock deletion', apiError);
    }
    
    // If we're using mock data, simulate deletion
    console.log(`Mock deletion of device with ID: ${deviceId}`);
    return { 
      success: true, 
      message: 'Device successfully deleted (simulated).' 
    };
  } catch (error) {
    console.error('Error deleting device:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error during device deletion' 
    };
  }
};

/**
 * Add a sensor reading
 */
export const addSensorReading = async (reading: Omit<SensorReading, 'id' | 'timestamp'>): Promise<SensorReading | null> => {
  try {
    if (!USE_MOCK_DATA) {
      const result = await fetchApi('/readings', 'POST', reading);
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    // Fallback to mock (simulated add)
    console.log('Simulating reading addition with data:', reading);
    const mockId = Math.floor(Math.random() * 10000) + 100;
    return {
      id: mockId,
      timestamp: new Date().toISOString(),
      ...reading
    };
  } catch (error) {
    console.error('Error adding reading:', error);
    throw error;
  }
};
