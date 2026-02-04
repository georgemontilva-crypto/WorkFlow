/**
 * SuperAdminRoute Component
 * Protects routes from non-super-admin access
 * Automatically redirects to /dashboard if user is not super_admin
 * Returns 404-like experience for security
 */

import { useAuth } from '@/_core/hooks/useAuth';
import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface SuperAdminRouteProps {
  children: ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: '/login',
  });
  
  const [, setLocation] = useLocation();

  // Redirect non-super-admin users
  useEffect(() => {
    if (!loading && user && user.role !== 'super_admin') {
      // Redirect to dashboard for non-super-admin users
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, useAuth will handle redirect
  if (!user) {
    return null;
  }

  // If not super_admin, show nothing (redirect will happen via useEffect)
  if (user.role !== 'super_admin') {
    return null;
  }

  // User is super_admin, render the protected content
  return <>{children}</>;
}
