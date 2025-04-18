import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DateRange, Device } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { getDevices, getDeviceReadings } from '@/services/databaseService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Helper function to convert UTC+7 timestamp to local time
const convertUtc7ToLocal = (timestamp) => {
  // Create a date object from the timestamp
  const date = new Date(timestamp);
  
  // Get the UTC time in milliseconds
  const utcTime = date.getTime();
  
  // Subtract 7 hours (in milliseconds) to get the actual UTC time
  // since the database stores timestamps in UTC+7
  const actualUtcTime = utcTime - (7 * 60 * 60 * 1000);
  
  // Create a new date using the actual UTC time
  return new Date(actualUtcTime);
};

const AlertComponent = ({ status }) => {
  if (status === 'error') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An error occurred while fetching the data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status === 'warning') {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Some devices may have incomplete data in the selected range.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

const ExportData = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const fetchedDevices = await getDevices();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch devices from database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsPending(true);
    try {
      if (!dateRange?.from || !dateRange?.to) {
        toast({
          title: "Date range required",
          description: "Please select a date range for export.",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate days difference
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Add 1 day to ensure we capture the full end date
      const hoursToFetch = (diffDays + 1) * 24;
      
      let exportData = [];
      
      if (selectedDevice === 'all') {
        // Export data for all devices
        for (const device of devices) {
          try {
            const readings = await getDeviceReadings(device.id, hoursToFetch);
            
            // Filter readings to only include those within the selected date range
            const filteredReadings = readings.filter(reading => {
              const readingDate = convertUtc7ToLocal(reading.timestamp);
              const fromDate = new Date(dateRange.from);
              fromDate.setHours(0, 0, 0, 0); // Start of day
              
              const toDate = new Date(dateRange.to);
              toDate.setHours(23, 59, 59, 999); // End of day
              
              return readingDate >= fromDate && readingDate <= toDate;
            });
            
            exportData.push(...filteredReadings.map(reading => ({
              deviceId: device.id,
              deviceName: device.name,
              ...reading,
            })));
          } catch (error) {
            console.error(`Error fetching readings for device ${device.id}:`, error);
          }
        }
      } else {
        // Export data for single device
        const deviceId = parseInt(selectedDevice);
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          try {
            const readings = await getDeviceReadings(deviceId, hoursToFetch);
            
            // Filter readings to only include those within the selected date range
            const filteredReadings = readings.filter(reading => {
              const readingDate = convertUtc7ToLocal(reading.timestamp);
              const fromDate = new Date(dateRange.from);
              fromDate.setHours(0, 0, 0, 0); // Start of day
              
              const toDate = new Date(dateRange.to);
              toDate.setHours(23, 59, 59, 999); // End of day
              
              return readingDate >= fromDate && readingDate <= toDate;
            });
            
            exportData = filteredReadings.map(reading => ({
              deviceId: device.id,
              deviceName: device.name,
              ...reading,
            }));
          } catch (error) {
            console.error(`Error fetching readings for device ${deviceId}:`, error);
          }
        }
      }
      
      if (exportData.length === 0) {
        toast({
          title: "No data",
          description: "No data available for the selected criteria.",
          variant: "default",
        });
        return;
      }
      
      // Sort by timestamp (convert to local time for consistent sorting)
      exportData.sort((a, b) => convertUtc7ToLocal(b.timestamp).getTime() - convertUtc7ToLocal(a.timestamp).getTime());
      
      // Log the first timestamp for debugging
      if (exportData.length > 0) {
        console.log('Original timestamp from DB:', exportData[0].timestamp);
        console.log('As Date object (interpreted as UTC):', new Date(exportData[0].timestamp));
        console.log('Converted to local time:', convertUtc7ToLocal(exportData[0].timestamp));
        console.log('Current local time:', new Date());
      }
      
      // Convert to CSV
      const headers = ['Device ID', 'Device Name', 'Timestamp', 'Temperature (°C)', 'Humidity (%)'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(item => {
          // Convert the UTC+7 timestamp from the database to local time
          const localTime = convertUtc7ToLocal(item.timestamp);
          
          // Format the local time
          const formattedTimestamp = format(localTime, 'yyyy-MM-dd HH:mm:ss');
          
          return [
            item.deviceId,
            `"${item.deviceName}"`,
            formattedTimestamp,
            item.temperature,
            item.humidity
          ].join(',');
        })
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sensor-data-${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Sensor data has been exported to CSV file.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground">
          Export sensor data to CSV format
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Configure your data export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Select Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Select Date Range</label>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-full md:w-[300px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PPP")} -{" "}
                            {format(dateRange.to, "PPP")}
                          </>
                        ) : (
                          format(dateRange.from, "PPP")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {isPending && (
              <Alert className="mt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <AlertTitle>Processing</AlertTitle>
                <AlertDescription>Generating your export file...</AlertDescription>
              </Alert>
            )}

            {exportError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleExport} 
              disabled={!dateRange || !dateRange.from || !dateRange.to}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
