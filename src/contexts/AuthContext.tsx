
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/services/mockData';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API request
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // For demo, check if user exists with that email (and is registered)
        const foundUser = mockUsers.find(u => u.email === email);
        
        if (foundUser && foundUser.isActive) {
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
          toast({
            title: "Login successful",
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
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API request
    return new Promise<boolean>((resolve) => {
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
          // Create new user and push to mockUsers array (with isActive set to true for demo)
          const newUser = {
            id: mockUsers.length + 1,
            username,
            email,
            password, // In a real app, this would be hashed
            role: 'user',
            isActive: true, // Changed from false to true so they can log in right away
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          mockUsers.push(newUser);
          
          toast({
            title: "Registration successful",
            description: "Your account has been created. You can now log in.",
          });
          resolve(true);
        }
        setIsLoading(false);
      }, 1000);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
