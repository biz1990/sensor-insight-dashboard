
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Droplets, Clock, Info, Trash2 } from 'lucide-react';
import { Device } from '@/types';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { deleteDevice } from '@/services/databaseService';

type DeviceCardProps = {
  device: Device;
  onDelete?: () => void;
};

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDelete }) => {
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
      return format(new Date(timestamp), 'MMM dd, HH:mm');
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
              <Thermometer className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {device.lastReading.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {device.lastReading.humidity}% RH
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
