/**
 * Admin Dashboard - Super Admin only page for managing users
 * Design Philosophy: Apple Minimalism - Clean, functional, powerful
 */

import { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle, XCircle, Search, Calendar, Mail, User } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';

export default function Admin() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect non-super-admins to 404
  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      setLocation('/404');
    }
  }, [user, loading, setLocation]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all');

  // Fetch all users
  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  
  // Mutations
  const grantAccessMutation = trpc.admin.grantLifetimeAccess.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const revokeAccessMutation = trpc.admin.revokeLifetimeAccess.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleGrantAccess = async (userId: number) => {
    if (confirm('¿Estás seguro de que quieres otorgar acceso de por vida a este usuario?')) {
      await grantAccessMutation.mutateAsync({ user_id: userId });
    }
  };

  const handleRevokeAccess = async (userId: number) => {
    if (confirm('¿Estás seguro de que quieres revocar el acceso de por vida de este usuario?')) {
      await revokeAccessMutation.mutateAsync({ user_id: userId });
    }
  };

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Admin</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  const getAccessBadge = (hasAccess: number, subscriptionPlan: string) => {
    if (hasAccess === 1) {
      return <Badge className="bg-green-500 hover:bg-green-600">✓ Acceso de por vida</Badge>;
    }
    
    switch (subscriptionPlan) {
      case 'pro':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Plan Pro</Badge>;
      case 'business':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Plan Business</Badge>;
      case 'free':
      default:
        return <Badge variant="secondary">Plan Free</Badge>;
    }
  };

  // Show loading while checking authentication
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not super_admin (will redirect via useEffect)
  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground mt-1">
                Gestiona usuarios, permisos y accesos del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Usuarios
                </CardTitle>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Usuarios registrados</p>
            </CardContent>
          </Card>

          <Card className="border hover:border-green-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Con Acceso de por Vida
                </CardTitle>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {users?.filter(u => u.has_lifetime_access === 1).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Usuarios con acceso completo</p>
            </CardContent>
          </Card>

          <Card className="border hover:border-amber-500/50 transition-colors sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En Período de Prueba
                </CardTitle>
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-600">
                {users?.filter(u => u.has_lifetime_access === 0 && u.subscription_plan === 'free').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Usuarios en plan gratuito</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar y Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              
              {/* Role Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterRole === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterRole('all')}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Todos ({users?.length || 0})
                </Button>
                <Button
                  variant={filterRole === 'user' ? 'default' : 'outline'}
                  onClick={() => setFilterRole('user')}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Usuarios ({users?.filter(u => u.role === 'user').length || 0})
                </Button>
                <Button
                  variant={filterRole === 'admin' ? 'default' : 'outline'}
                  onClick={() => setFilterRole('admin')}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Admins ({users?.filter(u => u.role === 'admin').length || 0})
                </Button>
                <Button
                  variant={filterRole === 'super_admin' ? 'default' : 'outline'}
                  onClick={() => setFilterRole('super_admin')}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Super Admins ({users?.filter(u => u.role === 'super_admin').length || 0})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List - Mobile Cards / Desktop Table */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios ({filteredUsers?.length || 0})
            </CardTitle>
            <CardDescription>
              Lista completa de usuarios registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile View - Cards */}
            <div className="block lg:hidden space-y-4">
              {filteredUsers?.map((user) => (
                <Card key={user.id} className="border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {getRoleBadge(user.role)}
                        {getAccessBadge(user.has_lifetime_access, user.subscription_plan)}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Registrado: {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {user.has_lifetime_access === 1 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(user.id)}
                            disabled={user.role === 'super_admin'}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revocar Acceso
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleGrantAccess(user.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Otorgar Acceso
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-4 px-4 font-semibold">Usuario</th>
                    <th className="text-left py-4 px-4 font-semibold">Rol</th>
                    <th className="text-left py-4 px-4 font-semibold">Acceso</th>
                    <th className="text-left py-4 px-4 font-semibold">Registro</th>
                    <th className="text-right py-4 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {getAccessBadge(user.has_lifetime_access, user.subscription_plan)}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          {user.has_lifetime_access === 1 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeAccess(user.id)}
                              disabled={user.role === 'super_admin'}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Revocar
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGrantAccess(user.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Otorgar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredUsers?.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No se encontraron usuarios</p>
                <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
