
import { getDbConfig } from '@/utils/dbConfig';
import { DeviceLocation, Device, User, WarningThreshold, SensorReading } from '@/types';
import { format } from 'date-fns';

// This is the proxy API endpoint that handles database operations
// If it's a relative URL, we'll use the current origin
const apiUrl = import.meta.env.VITE_DB_API_URL || '/api';
const DB_API_URL = apiUrl.startsWith('http') ? apiUrl : `${window.location.origin}${apiUrl}`;

// Flag to determine if we should use mock data or try the real API
// Set to true to always try the real API first
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

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
    console.log('Locations API result:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching locations from API:', error);
    throw error;
  }
};

/**
 * Get all devices
 */
export const getDevices = async (): Promise<Device[]> => {
  try {
    const result = await fetchApi('/devices');
    console.log('Devices API result:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching devices from API:', error);
    throw error;
  }
};

/**
 * Get device readings
 */
export const getDeviceReadings = async (deviceId: number, hours = 24): Promise<SensorReading[]> => {
  try {
    const result = await fetchApi(`/devices/${deviceId}/readings?hours=${hours}`);
    console.log(`Readings for device ${deviceId} API result:`, result);
    return result.data;
  } catch (error) {
    console.error(`Error fetching readings for device ${deviceId} from API:`, error);
    throw error;
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
    console.log('Devices with latest readings result:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching devices with readings from API:', error);
    throw error;
  }
};

/**
 * Get warning thresholds
 */
export const getWarningThresholds = async (): Promise<WarningThreshold> => {
  try {
    const result = await fetchApi('/thresholds');
    console.log('Thresholds API result:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching thresholds from API:', error);
    throw error;
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
    console.log('Users API result:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching users from API:', error);
    throw error;
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
    throw error;
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

/**
 * Add a new location
 */
export const addLocation = async (location: Omit<DeviceLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeviceLocation | null> => {
  try {
    const result = await fetchApi('/locations', 'POST', location);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to add location to database');
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

/**
 * Update an existing location
 */
export const updateLocation = async (locationId: number, locationData: Partial<DeviceLocation>): Promise<DeviceLocation | null> => {
  try {
    const result = await fetchApi(`/locations/${locationId}`, 'PUT', locationData);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to update location in database');
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

/**
 * Delete a location
 */
export const deleteLocation = async (locationId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await fetchApi(`/locations/${locationId}`, 'DELETE');
    return { 
      success: true, 
      message: result.message || 'Location successfully deleted.' 
    };
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

/**
 * Add a new user
 */
export const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User | null> => {
  try {
    const result = await fetchApi('/users', 'POST', user);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to add user to database');
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

/**
 * Update an existing user
 */
export const updateUser = async (userId: number, userData: Partial<User>): Promise<User | null> => {
  try {
    const result = await fetchApi(`/users/${userId}`, 'PUT', userData);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to update user in database');
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await fetchApi(`/users/${userId}`, 'DELETE');
    return { 
      success: true, 
      message: result.message || 'User successfully deleted.' 
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Generate a device report
 */
export const generateDeviceReport = async (
  deviceId: number, 
  startDate: Date, 
  endDate: Date, 
  interval: string = 'raw'
): Promise<any> => {
  try {
    // Format dates in YYYY-MM-DD format
    // We'll handle timezone conversion on the server side
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    console.log(`Generating report for device ${deviceId} from ${formattedStartDate} to ${formattedEndDate}`);
    
    const result = await fetchApi(
      `/reports/devices/${deviceId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&interval=${interval}`
    );
    
    return result;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Get device statistics
 */
export const getDeviceStats = async (deviceId: number, period: string = 'day'): Promise<any> => {
  try {
    const result = await fetchApi(`/reports/devices/${deviceId}/stats?period=${period}`);
    return result;
  } catch (error) {
    console.error('Error getting device statistics:', error);
    throw error;
  }
};
