/**
 * App Component
 * Design Philosophy: Apple Minimalism - Negro, grises, blanco
 * Tema oscuro por defecto
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import Finances from "./pages/Finances";
import Savings from "./pages/Savings";
import Settings from "./pages/Settings";
import Reminders from "./pages/Reminders";
import Admin from "./pages/Admin";
import Markets from "./pages/Markets";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CrispChat } from "./components/CrispChat";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/verify-email" component={VerifyEmail} />
      
      {/* Protected routes - require authentication */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices">
        <ProtectedRoute>
          <Invoices />
        </ProtectedRoute>
      </Route>
      <Route path="/finances">
        <ProtectedRoute>
          <Finances />
        </ProtectedRoute>
      </Route>
      <Route path="/savings">
        <ProtectedRoute>
          <Savings />
        </ProtectedRoute>
      </Route>
      <Route path="/reminders">
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>
      <Route path="/markets">
        <ProtectedRoute>
          <Markets />
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
            <CrispChat />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
