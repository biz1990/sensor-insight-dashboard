
import { getDbConfig } from '@/utils/dbConfig';
import { mockLocations, mockDevices, mockUsers, mockWarningThreshold, generateReadings, getDevicesWithLatestReadings as getMockDevicesWithLatestReadings } from '@/services/mockData';
import { DeviceLocation, Device, User, WarningThreshold, SensorReading } from '@/types';

// This is the proxy API endpoint that handles database operations
const DB_API_URL = import.meta.env.VITE_DB_API_URL || 'http://localhost:3001/api';

// Flag to determine if we should use mock data or try the real API
// Force to false to ensure we always try the real API first
const USE_MOCK_DATA = false;

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
      console.log('API connection test failed, falling back to GET endpoint', apiError);
      // If API call fails, try GET endpoint as fallback
      try {
        const result = await fetchApi('/test-connection');
        return result;
      } catch (getError) {
        console.log('GET connection test also failed', getError);
        throw new Error('Could not connect to database API. Please ensure your backend API is running.');
      }
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
    const result = await fetchApi('/execute-query', 'POST', { config, query, params });
    return result.data;
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
    const result = await fetchApi('/locations');
    if (result.success && result.data.length > 0) {
      return result.data;
    }
    throw new Error('No locations found in database');
  } catch (error) {
    console.error('Error fetching locations from API, falling back to mock data:', error);
    return mockLocations;
  }
};

/**
 * Get all devices
 */
export const getDevices = async (): Promise<Device[]> => {
  try {
    const result = await fetchApi('/devices');
    if (result.success && result.data.length > 0) {
      return result.data;
    }
    throw new Error('No devices found in database');
  } catch (error) {
    console.error('Error fetching devices from API, falling back to mock data:', error);
    return mockDevices;
  }
};

/**
 * Get device readings
 */
export const getDeviceReadings = async (deviceId: number, hours = 24): Promise<SensorReading[]> => {
  try {
    const result = await fetchApi(`/devices/${deviceId}/readings?hours=${hours}`);
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    throw new Error('No readings found for device');
  } catch (error) {
    console.error('Error fetching readings from API, falling back to mock data:', error);
    return generateReadings(deviceId, hours);
  }
};

/**
 * Add a new device
 */
export const addDevice = async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device | null> => {
  try {
    const result = await fetchApi('/devices', 'POST', device);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to add device to database');
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
    const result = await fetchApi(`/devices/${deviceId}`, 'PUT', deviceData);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to update device in database');
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
    // Try to get all devices with latest readings in one API call
    const result = await fetchApi('/devices/with-readings');
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    
    // Fallback to getting devices and readings separately
    const devices = await getDevices();
    
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
  } catch (error) {
    console.error('Error fetching devices with readings from API, falling back to mock data:', error);
    return getMockDevicesWithLatestReadings();
  }
};

/**
 * Get warning thresholds
 */
export const getWarningThresholds = async (): Promise<WarningThreshold> => {
  try {
    const result = await fetchApi('/thresholds');
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('No thresholds found in database');
  } catch (error) {
    console.error('Error fetching thresholds from API, falling back to mock data:', error);
    return mockWarningThreshold;
  }
};

/**
 * Update warning thresholds
 */
export const updateWarningThresholds = async (thresholds: Partial<WarningThreshold>): Promise<WarningThreshold | null> => {
  try {
    const result = await fetchApi('/thresholds', 'POST', thresholds);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to update thresholds in database');
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
    const result = await fetchApi('/users');
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('No users found in database');
  } catch (error) {
    console.error('Error fetching users from API, falling back to mock data:', error);
    return mockUsers;
  }
};

/**
 * Delete a device
 */
export const deleteDevice = async (deviceId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await fetchApi(`/devices/${deviceId}`, 'DELETE');
    return { 
      success: true, 
      message: result.message || 'Device successfully deleted.' 
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
    const result = await fetchApi('/readings', 'POST', reading);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to add sensor reading to database');
  } catch (error) {
    console.error('Error adding reading:', error);
    throw error;
  }
};

