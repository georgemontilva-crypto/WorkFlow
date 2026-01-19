/**
 * Admin Dashboard - Super Admin only page for managing users
 * Design Philosophy: Apple Minimalism - Clean, functional, powerful
 */

import { useState } from 'react';
import { Shield, Users, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Admin() {
  const { t } = useLanguage();
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
        return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  const getAccessBadge = (hasAccess: number, trialEndsAt: Date | null) => {
    if (hasAccess === 1) {
      return <Badge className="bg-green-500">Acceso de por vida</Badge>;
    }
    
    if (trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(trialEndsAt);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        return <Badge variant="outline">Prueba: {daysLeft} días</Badge>;
      } else {
        return <Badge variant="destructive">Prueba expirada</Badge>;
      }
    }
    
    return <Badge variant="secondary">Sin acceso</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona usuarios, permisos y accesos del sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Con Acceso de por Vida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {users?.filter(u => u.has_lifetime_access === 1).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Período de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {users?.filter(u => u.has_lifetime_access === 0 && u.trial_ends_at).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterRole('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterRole === 'user' ? 'default' : 'outline'}
                onClick={() => setFilterRole('user')}
                size="sm"
              >
                Usuarios
              </Button>
              <Button
                variant={filterRole === 'admin' ? 'default' : 'outline'}
                onClick={() => setFilterRole('admin')}
                size="sm"
              >
                Admins
              </Button>
              <Button
                variant={filterRole === 'super_admin' ? 'default' : 'outline'}
                onClick={() => setFilterRole('super_admin')}
                size="sm"
              >
                Super Admins
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers?.length || 0})</CardTitle>
          <CardDescription>
            Lista completa de usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium">Rol</th>
                  <th className="text-left py-3 px-4 font-medium">Acceso</th>
                  <th className="text-left py-3 px-4 font-medium">Registro</th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-4">
                      {getAccessBadge(user.has_lifetime_access, user.trial_ends_at)}
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

          {filteredUsers?.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
