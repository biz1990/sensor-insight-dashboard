
import { Device, DeviceLocation, SensorReading, User, WarningThreshold } from "@/types";

// Mock device locations
export const mockLocations: DeviceLocation[] = [
  { id: 1, name: 'Server Room', description: 'Main server room on floor 1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 2, name: 'Lab', description: 'Research laboratory', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
  { id: 3, name: 'Office', description: 'Main office space', createdAt: '2023-01-03', updatedAt: '2023-01-03' },
  { id: 4, name: 'Warehouse', description: 'Storage warehouse', createdAt: '2023-01-04', updatedAt: '2023-01-04' },
  { id: 5, name: 'Cold Storage', description: 'Cold storage room', createdAt: '2023-01-05', updatedAt: '2023-01-05' },
];

// Mock devices
export const mockDevices: Device[] = [
  { id: 1, name: 'Server Room Sensor 1', serialNumber: 'SN001', locationId: 1, status: 'online', createdAt: '2023-01-10', updatedAt: '2023-01-10' },
  { id: 2, name: 'Server Room Sensor 2', serialNumber: 'SN002', locationId: 1, status: 'warning', createdAt: '2023-01-10', updatedAt: '2023-01-10' },
  { id: 3, name: 'Lab Sensor 1', serialNumber: 'SN003', locationId: 2, status: 'online', createdAt: '2023-01-11', updatedAt: '2023-01-11' },
  { id: 4, name: 'Office Sensor 1', serialNumber: 'SN004', locationId: 3, status: 'offline', createdAt: '2023-01-12', updatedAt: '2023-01-12' },
  { id: 5, name: 'Warehouse Sensor 1', serialNumber: 'SN005', locationId: 4, status: 'online', createdAt: '2023-01-13', updatedAt: '2023-01-13' },
  { id: 6, name: 'Cold Storage Sensor 1', serialNumber: 'SN006', locationId: 5, status: 'error', createdAt: '2023-01-14', updatedAt: '2023-01-14' },
];

// Mock sensor readings
export const generateReadings = (deviceId: number, count: number): SensorReading[] => {
  const readings: SensorReading[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000); // 1 hour intervals
    
    // Different ranges based on device location
    let tempMin = 20, tempMax = 25, humidityMin = 40, humidityMax = 60;
    
    const device = mockDevices.find(d => d.id === deviceId);
    if (device) {
      switch(device.locationId) {
        case 1: // Server Room
          tempMin = 18; tempMax = 27; humidityMin = 30; humidityMax = 50;
          break;
        case 2: // Lab
          tempMin = 20; tempMax = 24; humidityMin = 40; humidityMax = 60;
          break;
        case 3: // Office
          tempMin = 20; tempMax = 26; humidityMin = 35; humidityMax = 65;
          break;
        case 4: // Warehouse
          tempMin = 15; tempMax = 30; humidityMin = 30; humidityMax = 70;
          break;
        case 5: // Cold Storage
          tempMin = 2; tempMax = 8; humidityMin = 70; humidityMax = 90;
          break;
      }
    }
    
    readings.push({
      id: deviceId * 1000 + i,
      deviceId,
      temperature: parseFloat((Math.random() * (tempMax - tempMin) + tempMin).toFixed(1)),
      humidity: parseFloat((Math.random() * (humidityMax - humidityMin) + humidityMin).toFixed(1)),
      timestamp: timestamp.toISOString()
    });
  }
  
  return readings;
};

// Mock users
export const mockUsers: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', isActive: true, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 2, username: 'user1', email: 'user1@example.com', role: 'user', isActive: true, createdAt: '2023-01-02', updatedAt: '2023-01-02' },
  { id: 3, username: 'user2', email: 'user2@example.com', role: 'user', isActive: false, createdAt: '2023-01-03', updatedAt: '2023-01-03' },
];

// Mock warning thresholds
export const mockWarningThreshold: WarningThreshold = {
  id: 1,
  minTemperature: 15,
  maxTemperature: 30,
  minHumidity: 30,
  maxHumidity: 70,
  updatedAt: '2023-01-01',
  updatedBy: 1
};

// Get device with location details
export const getDeviceWithLocation = (deviceId: number): Device | undefined => {
  const device = mockDevices.find(d => d.id === deviceId);
  if (!device) return undefined;
  
  return {
    ...device,
    location: mockLocations.find(l => l.id === device.locationId)
  };
};

// Get readings for a device
export const getDeviceReadings = (deviceId: number, hours = 24): SensorReading[] => {
  return generateReadings(deviceId, hours);
};

// Get latest readings for all devices
export const getLatestReadings = (): Map<number, SensorReading> => {
  const latestReadings = new Map<number, SensorReading>();
  
  mockDevices.forEach(device => {
    const readings = generateReadings(device.id, 1);
    if (readings.length > 0) {
      latestReadings.set(device.id, readings[0]);
    }
  });
  
  return latestReadings;
};

// Get all devices with their latest readings
export const getDevicesWithLatestReadings = (): Device[] => {
  const latestReadings = getLatestReadings();
  
  return mockDevices.map(device => ({
    ...device,
    location: mockLocations.find(l => l.id === device.locationId),
    lastReading: latestReadings.get(device.id)
  }));
};
