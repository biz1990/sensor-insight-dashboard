import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarIcon, ArrowLeft, RefreshCw, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DeviceColumnChart from '@/components/charts/DeviceColumnChart';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { getDeviceReadings, getDevices, getWarningThresholds } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { Device, SensorReading } from '@/types';

// Types for chart date mode
type ChartDateMode = 'latest' | 'daily' | 'range';

const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceId = id ? parseInt(id) : null;
  const deviceIdRef = useRef<number | null>(deviceId);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management
  const [device, setDevice] = useState<Device | undefined>(undefined);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [thresholds, setThresholds] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Date and view settings
  const [selectedDate, setSelectedDate] = useState(() => {
    // Initialize with current date in UTC
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone issues
    return today;
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('latest');
  const [chartDateMode, setChartDateMode] = useState<ChartDateMode>('latest');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

  // Format timestamp from database using UTC to prevent automatic timezone conversion
  const formatDBTimestamp = (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp);
      return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown';
    }
  };

  // Helper to filter readings by the selected date using UTC
  const filterReadingsByDate = (readings: SensorReading[], date: Date): SensorReading[] => {
    // Create start and end boundaries for the selected date in UTC
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0); // 00:00:00 of the selected day in UTC
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999); // 23:59:59 of the selected day in UTC
    
    console.log('Filtering readings for date:', formatInTimeZone(date, 'UTC', 'yyyy-MM-dd'));
    console.log('Start of day (UTC):', formatInTimeZone(startOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
    console.log('End of day (UTC):', formatInTimeZone(endOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
    
    return readings.filter((reading) => {
      const readingDate = new Date(reading.timestamp);
      const isInRange = readingDate >= startOfDay && readingDate <= endOfDay;
      
      if (isInRange) {
        console.log('Including reading:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      }
      
      return isInRange;
    });
  };

  // Fetch warning thresholds
  const fetchThresholds = useCallback(async () => {
    try {
      const thresholdsData = await getWarningThresholds();
      setThresholds(thresholdsData);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  }, []);

  // Fetch device information
  const fetchDevice = useCallback(async (deviceId: number) => {
    setIsLoading(true);
    try {
      const devices = await getDevices();
      const fetchedDevice = devices.find(d => d.id === deviceId);
      
      if (fetchedDevice) {
        setDevice(fetchedDevice);
        return true;
      } else {
        toast({
          title: "Device not found",
          description: "Could not find the requested device",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      toast({
        title: "Error",
        description: "Failed to load device information",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch the latest reading
  const fetchLatestReading = useCallback(async (deviceId: number) => {
    try {
      const deviceReadings = await getDeviceReadings(deviceId, 1);
      if (deviceReadings && deviceReadings.length > 0) {
        setLatestReading(deviceReadings[0]);
        setLastUpdated(new Date());
      }
      return deviceReadings;
    } catch (error) {
      console.error('Error fetching latest reading:', error);
      return [];
    }
  }, []);

  // Fetch readings based on mode
  const fetchReadings = useCallback(async (deviceId: number, mode: ChartDateMode, dateRange?: DateRange) => {
    if (!deviceId) return;
    
    setIsRefreshing(true);
    try {
      let deviceReadings: SensorReading[] = [];
      
      switch (mode) {
        case 'latest':
          try {
            // Use the specific endpoint for latest readings (10 most recent)
            const result = await fetch(`${import.meta.env.VITE_DB_API_URL}/devices/${deviceId}/readings/latest`);
            const data = await result.json();
            if (data.success) {
              deviceReadings = data.data;
            } else {
              // Fallback to regular endpoint if specific one fails
              deviceReadings = await getDeviceReadings(deviceId, 24);
              // Take only the 10 most recent readings
              deviceReadings = deviceReadings.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ).slice(0, 10);
            }
          } catch (error) {
            console.error('Error fetching latest readings, falling back:', error);
            deviceReadings = await getDeviceReadings(deviceId, 24);
            // Take only the 10 most recent readings
            deviceReadings = deviceReadings.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 10);
          }
          setChartDateMode('latest');
          break;
          
        case 'daily':
          try {
            console.log('Fetching daily readings for date:', formatInTimeZone(selectedDate, 'UTC', 'yyyy-MM-dd'));
            
            // Compare dates in UTC to check if selected date is today
            const today = new Date();
            const isToday = 
              selectedDate.getUTCFullYear() === today.getUTCFullYear() &&
              selectedDate.getUTCMonth() === today.getUTCMonth() &&
              selectedDate.getUTCDate() === today.getUTCDate();
            
            if (isToday) {
              // For today, we'll create a custom approach to ensure we get only today's data
              console.log('Fetching today\'s readings with custom approach');
              
              // Create today's date boundaries in UTC
              const startOfToday = new Date();
              startOfToday.setUTCHours(0, 0, 0, 0); // 00:00:00 of today in UTC
              
              const endOfToday = new Date();
              endOfToday.setUTCHours(23, 59, 59, 999); // 23:59:59 of today in UTC
              
              console.log('Today UTC boundaries:');
              console.log('Start of today (UTC):', formatInTimeZone(startOfToday, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
              console.log('End of today (UTC):', formatInTimeZone(endOfToday, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
              
              // First try the daily endpoint
              try {
                console.log('Fetching from daily endpoint...');
                const result = await fetch(`${import.meta.env.VITE_DB_API_URL}/devices/${deviceId}/readings/daily`);
                const data = await result.json();
                
                if (data.success && data.data.length > 0) {
                  // Ensure we only get readings from today (between 00:00:00 and 23:59:59 UTC)
                  deviceReadings = data.data.filter(reading => {
                    const readingDate = new Date(reading.timestamp);
                    const isInRange = readingDate >= startOfToday && readingDate <= endOfToday;
                    
                    if (isInRange) {
                      console.log('Including reading:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
                    } else {
                      console.log('Excluding reading:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
                    }
                    
                    return isInRange;
                  });
                  
                  console.log(`Found ${deviceReadings.length} readings for today from daily endpoint`);
                } else {
                  throw new Error('No data from daily endpoint');
                }
              } catch (dailyError) {
                console.log('Daily endpoint failed, using regular endpoint with filtering:', dailyError);
                
                // If daily endpoint fails, use the regular endpoint with 24 hours of data
                const allReadings = await getDeviceReadings(deviceId, 24);
                
                // Filter to ensure we only get today's readings (between 00:00:00 and 23:59:59 UTC)
                deviceReadings = allReadings.filter(reading => {
                  const readingDate = new Date(reading.timestamp);
                  const isInRange = readingDate >= startOfToday && readingDate <= endOfToday;
                  
                  if (isInRange) {
                    console.log('Including reading:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
                  }
                  
                  return isInRange;
                });
                
                console.log(`Found ${deviceReadings.length} readings for today from regular endpoint`);
              }
              
              // Log the time range of the readings we found
              if (deviceReadings.length > 0) {
                const firstReading = new Date(deviceReadings[0].timestamp);
                const lastReading = new Date(deviceReadings[deviceReadings.length - 1].timestamp);
                console.log('First reading time:', formatInTimeZone(firstReading, 'UTC', 'HH:mm:ss'));
                console.log('Last reading time:', formatInTimeZone(lastReading, 'UTC', 'HH:mm:ss'));
              }
            } else {
              // For other dates, get readings for past week, then filter by selected date
              console.log('Fetching readings for past date:', formatInTimeZone(selectedDate, 'UTC', 'yyyy-MM-dd'));
              const allReadings = await getDeviceReadings(deviceId, 24 * 7);
              deviceReadings = filterReadingsByDate(allReadings, selectedDate);
              console.log(`Found ${deviceReadings.length} readings for selected date`);
            }
          } catch (error) {
            console.error('Error fetching daily readings, falling back:', error);
            // Fallback to regular endpoint with filtering
            const startOfSelectedDay = new Date(selectedDate);
            startOfSelectedDay.setUTCHours(0, 0, 0, 0); // 00:00:00 of the selected day in UTC
            
            const endOfSelectedDay = new Date(selectedDate);
            endOfSelectedDay.setUTCHours(23, 59, 59, 999); // 23:59:59 of the selected day in UTC
            
            console.log('Fallback filtering with UTC boundaries:');
            console.log('Start of day (UTC):', formatInTimeZone(startOfSelectedDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
            console.log('End of day (UTC):', formatInTimeZone(endOfSelectedDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
            
            const allReadings = await getDeviceReadings(deviceId, 24 * 7);
            deviceReadings = allReadings.filter(reading => {
              const readingDate = new Date(reading.timestamp);
              return readingDate >= startOfSelectedDay && readingDate <= endOfSelectedDay;
            });
          }
          setChartDateMode('daily');
          break;
          
        case 'range':
          if (dateRange?.from && dateRange?.to) {
            try {
              // Use the specific endpoint for range readings
              const from = format(dateRange.from, 'yyyy-MM-dd');
              const to = format(dateRange.to, 'yyyy-MM-dd');
              const result = await fetch(
                `${import.meta.env.VITE_DB_API_URL}/devices/${deviceId}/readings/range?from=${from}&to=${to}`
              );
              const data = await result.json();
              
              if (data.success) {
                deviceReadings = data.data;
              } else {
                // Fallback to regular endpoint if specific one fails
                const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
                const allReadings = await getDeviceReadings(deviceId, diffDays * 24);
                
                // Filter readings that fall within the date range
                deviceReadings = allReadings.filter(reading => {
                  const readingDate = new Date(reading.timestamp);
                  
                  // Create proper UTC date boundaries
                  const startDate = new Date(dateRange.from);
                  startDate.setUTCHours(0, 0, 1, 0);
                  
                  const endDate = new Date(dateRange.to);
                  endDate.setUTCHours(23, 59, 59, 999);
                  
                  return readingDate >= startDate && readingDate <= endDate;
                });
              }
            } catch (error) {
              console.error('Error fetching range readings, falling back:', error);
              const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              const allReadings = await getDeviceReadings(deviceId, diffDays * 24);
              
              // Filter readings that fall within the date range
              deviceReadings = allReadings.filter(reading => {
                const readingDate = new Date(reading.timestamp);
                
                // Create proper UTC date boundaries
                const startDate = new Date(dateRange.from);
                startDate.setUTCHours(0, 0, 1, 0);
                
                const endDate = new Date(dateRange.to);
                endDate.setUTCHours(23, 59, 59, 999);
                
                return readingDate >= startDate && readingDate <= endDate;
              });
            }
            setChartDateMode('range');
          }
          break;
      }
      
      // Sort readings by timestamp (ascending)
      deviceReadings = deviceReadings.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setReadings(deviceReadings);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error(`Error fetching ${mode} readings:`, error);
      toast({
        title: "Error",
        description: `Failed to load sensor readings for ${mode} view`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast, selectedDate]);

  // Initial data load
  useEffect(() => {
    if (!deviceId) return;
    
    const loadInitialData = async () => {
      const success = await fetchDevice(deviceId);
      if (success) {
        await fetchLatestReading(deviceId);
        await fetchReadings(deviceId, 'latest');
        await fetchThresholds();
      }
    };
    
    loadInitialData();
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [deviceId, fetchDevice, fetchLatestReading, fetchReadings, fetchThresholds]);

  // Auto-refresh logic
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!autoRefresh || !deviceIdRef.current) return;

    const refreshData = async () => {
      const currentDeviceId = deviceIdRef.current;
      if (!currentDeviceId) return;
      
      await fetchLatestReading(currentDeviceId);
      await fetchReadings(currentDeviceId, chartDateMode, dateRange);
      await fetchThresholds();
    };

    refreshData(); // Initial refresh
    refreshTimerRef.current = setInterval(refreshData, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [
    deviceIdRef, chartDateMode, dateRange, autoRefresh, refreshInterval, 
    fetchLatestReading, fetchReadings, fetchThresholds
  ]);

  // Handle tab changes
  useEffect(() => {
    if (!deviceIdRef.current) return;
    
    if (activeTab === 'latest') {
      fetchReadings(deviceIdRef.current, 'latest');
    } else if (activeTab === 'daily') {
      fetchReadings(deviceIdRef.current, 'daily');
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      fetchReadings(deviceIdRef.current, 'range', dateRange);
    }
  }, [deviceIdRef, activeTab, dateRange, fetchReadings]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!deviceIdRef.current) return;
    
    await fetchLatestReading(deviceIdRef.current);
    await fetchReadings(deviceIdRef.current, chartDateMode as ChartDateMode, dateRange);
    await fetchThresholds();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast({
      title: autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled",
      description: autoRefresh 
        ? "You'll need to refresh manually to see new data" 
        : "Data will update automatically every 30 seconds",
    });
  };

  // Get appropriate badge for device status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'online': return <Badge className="bg-green-500">Online</Badge>;
      case 'offline': return <Badge variant="outline" className="text-gray-500">Offline</Badge>;
      case 'warning': return <Badge variant="default" className="bg-yellow-500 text-black">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Export data to CSV with proper timezone formatting
  const exportData = () => {
    if (!device || readings.length === 0) return;
    
    // Get the current date in UTC for the filename
    const currentDateFormatted = formatInTimeZone(new Date(), 'UTC', 'yyyyMMdd-HHmmss');
    
    // Create a more descriptive filename based on the current tab
    let filename = `device-${device.id}-${device.name}-`;
    if (activeTab === 'latest') {
      filename += `latest-${currentDateFormatted}`;
    } else if (activeTab === 'daily') {
      filename += `daily-${formatInTimeZone(selectedDate, 'UTC', 'yyyyMMdd')}`;
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      filename += `range-${formatInTimeZone(dateRange.from, 'UTC', 'yyyyMMdd')}-to-${formatInTimeZone(dateRange.to, 'UTC', 'yyyyMMdd')}`;
    } else {
      filename += currentDateFormatted;
    }
    
    // Filter readings based on the current view mode
    let filteredReadings: SensorReading[] = []; // Start with empty array
    
    if (activeTab === 'daily') {
      // For daily view, ensure we only export data from the selected date
      console.log('Filtering export data for daily view on date:', formatInTimeZone(selectedDate, 'UTC', 'yyyy-MM-dd'));
      
      // Create start and end boundaries for the selected date in UTC
      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0); // 00:00:00 of the selected day in UTC
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999); // 23:59:59 of the selected day in UTC
      
      console.log('Export filter - Start of day (UTC):', formatInTimeZone(startOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      console.log('Export filter - End of day (UTC):', formatInTimeZone(endOfDay, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      
      // Apply strict filtering for the selected date
      filteredReadings = readings.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        const isInRange = readingDate >= startOfDay && readingDate <= endOfDay;
        
        if (isInRange) {
          console.log('Including reading in export:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
        } else {
          console.log('Excluding reading from export:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
        }
        
        return isInRange;
      });
      
      console.log(`Export: Filtered from ${readings.length} to ${filteredReadings.length} readings`);
      
      // If no readings were found after filtering, show a warning
      if (filteredReadings.length === 0 && readings.length > 0) {
        console.warn('No readings found for the selected date after filtering!');
        toast({
          title: "No data for selected date",
          description: "No readings found for the selected date in UTC time. Please select a different date.",
          variant: "destructive",
        });
        return; // Exit the export function
      }
    } else if (activeTab === 'range' && dateRange?.from && dateRange?.to) {
      // For range view, ensure we only export data from the selected date range
      console.log('Filtering export data for range view from:', 
        formatInTimeZone(dateRange.from, 'UTC', 'yyyy-MM-dd'), 
        'to:', formatInTimeZone(dateRange.to, 'UTC', 'yyyy-MM-dd'));
      
      // Create start and end boundaries for the selected date range in UTC
      const startDate = new Date(dateRange.from);
      startDate.setUTCHours(0, 0, 0, 0); // 00:00:00 of the start day in UTC
      
      const endDate = new Date(dateRange.to);
      endDate.setUTCHours(23, 59, 59, 999); // 23:59:59 of the end day in UTC
      
      console.log('Export filter - Start date (UTC):', formatInTimeZone(startDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      console.log('Export filter - End date (UTC):', formatInTimeZone(endDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
      
      // Apply strict filtering for the selected date range
      filteredReadings = readings.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        const isInRange = readingDate >= startDate && readingDate <= endDate;
        
        if (isInRange) {
          console.log('Including reading in export:', formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
        }
        
        return isInRange;
      });
      
      console.log(`Export: Filtered from ${readings.length} to ${filteredReadings.length} readings`);
      
      // If no readings were found after filtering, show a warning
      if (filteredReadings.length === 0 && readings.length > 0) {
        console.warn('No readings found for the selected date range after filtering!');
        toast({
          title: "No data for selected range",
          description: "No readings found for the selected date range in UTC time. Please select a different range.",
          variant: "destructive",
        });
        return; // Exit the export function
      }
    } else {
      // For latest view or any other view, use all readings
      filteredReadings = [...readings];
    }
    
    // Add headers with more information
    const headers = [
      'Timestamp (UTC)',
      'Temperature (°C)',
      'Humidity (%)',
      'Device ID',
      'Device Name',
      'Location'
    ];
    
    // Create CSV content with proper timezone formatting
    const csvContent = [
      headers.join(','),
      ...filteredReadings.map(reading => {
        // Format the timestamp in UTC to ensure consistency
        const readingDate = new Date(reading.timestamp);
        const formattedTimestamp = formatInTimeZone(readingDate, 'UTC', 'yyyy-MM-dd HH:mm:ss');
        
        return [
          formattedTimestamp,
          reading.temperature,
          reading.humidity,
          device.id,
          device.name.replace(/,/g, ' '), // Remove commas to avoid CSV issues
          (device.location?.name || 'Unknown').replace(/,/g, ' ')
        ].join(',');
      })
    ].join('\n');
    
    // Add a BOM (Byte Order Mark) for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    // Notify user
    toast({
      title: "Export successful",
      description: `${filteredReadings.length} records exported to ${filename}.csv`,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading device information...</p>
      </div>
    );
  }

  // Show error state if device not found
  if (!device) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-2">Device not found</h2>
        <p className="text-muted-foreground mb-4">The device you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  // Check for warnings
  const hasTemperatureWarning = latestReading && thresholds && 
    (latestReading.temperature < thresholds.minTemperature || 
     latestReading.temperature > thresholds.maxTemperature);
    
  const hasHumidityWarning = latestReading && thresholds && 
    (latestReading.humidity < thresholds.minHumidity || 
     latestReading.humidity > thresholds.maxHumidity);

  return (
    <div className="space-y-6">
      {/* Header with navigation and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {device.name}
              {getStatusBadge(device.status)}
            </h1>
            <p className="text-muted-foreground">
              Location: {device.location?.name || 'Unknown'} • Serial: {device.serialNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {format(lastUpdated, 'HH:mm:ss')} 
              {autoRefresh && <span className="ml-1">(Auto-refresh: ON)</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={toggleAutoRefresh} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
          </Button>
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button 
            onClick={handleRefresh} 
            className="gap-2" 
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Now
          </Button>
        </div>
      </div>
      
      {/* Warning alert */}
      {(hasTemperatureWarning || hasHumidityWarning) && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            <p>This device has readings outside the acceptable range:</p>
            <ul className="list-disc list-inside mt-2">
              {hasTemperatureWarning && (
                <li>
                  Temperature: {latestReading?.temperature}°C 
                  (Acceptable range: {thresholds?.minTemperature}°C - {thresholds?.maxTemperature}°C)
                </li>
              )}
              {hasHumidityWarning && (
                <li>
                  Humidity: {latestReading?.humidity}% 
                  (Acceptable range: {thresholds?.minHumidity}% - {thresholds?.maxHumidity}%)
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Current readings summary cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Temperature Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold flex items-center",
              hasTemperatureWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.temperature}°C` : 'N/A'}
              {hasTemperatureWarning && <AlertTriangle className="h-4 w-4 ml-1" />}
              {autoRefresh && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last reading: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minTemperature}°C - {thresholds.maxTemperature}°C
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Humidity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold flex items-center",
              hasHumidityWarning ? "text-red-500" : ""
            )}>
              {latestReading ? `${latestReading.humidity}%` : 'N/A'}
              {hasHumidityWarning && <AlertTriangle className="h-4 w-4 ml-1" />}
              {autoRefresh && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestReading ? `Last reading: ${formatDBTimestamp(latestReading.timestamp)}` : 'No readings available'}
            </p>
            {thresholds && (
              <p className="text-xs text-muted-foreground">
                Acceptable range: {thresholds.minHumidity}% - {thresholds.maxHumidity}%
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Status Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Device added: {format(new Date(device.createdAt), 'yyyy-MM-dd')}
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-refresh: {autoRefresh ? 'Enabled (30s)' : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Sensor Readings</CardTitle>
          <CardDescription>
            {activeTab === 'latest' ? 'Last 10 temperature and humidity readings' :
             activeTab === 'daily' ? 'Daily temperature and humidity data' : 
             'Custom date range temperature and humidity data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
            }}
          >
            <div className="flex justify-between items-center mb-4 flex-wrap">
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
              
              {/* Date picker for daily view */}
              {activeTab === 'daily' && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-[180px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date && deviceIdRef.current) {
                            // Set the selected date with proper UTC time
                            const newDate = new Date(date);
                            newDate.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone issues
                            
                            console.log('Calendar date selected:', formatInTimeZone(date, 'UTC', 'yyyy-MM-dd'));
                            console.log('Normalized date for UTC:', formatInTimeZone(newDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'));
                            
                            setSelectedDate(newDate);
                            // Force refresh with the new date
                            setTimeout(() => {
                              fetchReadings(deviceIdRef.current!, 'daily');
                            }, 0);
                          }
                        }}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {/* Date range picker */}
              {activeTab === 'range' && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal w-[250px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                            </>
                          ) : (
                            format(dateRange.from, "PPP")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={(newRange) => {
                          setDateRange(newRange);
                          if (newRange?.from && newRange?.to && deviceIdRef.current) {
                            fetchReadings(deviceIdRef.current, 'range', newRange);
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            {/* Chart display area */}
            <div className="pt-4">
              {isRefreshing && (
                <div className="text-center mb-2">
                  <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  <span className="ml-2 text-xs text-muted-foreground">Refreshing data...</span>
                </div>
              )}
              
              {readings.length > 0 ? (
                <DeviceColumnChart 
                  data={readings} 
                  height={400}
                  limit={10}
                  dateMode={chartDateMode}
                />
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No sensor readings available for the selected timeframe
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceDetail;
