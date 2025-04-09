
import React, { useState, useEffect } from 'react';
import DeviceCard from './DeviceCard';
import { Device, WarningThreshold } from '@/types';
import { getWarningThresholds } from '@/services/databaseService';

interface DeviceListProps {
  devices: Device[];
  onDeviceDeleted?: () => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceDeleted }) => {
  const [thresholds, setThresholds] = useState<WarningThreshold | null>(null);
  
  useEffect(() => {
    fetchThresholds();
  }, []);
  
  const fetchThresholds = async () => {
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onDelete={onDeviceDeleted}
          thresholds={thresholds ? {
            minTemperature: thresholds.minTemperature,
            maxTemperature: thresholds.maxTemperature,
            minHumidity: thresholds.minHumidity,
            maxHumidity: thresholds.maxHumidity
          } : undefined}
        />
      ))}
    </div>
  );
};

export default DeviceList;
