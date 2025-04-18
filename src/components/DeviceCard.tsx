import React, { useEffect, useState, useCallback, memo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Clock, 
  Info, 
  Trash2, 
  AlertTriangle, 
  RefreshCw,
  MapPin
} from 'lucide-react';
import { Device, SensorReading } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from "@/hooks/use-toast";
import { deleteDevice, getDeviceReadings } from '@/services/databaseService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch latest reading function
  const fetchLatestReading = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Get latest reading for this device
      const readings = await getDeviceReadings(device.id, 1);
      if (readings && readings.length > 0) {
        setLastReading(readings[0]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching latest reading:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [device.id]);
  
  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Initial fetch
    fetchLatestReading();
    
    // Set up interval for auto-refresh
    const intervalId = setInterval(fetchLatestReading, refreshInterval);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [device.id, autoRefresh, refreshInterval, fetchLatestReading]);
  
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
  
  const getRelativeTime = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  const handleDeleteDevice = async () => {
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
  };
  
  // Calculate temperature and humidity percentages for visual indicators
  const getTemperaturePercentage = () => {
    if (!lastReading || !thresholds) return 50;
    
    const min = thresholds.minTemperature;
    const max = thresholds.maxTemperature;
    const range = max - min;
    
    // Clamp value between min and max, then calculate percentage
    const clampedValue = Math.max(min, Math.min(max, lastReading.temperature));
    return ((clampedValue - min) / range) * 100;
  };
  
  const getHumidityPercentage = () => {
    if (!lastReading || !thresholds) return 50;
    
    const min = thresholds.minHumidity;
    const max = thresholds.maxHumidity;
    const range = max - min;
    
    // Clamp value between min and max, then calculate percentage
    const clampedValue = Math.max(min, Math.min(max, lastReading.humidity));
    return ((clampedValue - min) / range) * 100;
  };
  
  // Check if temperature or humidity is outside of threshold limits
  const hasTemperatureWarning = lastReading && thresholds && 
    (lastReading.temperature < thresholds.minTemperature || 
     lastReading.temperature > thresholds.maxTemperature);
     
  const hasHumidityWarning = lastReading && thresholds && 
    (lastReading.humidity < thresholds.minHumidity || 
     lastReading.humidity > thresholds.maxHumidity);
  
  return (
    <>
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
          
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{device.location?.name || 'Unknown location'}</span>
          </div>
          
          {lastReading ? (
            <div className="mt-4 space-y-4">
              {/* Temperature with visual indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className={`h-4 w-4 ${hasTemperatureWarning ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className="text-sm font-medium">Temperature</span>
                  </div>
                  <span className={`text-sm font-medium ${hasTemperatureWarning ? 'text-red-500' : ''}`}>
                    {lastReading.temperature}°C
                    {hasTemperatureWarning && (
                      <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                    )}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Progress 
                          value={getTemperaturePercentage()} 
                          className={`h-2 ${hasTemperatureWarning ? 'bg-red-100' : 'bg-blue-100'}`}
                          indicatorClassName={hasTemperatureWarning ? 'bg-red-500' : 'bg-blue-500'}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Range: {thresholds?.minTemperature}°C - {thresholds?.maxTemperature}°C</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Humidity with visual indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className={`h-4 w-4 ${hasHumidityWarning ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className="text-sm font-medium">Humidity</span>
                  </div>
                  <span className={`text-sm font-medium ${hasHumidityWarning ? 'text-red-500' : ''}`}>
                    {lastReading.humidity}% RH
                    {hasHumidityWarning && (
                      <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                    )}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Progress 
                          value={getHumidityPercentage()} 
                          className={`h-2 ${hasHumidityWarning ? 'bg-red-100' : 'bg-blue-100'}`}
                          indicatorClassName={hasHumidityWarning ? 'bg-red-500' : 'bg-blue-500'}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Range: {thresholds?.minHumidity}% - {thresholds?.maxHumidity}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{getRelativeTime(lastReading.timestamp)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatTimestamp(lastReading.timestamp)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1">
                  <span>Updated: {format(lastUpdated, 'HH:mm:ss')}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={fetchLatestReading}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 py-4 text-center text-sm text-muted-foreground">
              <p>No sensor readings available</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={fetchLatestReading}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : 'Check for readings'}
              </Button>
            </div>
          )}
          
          {/* Show warnings if temperature or humidity is outside thresholds */}
          {(hasTemperatureWarning || hasHumidityWarning) && (
            <Alert variant="destructive" className="mt-4 text-xs py-2 px-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs">Warning</AlertTitle>
              <AlertDescription className="text-xs">
                {hasTemperatureWarning && (
                  <p>Temperature outside normal range ({thresholds?.minTemperature}°C - {thresholds?.maxTemperature}°C)</p>
                )}
                {hasHumidityWarning && (
                  <p>Humidity outside normal range ({thresholds?.minHumidity}% - {thresholds?.maxHumidity}%)</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-4 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/devices/${device.id}`)}
            className="gap-1"
          >
            <Info className="h-4 w-4" />
            Details
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowDeleteDialog(true)}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the device "{device.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDevice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(DeviceCard);
