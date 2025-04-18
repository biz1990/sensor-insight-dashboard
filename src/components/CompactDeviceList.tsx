import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Device } from '@/types';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';

interface CompactDeviceListProps {
  devices: Device[];
  thresholds?: {
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
  };
}

const CompactDeviceList: React.FC<CompactDeviceListProps> = ({ devices, thresholds }) => {
  const navigate = useNavigate();

  const hasWarning = (device: Device) => {
    if (!device.lastReading || !thresholds) return false;
    
    const { temperature, humidity } = device.lastReading;
    return (
      temperature < thresholds.minTemperature ||
      temperature > thresholds.maxTemperature ||
      humidity < thresholds.minHumidity ||
      humidity > thresholds.maxHumidity
    );
  };

  return (
    <div className="space-y-2">
      {devices.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No devices found
        </div>
      ) : (
        devices.map((device) => (
          <div 
            key={device.id} 
            className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/devices/${device.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                device.status === 'online' ? 'bg-green-500' : 
                device.status === 'warning' ? 'bg-yellow-500' : 
                device.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <div>
                <div className="font-medium flex items-center gap-1">
                  {device.name}
                  {hasWarning(device) && (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{device.location?.name || 'Unknown location'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {device.lastReading && (
                <div className="text-right">
                  <div className="text-sm">
                    {device.lastReading.temperature}°C / {device.lastReading.humidity}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatInTimeZone(
                      new Date(device.lastReading.timestamp),
                      'UTC',
                      "HH:mm:ss"
                    )}
                  </div>
                </div>
              )}
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CompactDeviceList;