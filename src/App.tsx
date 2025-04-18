
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import Introduction from "@/pages/Introduction";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Devices from "@/pages/Devices";
import DeviceDetail from "@/pages/DeviceDetail";
import Settings from "@/pages/Settings";
import UsersAdmin from "@/pages/admin/UsersAdmin";
import LocationsAdmin from "@/pages/admin/LocationsAdmin";
import ThresholdsAdmin from "@/pages/admin/ThresholdsAdmin";
import ExportData from "@/pages/ExportData";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import TestDashboard from "@/test/TestDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Introduction />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/test" element={<TestDashboard />} />
            
            {/* Private routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/devices" 
              element={
                <PrivateRoute>
                  <Devices />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/devices/:id" 
              element={
                <PrivateRoute>
                  <DeviceDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/export" 
              element={
                <PrivateRoute>
                  <ExportData />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin/users" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <UsersAdmin />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/locations" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <LocationsAdmin />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/thresholds" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ThresholdsAdmin />
                </PrivateRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
