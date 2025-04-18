
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/services/mockData';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  isLoading: true,
  isAuthenticated: false,
  refreshUserData: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Load user from localStorage
  const refreshUserData = useCallback(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use the direct login API endpoint
      // Handle both absolute and relative URLs
      const baseApiUrl = import.meta.env.VITE_DB_API_URL || '/api';
      const fullApiUrl = baseApiUrl.startsWith('http') 
        ? baseApiUrl 
        : `${window.location.origin}${baseApiUrl}`;
      const apiUrl = `${fullApiUrl}/login`;
      
      console.log('Login attempt with API URL:', apiUrl);
      
      // Check if we should use the real API or mock data
      if (import.meta.env.VITE_USE_REAL_API === 'true') {
        console.log('Using real API');
        
        try {
          console.log('Sending request to:', apiUrl);
          
          // Add a timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('Response status:', response.status);
          
          try {
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.ok && data.success) {
              console.log('Login successful');
              // Store user data and token
              setUser(data.data.user);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(data.data.user));
              localStorage.setItem('token', data.data.token);
              
              toast({
                title: "Login successful",
                description: `Welcome back, ${data.data.user.username}!`,
              });
              setIsLoading(false);
              return true;
            } else {
              console.log('Login failed:', data.message);
              toast({
                title: "Login failed",
                description: data.message || "Invalid email or password.",
                variant: "destructive",
              });
              setIsLoading(false);
              return false;
            }
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            toast({
              title: "Login failed",
              description: "Server returned an invalid response. Please try again.",
              variant: "destructive",
            });
            setIsLoading(false);
            return false;
          }
        } catch (fetchError: any) {
          console.error('Fetch error:', fetchError);
          
          let errorMessage = "Could not connect to the server. Please check your network connection.";
          
          if (fetchError.name === 'AbortError') {
            errorMessage = "Request timed out. The server is taking too long to respond.";
          } else if (fetchError.message && fetchError.message.includes('NetworkError')) {
            errorMessage = "Network error. Please check if the server is running and accessible.";
          } else if (fetchError.message) {
            errorMessage = `Error: ${fetchError.message}`;
          }
          
          toast({
            title: "Connection error",
            description: errorMessage,
            variant: "destructive",
          });
          
          setIsLoading(false);
          return false;
        }
      } else {
        console.log('Using mock data for development');
        
        // Try to use the direct login API endpoint even in mock mode
        try {
          // Try with current hostname first
          const directApiUrl = `${window.location.origin}/api/login`;
          console.log('Trying direct API URL:', directApiUrl);
          
          const response = await fetch(directApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log('Login successful via direct API');
              setUser(data.data.user);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(data.data.user));
              localStorage.setItem('token', data.data.token);
              
              toast({
                title: "Login successful",
                description: `Welcome back, ${data.data.user.username}!`,
              });
              setIsLoading(false);
              return true;
            }
          }
        } catch (directApiError) {
          console.log('Direct API call failed, falling back to mock data');
        }
        
        // Fall back to mock data
        return await new Promise<boolean>((resolve) => {
          setTimeout(() => {
            // For demo, check if user exists with that email (and is registered)
            const foundUser = mockUsers.find(u => u.email === email);
            
            if (foundUser && foundUser.isActive) {
              setUser(foundUser);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(foundUser));
              toast({
                title: "Login successful (Mock)",
                description: `Welcome back, ${foundUser.username}!`,
              });
              resolve(true);
            } else if (foundUser && !foundUser.isActive) {
              toast({
                title: "Account inactive",
                description: "Your account is awaiting approval by an administrator.",
                variant: "destructive",
              });
              resolve(false);
            } else {
              toast({
                title: "Login failed",
                description: "Invalid email or password.",
                variant: "destructive",
              });
              resolve(false);
            }
            setIsLoading(false);
          }, 600);
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  }, [toast]);

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use the real API endpoint
      // Handle both absolute and relative URLs
      const baseApiUrl = import.meta.env.VITE_DB_API_URL || '/api';
      const fullApiUrl = baseApiUrl.startsWith('http') 
        ? baseApiUrl 
        : `${window.location.origin}${baseApiUrl}`;
      const apiUrl = `${fullApiUrl}/auth/register`;
      
      // Check if we should use the real API or mock data
      if (import.meta.env.VITE_USE_REAL_API === 'true') {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          toast({
            title: "Registration successful",
            description: "Your account has been created. You can now log in.",
          });
          setIsLoading(false);
          return true;
        } else {
          toast({
            title: "Registration failed",
            description: data.message || "Failed to register. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
      } else {
        // Use mock data for development
        return await new Promise<boolean>((resolve) => {
          setTimeout(() => {
            // Check if email already exists
            const userExists = mockUsers.some(u => u.email === email);
            
            if (userExists) {
              toast({
                title: "Registration failed",
                description: "Email already in use.",
                variant: "destructive",
              });
              resolve(false);
            } else {
              // Create new user and push to mockUsers array
              const newUser = {
                id: mockUsers.length + 1,
                username,
                email,
                role: 'user',
                isActive: true, // Set to true so they can log in right away
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              mockUsers.push(newUser as User);
              
              toast({
                title: "Registration successful",
                description: "Your account has been created. You can now log in.",
              });
              resolve(true);
            }
            setIsLoading(false);
          }, 600);
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      isLoading, 
      isAuthenticated,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
