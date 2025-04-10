
import React, { useState, useEffect } from 'react';
import DeviceCard from './DeviceCard';
import { Device, WarningThreshold } from '@/types';
import { getWarningThresholds } from '@/services/databaseService';

interface DeviceListProps {
  devices: Device[];
  onDeviceDeleted?: () => void;
  onDeviceDelete?: () => void; // Added this alias prop for compatibility
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DeviceList: React.FC<DeviceListProps> = ({ 
  devices, 
  onDeviceDeleted, 
  onDeviceDelete,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  
  useEffect(() => {
    fetchThresholds();
    
    // Set up interval for refreshing thresholds
    if (autoRefresh) {
      const intervalId = setInterval(fetchThresholds, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval]);
  
  const fetchThresholds = async () => {
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  };

  // Use either callback, with onDeviceDeleted taking precedence
  const handleDeviceDeleted = () => {
    if (onDeviceDeleted) {
      onDeviceDeleted();
    } else if (onDeviceDelete) {
      onDeviceDelete();
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onDelete={handleDeviceDeleted}
          thresholds={thresholds ? {
            minTemperature: thresholds.minTemperature,
            maxTemperature: thresholds.maxTemperature,
            minHumidity: thresholds.minHumidity,
            maxHumidity: thresholds.maxHumidity
          } : undefined}
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
        />
      ))}
    </div>
  );
};

export default DeviceList;
