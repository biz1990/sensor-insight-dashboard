# Quick Start Guide for Sensor Insight Dashboard

This guide will help you quickly get started with the Sensor Insight Dashboard.

## Starting the Application

### On Windows

1. Double-click the `start-windows.bat` file in the main folder.
   - This will open two command windows:
     - One for the API server
     - One for the frontend development server

2. Access the dashboard in your browser:
   ```
   http://localhost:8080
   ```

### On Other Operating Systems
### ubuntu
chmod +x node_modules/.bin/*  
1. Open a terminal and run:
   ```
   npm run server
   ```

2. Open another terminal and run:
   ```
   npm run dev
   ```

3. Access the dashboard in your browser:
   ```
   http://localhost:8080
   ```

## Accessing from Other Computers

To access the dashboard from other computers on your network:

1. Find your computer's IP address by running:
   ```
   ipconfig
   ```
   (Look for the IPv4 Address under your active network adapter)

2. Other computers can access the dashboard using:
   ```
   http://your-ip-address:8080
   ```

## Weather Widget

The dashboard includes a weather widget that displays real-time outdoor weather data:

1. The widget is pre-configured to show weather for Seoul, South Korea by default
2. You can search for any city or location using the search box
3. The widget shows current conditions, temperature, and a 3-day forecast
4. Click the refresh button to update the weather data
5. Weather data is provided by WeatherAPI.com with no additional configuration required

The dashboard also includes an Indoor Climate Summary that shows the average temperature and humidity across all your sensors.

## Troubleshooting

If you encounter issues:

1. **Server won't start**
   - Make sure you have all dependencies installed:
     ```
     npm install
     cd server
     npm install
     ```
   - On Linux/Ubuntu, you may need to set execute permissions:
     ```
     chmod +x node_modules/.bin/*
     ```

2. **Database connection errors**
   - Check the database configuration in `server/server.js`
   - Make sure SQL Server is running and accessible

3. **Login issues**
   - The default login is:
     - Email: admin@example.com
     - Password: password123

4. **Network access issues**
   - Make sure your firewall allows connections on ports 8080 and 3001
   - Check that both the server and frontend are running

5. **Weather widget not showing**
   - Check your internet connection
   - Try refreshing the widget using the refresh button
   - Clear your browser cache
   - Ensure your firewall allows connections to api.weatherapi.com

For more detailed setup instructions, see the [NETWORK_SETUP.md](NETWORK_SETUP.md) file.