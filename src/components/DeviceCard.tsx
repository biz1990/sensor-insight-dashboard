import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Droplets, Clock, Info, Trash2, AlertTriangle } from 'lucide-react';
import { Device, SensorReading } from '@/types';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from "@/hooks/use-toast";
import { deleteDevice, getDeviceReadings } from '@/services/databaseService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type DeviceCardProps = {
  device: Device;
  onDelete?: () => void;
  thresholds?: {
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
};

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  onDelete, 
  thresholds,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds default
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lastReading, setLastReading] = useState<SensorReading | undefined>(device.lastReading);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    const fetchLatestReading = async () => {
      try {
        // Get latest reading for this device
        const readings = await getDeviceReadings(device.id, 1);
        if (readings && readings.length > 0) {
          setLastReading(readings[0]);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching latest reading:', error);
      }
    };
    
    // Initial fetch
    fetchLatestReading();
    
    // Set up interval for auto-refresh
    const intervalId = setInterval(fetchLatestReading, refreshInterval);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [device.id, autoRefresh, refreshInterval]);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      // Use formatInTimeZone with UTC to preserve database timestamps
      const date = new Date(timestamp);
      return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown';
    }
  };
  
  const handleViewDetails = () => {
    navigate(`/devices/${device.id}`);
  };
  
  const handleDeleteDevice = async () => {
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      try {
        const result = await deleteDevice(device.id);
        
        if (result.success) {
          toast({
            title: "Device Deleted",
            description: result.message,
          });
          
          // Call the onDelete callback if provided to refresh the list
          if (onDelete) {
            onDelete();
          }
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete device. Please try again.",
          variant: "destructive",
        });
        console.error('Error deleting device:', error);
      }
    }
  };
  
  // Check if temperature or humidity is outside of threshold limits
  const hasTemperatureWarning = lastReading && thresholds && 
    (lastReading.temperature < thresholds.minTemperature || 
     lastReading.temperature > thresholds.maxTemperature);
     
  const hasHumidityWarning = lastReading && thresholds && 
    (lastReading.humidity < thresholds.minHumidity || 
     lastReading.humidity > thresholds.maxHumidity);
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-2 w-full ${getStatusColor(device.status)}`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{device.name}</h3>
            <p className="text-sm text-muted-foreground">{device.serialNumber}</p>
          </div>
          <Badge 
            variant={device.status === 'online' ? 'default' : 'outline'}
            className={`${device.status === 'online' ? 'bg-green-500 hover:bg-green-600' : 
                          device.status === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                          device.status === 'error' ? 'bg-red-500 hover:bg-red-600' :
                          'bg-gray-500 hover:bg-gray-600'}`}
          >
            {device.status === 'online' ? 'Online' :
             device.status === 'offline' ? 'Offline' :
             device.status === 'warning' ? 'Warning' : 'Error'}
          </Badge>
        </div>
        
        <p className="text-sm mt-2">
          Location: {device.location?.name || 'Unknown'}
        </p>
        
        {lastReading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Thermometer className={`h-4 w-4 ${hasTemperatureWarning ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-sm ${hasTemperatureWarning ? 'font-bold text-red-500' : ''}`}>
                {lastReading.temperature}°C
                {hasTemperatureWarning && (
                  <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Droplets className={`h-4 w-4 ${hasHumidityWarning ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-sm ${hasHumidityWarning ? 'font-bold text-red-500' : ''}`}>
                {lastReading.humidity}% RH
                {hasHumidityWarning && (
                  <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {formatTimestamp(lastReading.timestamp)}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </div>
          </div>
        )}
        
        {/* Show warnings if temperature or humidity is outside thresholds */}
        {(hasTemperatureWarning || hasHumidityWarning) && (
          <Alert variant="warning" className="mt-4 text-xs py-2 px-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-xs">Warning</AlertTitle>
            <AlertDescription>
              {hasTemperatureWarning && (
                <p>Temperature outside normal range</p>
              )}
              {hasHumidityWarning && (
                <p>Humidity outside normal range</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/30 p-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(`/devices/${device.id}`)}>
          <Info className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button variant="destructive" size="sm" onClick={async () => {
          if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
            try {
              const result = await deleteDevice(device.id);
              
              if (result.success) {
                toast({
                  title: "Device Deleted",
                  description: result.message,
                });
                
                // Call the onDelete callback if provided to refresh the list
                if (onDelete) {
                  onDelete();
                }
              } else {
                toast({
                  title: "Error",
                  description: result.message,
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to delete device. Please try again.",
                variant: "destructive",
              });
              console.error('Error deleting device:', error);
            }
          }
        }}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceCard;
