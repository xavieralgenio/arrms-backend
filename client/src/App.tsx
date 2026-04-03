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

import Login from "./pages/Login";
import PostLogin from "./pages/PostLogin";
import Register from "./pages/Register";
import OAuthCallback from "./pages/OAuthCallback";

// ✅ FIX: create stable wrapper components (prevents remount loop)
function AdminDashboardRoute() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}

function CustomerRecordsRoute() {
  return (
    <AdminRoute>
      <CustomerRecords />
    </AdminRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/packages" component={Packages} />
      <Route path="/book" component={Book} />

      {/* OAuth */}
      <Route path="/oauth/callback" component={OAuthCallback} />

      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/post-login" component={PostLogin} />
      <Route path="/register" component={Register} />

      {/* ✅ FIXED admin routes */}
      <Route path="/admin" component={AdminDashboardRoute} />
      <Route path="/admin/customers" component={CustomerRecordsRoute} />

      <Route path="/404" component={NotFound} />
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