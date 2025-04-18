import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeather, weatherLocations } from '@/hooks/use-weather';
import { WeatherLocation } from '@/types';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeatherWidgetProps {
  className?: string;
  defaultLocation?: string;
}

const MSNWeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  className = '',
  defaultLocation = 'Hòa Phú, Vĩnh Long, Vietnam'
}) => {
  // Find the default location in our predefined locations
  const defaultLocationObj = weatherLocations.find(loc => loc.name === defaultLocation) || weatherLocations[0];
  
  // State for the selected location
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>(defaultLocationObj);
  
  // Use our custom hook to fetch weather data
  const { weatherData, isLoading, error } = useWeather(selectedLocation);
  
  // Handle location change
  const handleLocationChange = (locationName: string) => {
    const newLocation = weatherLocations.find(loc => loc.name === locationName);
    if (newLocation) {
      setSelectedLocation(newLocation);
    }
  };
  
  // Get timezone abbreviation based on location
  const getTimezoneAbbr = (timezone?: string) => {
    if (!timezone) return 'UTC';
    
    // Simple mapping of common timezones to abbreviations
    const timezoneMap: Record<string, string> = {
      'Asia/Ho_Chi_Minh': 'GMT+7',
      'Asia/Seoul': 'KST',
      'America/New_York': 'EST/EDT',
      'Europe/London': 'GMT/BST',
      'Asia/Tokyo': 'JST',
      'Australia/Sydney': 'AEST/AEDT',
      'UTC': 'UTC'
    };
    
    return timezoneMap[timezone] || timezone.split('/').pop() || 'UTC';
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Weather Data</CardTitle>
            <CardDescription>Current conditions</CardDescription>
          </div>
          <Select 
            value={selectedLocation.name} 
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {weatherLocations.map(location => (
                <SelectItem key={location.name} value={location.name}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="py-4 text-center">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
        {weatherData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Current Temperature</h3>
                <p className="text-4xl font-bold">{weatherData.current.temperature2m.toFixed(1)}°C</p>
                <p className="text-sm text-gray-500">
                  Updated: {weatherData.current.time.toLocaleDateString('en-US', { 
                    timeZone: selectedLocation.timezone || 'UTC' 
                  })} {weatherData.current.time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true, 
                    timeZone: selectedLocation.timezone || 'UTC' 
                  })} ({getTimezoneAbbr(selectedLocation.timezone)})
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">
                Hourly Forecast 
                <span className="text-xs font-normal ml-2">
                  ({getTimezoneAbbr(selectedLocation.timezone)})
                </span>
              </h3>
              <div className="grid grid-cols-4 gap-2 overflow-x-auto">
                {weatherData.hourly.time.slice(0, 8).map((time, index) => (
                  <div key={index} className="text-center p-2 bg-gray-100 rounded">
                    <p className="text-sm">{time.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: true, 
                      timeZone: selectedLocation.timezone || 'UTC' 
                    })}</p>
                    <p className="font-bold">{weatherData.hourly.temperature2m[index].toFixed(1)}°C</p>
                    <p className="text-xs">{weatherData.hourly.relativeHumidity2m[index].toFixed(0)}% humidity</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MSNWeatherWidget;
