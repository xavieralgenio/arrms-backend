import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Home from "./pages/Home";
import Packages from "./pages/Packages";
import Book from "./pages/Book";

import AdminRoute from "@/components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerRecords from "./pages/CustomerRecords";
import AdminLogin from "@/pages/AdminLogin";

// ✅ ADD THIS
import OAuthCallback from "./pages/OAuthCallback";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/packages"} component={Packages} />
      <Route path={"/book"} component={Book} />

      {/* ✅ ADD THIS ROUTE */}
      <Route path={"/oauth/callback"} component={OAuthCallback} />

      <Route
        path="/admin"
        component={() => (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        )}
      />

      <Route path={"/admin/customers"} component={CustomerRecords} />
      <Route path="/admin-login" component={AdminLogin} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;