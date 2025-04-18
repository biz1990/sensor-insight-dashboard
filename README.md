# Sensor Insight Dashboard

A dashboard for monitoring sensor data with authentication and real-time updates.

## Quick Start

1. **Start the application**

   On Windows, double-click the `start-windows.bat` file or run:
   ```
   npm run server
   ```
   in one terminal, and
   ```
   npm run dev
   ```
   in another terminal.

2. **Access the dashboard**

   Open your browser and go to:
   ```
   http://localhost:8080
   ```

For more detailed instructions, see the [QUICK_START.md](QUICK_START.md) guide.

## Network Setup

To allow other computers on your network to access the dashboard:

1. Run the network test utility to see available IP addresses:
   ```
   npm run network-test
   ```

2. Other computers can access the dashboard using your computer's IP address:
   ```
   http://your-ip-address:8080
   ```

For detailed network setup instructions, see [NETWORK_SETUP.md](NETWORK_SETUP.md).

## Development

- Frontend: React with TypeScript and Shadcn UI
- Backend: Express.js with SQL Server database
- Authentication: JWT-based authentication system
- Weather Data: Open-Meteo API integration
- Charts: Recharts for data visualization

## Test Dashboard

A test dashboard is available at `/test` that demonstrates the functionality with simulated data. This is useful for:

- Testing the UI without connecting to real sensors
- Demonstrating the dashboard to stakeholders
- Development and debugging
- Testing the multi-location weather widget

## Configuration

### Server Configuration

Edit the `config.js` file to customize server settings:
```javascript
const serverConfig = {
  port: 3001,
  host: '0.0.0.0',
  database: {
    // Database settings
  }
};
```

### Weather Widgets

The dashboard includes two weather widget options:

#### Single Location Weather Widget

- Display current temperature and conditions for a single location
- Show hourly forecast for the next 8 hours
- Select from predefined global locations
- Uses the free Open-Meteo API (no API key required)
- Auto-refreshes every 30 minutes

#### Multi-Location Weather Widget

- Monitor weather conditions across multiple global locations simultaneously
- Add or remove locations as needed (up to 6 locations)
- View current conditions and hourly forecasts for each location
- Each location displays in its local timezone
- Perfect for organizations with multiple facilities around the world

The dashboard also includes an Indoor Climate Summary that shows:
- Average temperature and humidity across all sensors
- Min/max ranges for your indoor readings
- Visual indicators for readings outside recommended ranges

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f64ff0ba-aa9e-4469-8e96-20b8c455ec02) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
