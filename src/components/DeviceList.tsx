
import React, { useState, useEffect, useCallback, memo } from 'react';
import DeviceCard from './DeviceCard';
import { Device, WarningThreshold } from '@/types';
import { getWarningThresholds } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(true);
  const { toast } = useToast();
  
  // Fetch thresholds function
  const fetchThresholds = useCallback(async () => {
    setIsLoadingThresholds(true);
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast({
        title: "Warning",
        description: "Could not load threshold settings. Using default values.",
        variant: "default",
      });
    } finally {
      setIsLoadingThresholds(false);
    }
  }, [toast]);
  
  // Initial fetch and set up interval
  useEffect(() => {
    fetchThresholds();
    
    // Set up interval for refreshing thresholds
    if (autoRefresh) {
      const intervalId = setInterval(fetchThresholds, refreshInterval * 2); // Refresh thresholds less frequently
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, fetchThresholds]);
  
  // Use either callback, with onDeviceDeleted taking precedence
  const handleDeviceDeleted = useCallback(() => {
    if (onDeviceDeleted) {
      onDeviceDeleted();
    } else if (onDeviceDelete) {
      onDeviceDelete();
    }
  }, [onDeviceDeleted, onDeviceDelete]);
  
  // Prepare threshold data for device cards
  const thresholdData = thresholds ? {
    minTemperature: thresholds.minTemperature,
    maxTemperature: thresholds.maxTemperature,
    minHumidity: thresholds.minHumidity,
    maxHumidity: thresholds.maxHumidity
  } : undefined;
  
  // If still loading thresholds initially, show skeleton
  if (isLoadingThresholds && !thresholds) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(Math.min(devices.length, 6))].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onDelete={handleDeviceDeleted}
          thresholds={thresholdData}
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
        />
      ))}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(DeviceList);
