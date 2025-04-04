
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  BarChartBig, 
  Settings, 
  LogOut, 
  Users, 
  MapPin, 
  AlertCircle, 
  FileText,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Devices', path: '/devices', icon: BarChartBig },
  ];

  // Admin only navigation items
  const adminNavItems = [
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Locations', path: '/admin/locations', icon: MapPin },
    { name: 'Thresholds', path: '/admin/thresholds', icon: AlertCircle },
  ];

  // User navigation items
  const userNavItems = [
    { name: 'Export Data', path: '/export', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "sidebar-bg fixed md:relative z-10 transition-all duration-300 flex flex-col h-screen bg-sidebar border-r border-sidebar-border",
        sidebarOpen ? "w-64" : "w-0 md:w-20",
        isMobile && sidebarOpen ? "left-0" : isMobile && !sidebarOpen ? "-left-full" : ""
      )}>
        <div className="flex items-center justify-between p-4">
          <div className={cn("overflow-hidden", !sidebarOpen && "md:hidden")}>
            <h1 className="text-xl font-bold text-sidebar-foreground">Sensor Insight</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("text-sidebar-foreground", isMobile && !sidebarOpen && "hidden")}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <TooltipProvider key={item.name} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <li>
                      <Button
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full flex items-center gap-3 py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                        onClick={() => navigate(item.path)}
                      >
                        <item.icon size={20} />
                        <span className={cn("text-left transition-opacity", !sidebarOpen && "md:hidden")}>
                          {item.name}
                        </span>
                      </Button>
                    </li>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}

            {/* Admin section */}
            {user?.role === 'admin' && (
              <>
                <li className="pt-4 pb-2">
                  <div className={cn(
                    "px-4 text-xs font-semibold text-sidebar-foreground/60",
                    !sidebarOpen && "md:hidden"
                  )}>
                    Admin
                  </div>
                </li>
                {adminNavItems.map((item) => (
                  <TooltipProvider key={item.name} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <li>
                          <Button
                            variant={isActive(item.path) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full flex items-center gap-3 py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                            onClick={() => navigate(item.path)}
                          >
                            <item.icon size={20} />
                            <span className={cn("text-left transition-opacity", !sidebarOpen && "md:hidden")}>
                              {item.name}
                            </span>
                          </Button>
                        </li>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="right">
                          {item.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </>
            )}

            {/* User section */}
            <li className="pt-4 pb-2">
              <div className={cn(
                "px-4 text-xs font-semibold text-sidebar-foreground/60",
                !sidebarOpen && "md:hidden"
              )}>
                User
              </div>
            </li>
            {userNavItems.map((item) => (
              <TooltipProvider key={item.name} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <li>
                      <Button
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full flex items-center gap-3 py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                        onClick={() => navigate(item.path)}
                      >
                        <item.icon size={20} />
                        <span className={cn("text-left transition-opacity", !sidebarOpen && "md:hidden")}>
                          {item.name}
                        </span>
                      </Button>
                    </li>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className={cn("border-t border-sidebar-border p-4", !sidebarOpen && "md:hidden")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className={cn("ml-3", !sidebarOpen && "md:hidden")}>
                <p className="text-sidebar-foreground font-medium">{user?.username}</p>
                <p className="text-sidebar-foreground/60 text-xs">{user?.email}</p>
              </div>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut size={20} />
                  </Button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    Logout
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle button */}
      {isMobile && !sidebarOpen && (
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleSidebar}
          className="fixed z-10 top-4 left-4"
        >
          <Menu size={20} />
        </Button>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300", 
        isMobile && !sidebarOpen ? "ml-0" : isMobile && sidebarOpen ? "ml-0" : !sidebarOpen ? "md:ml-20" : "md:ml-64"
      )}>
        <div className="container py-8 px-4 md:px-8">
          {children}
        </div>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-0"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
