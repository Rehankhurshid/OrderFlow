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
import Sidebar from "@/components/layout/sidebar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/setup-password" component={SetupPasswordPage} />
      
      <ProtectedRoute path="/" component={() => (
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
