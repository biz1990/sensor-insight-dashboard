import { useState, useEffect } from 'react';
import { fetchWeatherApi } from 'openmeteo';
import { WeatherData, WeatherLocation } from '@/types';

// Re-export the WeatherLocation type
export type { WeatherLocation };

export const useWeather = (location: WeatherLocation) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch weather data from OpenMeteo API
    const fetchWeatherData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use location's timezone or default to UTC
        const timezone = location.timezone || "UTC";
        
        const params = {
          "latitude": location.latitude,
          "longitude": location.longitude,
          "hourly": ["temperature_2m", "relative_humidity_2m"],
          "current": "temperature_2m",
          "timezone": timezone,
          "forecast_days": 1
        };
        
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);
        
        // Process first location
        const response = responses[0];
        
        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        
        const current = response.current()!;
        const hourly = response.hourly()!;
        
        // Process the data
        const data: WeatherData = {
          current: {
            time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
            temperature2m: current.variables(0)!.value(),
          },
          hourly: {
            time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
              (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
            ),
            temperature2m: Array.from(hourly.variables(0)!.valuesArray()!),
            relativeHumidity2m: Array.from(hourly.variables(1)!.valuesArray()!),
          },
        };
        
        setWeatherData(data);
        
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Could not fetch weather data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data immediately
    fetchWeatherData();
    
    // Set up a refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      fetchWeatherData();
    }, 30 * 60 * 1000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, [location.latitude, location.longitude, location.timezone]);

  return { weatherData, isLoading, error };
};

// Predefined locations
export const weatherLocations: WeatherLocation[] = [
  {
    name: 'Hòa Phú, Vĩnh Long, Vietnam',
    latitude: 10.164663,
    longitude: 105.936715,
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    name: 'Seoul, South Korea',
    latitude: 37.5665,
    longitude: 126.9780,
    timezone: 'Asia/Seoul'
  },
  {
    name: 'New York, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York'
  },
  {
    name: 'London, UK',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London'
  },
  {
    name: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo'
  },
  {
    name: 'Sydney, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney'
  }
];