/**
 * Settings Page - Configuración
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Database, Download, Trash2, Upload, Languages } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage, t } = useLanguage();

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

      toast.success(t.settings.exportSuccess);
    } catch (error) {
      toast.error('Error exporting data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.clients || !data.invoices || !data.transactions || !data.savingsGoals) {
        toast.error('Invalid file format');
        return;
      }

      if (window.confirm('Are you sure you want to import this data? This will add the data to the existing system.')) {
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

        toast.success(t.settings.importSuccess);
      }
    } catch (error) {
      toast.error(t.settings.importError);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      try {
        await db.clients.clear();
        await db.invoices.clear();
        await db.transactions.clear();
        await db.savingsGoals.clear();
        toast.success('All data has been deleted');
      } catch (error) {
        toast.error('Error deleting data');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.settings.title}</h1>
          <p className="text-muted-foreground">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6 max-w-2xl">
          {/* Language Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Languages className="w-5 h-5" strokeWidth={1.5} />
                {t.settings.language}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.settings.languageSubtitle}
              </p>
              <Select value={language} onValueChange={(value: 'es' | 'en') => setLanguage(value)}>
                <SelectTrigger className="w-full max-w-xs bg-background border-border text-foreground h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="es" className="text-foreground hover:bg-accent cursor-pointer">
                    {t.settings.spanish}
                  </SelectItem>
                  <SelectItem value="en" className="text-foreground hover:bg-accent cursor-pointer">
                    {t.settings.english}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="w-5 h-5" strokeWidth={1.5} />
                {t.settings.dataManagement}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.settings.dataManagementSubtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t.settings.exportData}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t.settings.importData}
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
                  Delete All Data
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
