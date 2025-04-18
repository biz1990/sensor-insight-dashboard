import { Device, DeviceLocation, SensorReading } from "@/types";

// Generate random locations
export const generateTestLocations = (count: number = 5): DeviceLocation[] => {
  const locationNames = [
    'Server Room', 'Lab', 'Office', 'Warehouse', 'Cold Storage', 
    'Meeting Room', 'Data Center', 'Production Floor', 'Research Lab',
    'Kitchen', 'Lobby', 'Outdoor Sensor', 'Greenhouse', 'Basement',
    'Rooftop', 'Garage', 'Storage Room', 'Clean Room', 'Control Room', 'Archive'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: locationNames[i % locationNames.length],
    description: `Test location ${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

// Generate random devices
export const generateTestDevices = (count: number = 20, locations: DeviceLocation[]): Device[] => {
  const statuses: ('online' | 'offline' | 'warning' | 'error')[] = ['online', 'offline', 'warning', 'error'];
  
  return Array.from({ length: count }, (_, i) => {
    const locationId = (i % locations.length) + 1;
    const location = locations.find(l => l.id === locationId);
    
    return {
      id: i + 1,
      name: `Sensor ${i + 1}`,
      serialNumber: `SN${String(i + 1).padStart(4, '0')}`,
      locationId,
      location,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
};

// Generate random sensor readings
export const generateTestReadings = (deviceId: number, count: number = 24): SensorReading[] => {
  const now = new Date();
  const readings: SensorReading[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000); // 1 hour intervals
    
    readings.push({
      id: deviceId * 1000 + i,
      deviceId,
      temperature: parseFloat((Math.random() * 15 + 15).toFixed(1)), // 15-30°C
      humidity: parseFloat((Math.random() * 40 + 30).toFixed(1)),    // 30-70%
      timestamp: timestamp.toISOString()
    });
  }
  
  return readings;
};

// Generate readings with anomalies for testing warning conditions
export const generateAnomalousReadings = (deviceId: number, count: number = 24): SensorReading[] => {
  const now = new Date();
  const readings: SensorReading[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000); // 1 hour intervals
    
    // Create some anomalous readings
    const isAnomaly = Math.random() > 0.7;
    
    readings.push({
      id: deviceId * 1000 + i,
      deviceId,
      temperature: isAnomaly 
        ? parseFloat((Math.random() * 10 + 35).toFixed(1))  // 35-45°C (too hot)
        : parseFloat((Math.random() * 15 + 15).toFixed(1)), // 15-30°C (normal)
      humidity: isAnomaly
        ? parseFloat((Math.random() * 20 + 80).toFixed(1))  // 80-100% (too humid)
        : parseFloat((Math.random() * 40 + 30).toFixed(1)), // 30-70% (normal)
      timestamp: timestamp.toISOString()
    });
  }
  
  return readings;
};

// Generate a complete test dataset
export const generateTestDataset = (
  locationCount: number = 5,
  deviceCount: number = 20,
  readingsPerDevice: number = 24
) => {
  const locations = generateTestLocations(locationCount);
  const devices = generateTestDevices(deviceCount, locations);
  
  // Generate readings for each device
  const allReadings: SensorReading[] = [];
  
  devices.forEach(device => {
    // Make some devices have anomalous readings
    const readings = device.status === 'warning' || device.status === 'error'
      ? generateAnomalousReadings(device.id, readingsPerDevice)
      : generateTestReadings(device.id, readingsPerDevice);
    
    // Add the latest reading to the device
    device.lastReading = readings[0];
    
    // Add all readings to the collection
    allReadings.push(...readings);
  });
  
  return {
    locations,
    devices,
    readings: allReadings
  };
};

// Export a ready-to-use test dataset
export const testDataset = generateTestDataset(5, 20, 24);