/**
 * App Component
 * Design Philosophy: Apple Minimalism - Negro, grises, blanco
 * Tema oscuro por defecto
 */


import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ToastProvider } from "./contexts/ToastContext";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import VerificationPending from "./pages/VerificationPending";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify2FA from "./pages/Verify2FA";
import Updates from "./pages/Updates";
import PayInvoice from "./pages/PayInvoice";
import PublicInvoice from "./pages/PublicInvoice";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import Finances from "./pages/Finances";
import Savings from "./pages/Savings";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Markets from "./pages/Markets";
import PricingPage from "./pages/PricingPage";
import CompanyProfile from "./pages/CompanyProfile";
import { ProtectedRoute } from "./components/ProtectedRoute";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/verification-pending" component={VerificationPending} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-2fa" component={Verify2FA} />
      <Route path="/pay" component={PayInvoice} />
      <Route path="/invoice/:token" component={PublicInvoice} />
      
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
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/company-profile">
        <ProtectedRoute>
          <CompanyProfile />
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
      <Route path="/pricing">
        <ProtectedRoute>
          <PricingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/updates">
        <ProtectedRoute>
          <Updates />
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
          <ToastProvider>
            <TooltipProvider>
              <Router />
            </TooltipProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
