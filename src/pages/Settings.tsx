
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [databaseSettings, setDatabaseSettings] = useState({
    server: 'localhost',
    database: 'SensorDB',
    username: 'sa',
    password: '',
    port: '1433',
  });
  
  const handleSaveDatabaseSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call to save these settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: 'Settings saved',
        description: 'Database connection settings have been updated.',
      });
    } catch (error) {
      console.error('Error saving database settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save database settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    try {
      // In a real app, this would trigger a password reset email
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for password reset instructions.',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: 'Failed to send password reset email.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="database">Database Connection</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input value={user?.role || ''} disabled />
              </div>
              <div className="pt-4">
                <Button onClick={handleResetPassword}>Reset Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>
                Configure your MSSQL database connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="server">Server</Label>
                    <Input 
                      id="server" 
                      value={databaseSettings.server}
                      onChange={(e) => setDatabaseSettings({
                        ...databaseSettings,
                        server: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input 
                      id="port" 
                      value={databaseSettings.port}
                      onChange={(e) => setDatabaseSettings({
                        ...databaseSettings,
                        port: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="database">Database Name</Label>
                  <Input 
                    id="database" 
                    value={databaseSettings.database}
                    onChange={(e) => setDatabaseSettings({
                      ...databaseSettings,
                      database: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Database Username</Label>
                  <Input 
                    id="username" 
                    value={databaseSettings.username}
                    onChange={(e) => setDatabaseSettings({
                      ...databaseSettings,
                      username: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Database Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={databaseSettings.password}
                    onChange={(e) => setDatabaseSettings({
                      ...databaseSettings,
                      password: e.target.value
                    })}
                  />
                </div>
                
                <Button 
                  onClick={handleSaveDatabaseSettings} 
                  className="mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Connection Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
              <CardDescription>
                Notes about the database structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Add notes about your database schema, tables, etc."
                className="min-h-[150px]"
              />
              <Button className="mt-4">Save Notes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground pb-4">
                Configure notification settings for alerts, warnings, and system messages.
              </p>
              {/* Notification settings would go here */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="email-alerts" className="rounded border-gray-300" />
                <Label htmlFor="email-alerts">Receive email alerts for critical warnings</Label>
              </div>
              <Button className="mt-4">Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
