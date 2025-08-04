import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Truck, 
  LayoutDashboard, 
  Plus, 
  ClipboardList, 
  Search, 
  Users, 
  LogOut,
  Settings,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const departmentNames = {
  paper_creator: "Paper Creator",
  project_office: "Project Office Staff", 
  area_office: "Area Office Staff",
  road_sale: "Road Sale Staff",
  role_creator: "Role Creator (Admin)",
};

const navigationItems = {
  paper_creator: [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/create-do", icon: Plus, label: "Create DO" },
  ],
  project_office: [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/process-do", icon: ClipboardList, label: "Process DOs" },
  ],
  area_office: [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/process-do", icon: ClipboardList, label: "Process DOs" },
  ],
  road_sale: [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/process-do", icon: ClipboardList, label: "Process DOs" },
  ],
  role_creator: [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/user-management", icon: Users, label: "User Management" },
  ],
};

export default function MobileSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const userNavigation = navigationItems[user.department as keyof typeof navigationItems] || [];
  const isConsumerPortal = location.startsWith("/search-do");

  const handleNavigation = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-lg">DO System</SheetTitle>
              <p className="text-sm text-gray-600">
                {departmentNames[user.department as keyof typeof departmentNames]}
              </p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-4 space-y-2">
          {/* Consumer Portal Access */}
          <Button 
            variant={isConsumerPortal ? "secondary" : "ghost"} 
            className={cn(
              "w-full justify-start",
              isConsumerPortal && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => handleNavigation("/search-do")}
          >
            <Search className="h-5 w-5 mr-3" />
            Consumer Portal
          </Button>

          {!isConsumerPortal && (
            <>
              {userNavigation.map((item) => (
                <Button 
                  key={item.path}
                  variant={location === item.path ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start",
                    location === item.path && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              ))}
            </>
          )}
        </nav>

        {/* User Info & Actions */}
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/settings")}
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => {
                logoutMutation.mutate();
                setOpen(false);
              }}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {logoutMutation.isPending ? "Signing out..." : "Logout"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
