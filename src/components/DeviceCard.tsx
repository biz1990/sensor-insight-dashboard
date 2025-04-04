
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Device } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThermometerIcon, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="outline" className="text-gray-500">Offline</Badge>;
      case 'warning':
        return <Badge className="warning-badge">Warning</Badge>;
      case 'error':
        return <Badge className="danger-badge">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className="sensor-card h-full flex flex-col">
      <CardContent className="pt-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">{device.name}</h3>
          {getStatusBadge(device.status)}
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {device.location?.name || 'Unknown location'}
        </div>
        
        {device.lastReading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThermometerIcon className="h-5 w-5 temperature-text" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className={cn(
                "text-lg font-bold",
                device.lastReading.temperature > 28 || device.lastReading.temperature < 18 ? "text-[#FF6B6B]" : "text-foreground"
              )}>
                {device.lastReading.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 humidity-text" />
                <span className="text-sm font-medium">Humidity</span>
              </div>
              <span className={cn(
                "text-lg font-bold",
                device.lastReading.humidity > 70 || device.lastReading.humidity < 30 ? "text-[#4ECDC4]" : "text-foreground"
              )}>
                {device.lastReading.humidity}%
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No readings available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/devices/${device.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceCard;
