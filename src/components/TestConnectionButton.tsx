
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
          title: 'Connection Successful',
          description: 'Successfully connected to the MSSQL database.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.message || 'Could not connect to the database.',
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
