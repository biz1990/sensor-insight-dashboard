
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testConnection } from '@/services/databaseService';
import { toast } from '@/hooks/use-toast';

const TestConnectionButton = () => {
  const [testing, setTesting] = useState(false);
  
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testConnection();
      
      if (result.success) {
        toast({
          title: 'Connection Simulation Successful',
          description: 'Connection settings saved. In a production environment, these settings would be used to connect to your database through a secure backend.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection Simulation Failed',
          description: result.message || 'Connection simulation failed. Please check your settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleTestConnection} 
      disabled={testing}
    >
      {testing ? 'Testing...' : 'Test Connection'}
    </Button>
  );
};

export default TestConnectionButton;
