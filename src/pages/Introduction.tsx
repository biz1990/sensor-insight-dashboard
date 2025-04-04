import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, AreaChart, ThermometerIcon, ActivityIcon, ServerIcon, UsersIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Introduction = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-blue-700 dark:text-blue-400">
            Sensor Monitoring System
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            A complete solution for temperature and humidity monitoring across all your devices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<ThermometerIcon className="w-12 h-12 text-blue-500" />}
            title="Real-time Monitoring"
            description="Monitor temperature and humidity readings from all your sensors in real-time with automatic updates."
          />
          <FeatureCard 
            icon={<AreaChart className="w-12 h-12 text-blue-500" />}
            title="Advanced Analytics"
            description="View detailed charts and analytics to track temperature and humidity patterns over time."
          />
          <FeatureCard 
            icon={<ActivityIcon className="w-12 h-12 text-blue-500" />}
            title="Alerts & Notifications"
            description="Set custom thresholds and receive alerts when sensor readings fall outside acceptable ranges."
          />
          <FeatureCard 
            icon={<ServerIcon className="w-12 h-12 text-blue-500" />}
            title="Device Management"
            description="Easily add, configure, and monitor all your sensor devices from a central dashboard."
          />
          <FeatureCard 
            icon={<Gauge className="w-12 h-12 text-blue-500" />}
            title="Performance Metrics"
            description="Track device performance and reliability with detailed status reports."
          />
          <FeatureCard 
            icon={<UsersIcon className="w-12 h-12 text-blue-500" />}
            title="User Management"
            description="Manage access with role-based permissions for administrators and regular users."
          />
        </div>

        <div className="flex justify-center mt-12">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="mr-4">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" className="mr-4">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">Register</Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 md:mt-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-6 md:gap-12">
            <StepCard 
              number="1"
              title="Connect Devices" 
              description="Add your sensor devices to the system and configure their locations."
            />
            <StepCard 
              number="2"
              title="Monitor Data"
              description="View real-time temperature and humidity readings from your devices."
            />
            <StepCard 
              number="3"
              title="Analyze Trends"
              description="Explore historical data with interactive charts and export reports."
            />
          </div>
        </div>
      </div>
      
      <footer className="border-t bg-slate-50 dark:bg-slate-900 dark:border-slate-800 py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Sensor Monitoring System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-center text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => {
  return (
    <div className="flex flex-col items-center max-w-xs">
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center">{description}</p>
    </div>
  );
};

export default Introduction;
