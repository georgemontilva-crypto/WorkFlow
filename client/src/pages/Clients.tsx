/**
 * Clients Page - Gestión de Clientes
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client } from '@/lib/db';
import { Plus, Search, MoreVertical, Mail, Phone, Building } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, addMonths, addDays, parseISO } from 'date-fns';

export default function Clients() {
  const clients = useLiveQuery(() => db.clients.orderBy('createdAt').reverse().toArray());
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingCycle: 'monthly',
    amount: 0,
    status: 'active',
    notes: '',
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.amount) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const now = new Date().toISOString();
    let nextPaymentDate = new Date();

    switch (formData.billingCycle) {
      case 'monthly':
        nextPaymentDate = addMonths(new Date(), 1);
        break;
      case 'quarterly':
        nextPaymentDate = addMonths(new Date(), 3);
        break;
      case 'yearly':
        nextPaymentDate = addMonths(new Date(), 12);
        break;
      case 'custom':
        nextPaymentDate = addDays(new Date(), formData.customCycleDays || 30);
        break;
    }

    await db.clients.add({
      ...formData as Client,
      nextPaymentDate: nextPaymentDate.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Cliente agregado exitosamente');
    setIsDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      billingCycle: 'monthly',
      amount: 0,
      status: 'active',
      notes: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
            <p className="text-muted-foreground">
              Gestiona tu base de datos de clientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Agregar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle" className="text-foreground">Ciclo de Facturación</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value: any) => setFormData({ ...formData, billingCycle: value })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">Monto *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="bg-background border-border text-foreground font-mono"
                      required
                    />
                  </div>
                </div>

                {formData.billingCycle === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customCycleDays" className="text-foreground">Días del Ciclo Personalizado</Label>
                    <Input
                      id="customCycleDays"
                      type="number"
                      value={formData.customCycleDays}
                      onChange={(e) => setFormData({ ...formData, customCycleDays: parseInt(e.target.value) })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">Notas</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    Guardar Cliente
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-foreground"
            />
          </div>
        </div>

        {/* Clients List */}
        {!filteredClients || filteredClients.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <img 
                src="/images/empty-state-clients.png" 
                alt="No hay clientes" 
                className="w-64 h-64 object-contain opacity-50 mb-6"
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay clientes aún
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza agregando tu primer cliente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="bg-card border-border hover:border-accent transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground">{client.name}</CardTitle>
                      {client.company && (
                        <p className="text-sm text-muted-foreground mt-1">{client.company}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Próximo Pago</span>
                      <span className="text-sm font-medium text-foreground">
                        {format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monto</span>
                      <span className="text-lg font-bold font-mono text-foreground">
                        ${client.amount.toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
