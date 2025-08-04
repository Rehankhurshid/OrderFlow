import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CreateDoPage from "@/pages/create-do-page";
import ProcessDoPage from "@/pages/process-do-page";
import SearchDoPage from "@/pages/search-do-page";
import UserManagementPage from "@/pages/user-management-page";
import SetupPasswordPage from "@/pages/setup-password-page";
import SettingsPage from "@/pages/settings-page";
import { ConsumerPortalPage } from "@/pages/consumer-portal-page";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import { Truck } from "lucide-react";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <MobileSidebar />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">DO System</h1>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ConsumerPortalPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/setup-password" component={SetupPasswordPage} />
      
      <ProtectedRoute path="/dashboard" component={() => (
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/create-do" component={() => (
        <AppLayout>
          <CreateDoPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/process-do" component={() => (
        <AppLayout>
          <ProcessDoPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/search-do" component={() => (
        <AppLayout>
          <SearchDoPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/user-management" component={() => (
        <AppLayout>
          <UserManagementPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/settings" component={() => (
        <AppLayout>
          <SettingsPage />
        </AppLayout>
      )} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
