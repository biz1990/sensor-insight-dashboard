
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { mockDevices, getDeviceReadings } from '@/services/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DateRange, Device } from '@/types';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

const ExportData = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would be an API call
      setDevices(mockDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) {
        toast({
          title: "Date range required",
          description: "Please select a date range for export.",
          variant: "destructive",
        });
        return;
      }
      
      // In a real application, this would call an API to generate the CSV
      // For demo, we'll use mock data
      
      // Calculate days difference
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let exportData = [];
      
      if (selectedDevice === 'all') {
        // Export data for all devices
        for (const device of devices) {
          const readings = getDeviceReadings(device.id, diffDays * 24);
          exportData.push(...readings.map(reading => ({
            deviceId: device.id,
            deviceName: device.name,
            ...reading,
          })));
        }
      } else {
        // Export data for single device
        const deviceId = parseInt(selectedDevice);
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          const readings = getDeviceReadings(deviceId, diffDays * 24);
          exportData = readings.map(reading => ({
            deviceId: device.id,
            deviceName: device.name,
            ...reading,
          }));
        }
      }
      
      // Sort by timestamp
      exportData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Convert to CSV
      const headers = ['Device ID', 'Device Name', 'Timestamp', 'Temperature (°C)', 'Humidity (%)'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(item => [
          item.deviceId,
          `"${item.deviceName}"`,
          format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          item.temperature,
          item.humidity
        ].join(','))
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
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
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
