
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Droplets, Clock, Info, Trash2, AlertTriangle } from 'lucide-react';
import { Device } from '@/types';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { deleteDevice } from '@/services/databaseService';
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
};

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDelete, thresholds }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm');
    } catch (e) {
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
  const hasTemperatureWarning = device.lastReading && thresholds && 
    (device.lastReading.temperature < thresholds.minTemperature || 
     device.lastReading.temperature > thresholds.maxTemperature);
     
  const hasHumidityWarning = device.lastReading && thresholds && 
    (device.lastReading.humidity < thresholds.minHumidity || 
     device.lastReading.humidity > thresholds.maxHumidity);
  
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
        
        {device.lastReading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Thermometer className={`h-4 w-4 ${hasTemperatureWarning ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-sm ${hasTemperatureWarning ? 'font-bold text-red-500' : ''}`}>
                {device.lastReading.temperature}°C
                {hasTemperatureWarning && (
                  <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Droplets className={`h-4 w-4 ${hasHumidityWarning ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-sm ${hasHumidityWarning ? 'font-bold text-red-500' : ''}`}>
                {device.lastReading.humidity}% RH
                {hasHumidityWarning && (
                  <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {formatTimestamp(device.lastReading.timestamp)}
              </span>
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
        <Button variant="outline" size="sm" onClick={handleViewDetails}>
          <Info className="h-4 w-4 mr-1" />
          Details
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDeleteDevice}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceCard;
