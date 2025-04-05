
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testConnection } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const TestConnectionButton = () => {
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testConnection();
      
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: result.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.message || 'Connection failed. Please check your settings.',
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
      className="gap-2"
    >
      {testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</> : 'Test Connection'}
    </Button>
  );
};

export default TestConnectionButton;
