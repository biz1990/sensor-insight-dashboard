
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceLocation {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: number;
  name: string;
  serialNumber: string;
  locationId: number;
  location?: DeviceLocation;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastReading?: SensorReading;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: number;
  deviceId: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface WarningThreshold {
  id: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  updatedAt: string;
  updatedBy: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DatabaseConfig {
  server: string;
  database: string;
  username: string;
  password: string;
  port: string;
  useIntegratedSecurity?: boolean;
  trustServerCertificate?: boolean;
}

export interface DbConnection {
  isConnected: boolean;
  lastConnectedAt?: string;
  config: DatabaseConfig;
}
