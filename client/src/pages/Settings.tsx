/**
 * Settings Page - Configuración
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Database, Download, Trash2, Upload } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useRef } from 'react';

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    try {
      const clients = await db.clients.toArray();
      const invoices = await db.invoices.toArray();
      const transactions = await db.transactions.toArray();
      const savingsGoals = await db.savingsGoals.toArray();

      const data = {
        clients,
        invoices,
        transactions,
        savingsGoals,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Datos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar datos');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.clients || !data.invoices || !data.transactions || !data.savingsGoals) {
        toast.error('Formato de archivo inválido');
        return;
      }

      if (window.confirm('¿Estás seguro de que quieres importar estos datos? Esto agregará los datos al sistema existente.')) {
        // Importar clientes
        for (const client of data.clients) {
          const { id, ...clientData } = client;
          await db.clients.add(clientData);
        }

        // Importar facturas
        for (const invoice of data.invoices) {
          const { id, ...invoiceData } = invoice;
          await db.invoices.add(invoiceData);
        }

        // Importar transacciones
        for (const transaction of data.transactions) {
          const { id, ...transactionData } = transaction;
          await db.transactions.add(transactionData);
        }

        // Importar metas de ahorro
        for (const goal of data.savingsGoals) {
          const { id, ...goalData } = goal;
          await db.savingsGoals.add(goalData);
        }

        toast.success('Datos importados exitosamente');
      }
    } catch (error) {
      toast.error('Error al importar datos. Verifica el formato del archivo.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAllData = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      try {
        await db.clients.clear();
        await db.invoices.clear();
        await db.transactions.clear();
        await db.savingsGoals.clear();
        toast.success('Todos los datos han sido eliminados');
      } catch (error) {
        toast.error('Error al eliminar datos');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tus datos y preferencias
          </p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6 max-w-2xl">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="w-5 h-5" strokeWidth={1.5} />
                Base de Datos Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Todos tus datos se almacenan localmente en tu navegador usando IndexedDB. 
                Esto permite que la aplicación funcione sin conexión a internet.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Datos
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Datos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <Button
                  onClick={clearAllData}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Todos los Datos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <SettingsIcon className="w-5 h-5" strokeWidth={1.5} />
                Información de la Aplicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Versión</span>
                <span className="text-sm font-medium text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Modo</span>
                <span className="text-sm font-medium text-foreground">Offline-First</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Almacenamiento</span>
                <span className="text-sm font-medium text-foreground">IndexedDB (Dexie.js)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Formato de Importación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Para importar datos, el archivo JSON debe tener la siguiente estructura:
              </p>
              <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-x-auto">
{`{
  "clients": [...],
  "invoices": [...],
  "transactions": [...],
  "savingsGoals": [...]
}`}
              </pre>
              <p className="text-sm text-muted-foreground mt-3">
                Puedes usar la función "Exportar Datos" para obtener un ejemplo del formato correcto.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
