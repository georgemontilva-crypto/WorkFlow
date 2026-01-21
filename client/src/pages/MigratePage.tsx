import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export default function MigratePage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const migrateMutation = trpc.migrate.runRemindersMigration.useMutation({
    onSuccess: (data) => {
      setStatus(`✅ ${data.message}`);
      setLoading(false);
    },
    onError: (error) => {
      setStatus(`❌ Error: ${error.message}`);
      setLoading(false);
    },
  });

  const handleMigrate = () => {
    setLoading(true);
    setStatus('🔄 Ejecutando migración...');
    migrateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Migración de Base de Datos</h1>
        <p className="text-gray-400 mb-6">
          Haz clic en el botón para crear la tabla de recordatorios
        </p>
        
        <Button
          onClick={handleMigrate}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-black font-semibold mb-4"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Migración'}
        </Button>

        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-500/10 text-green-400' :
            status.includes('❌') ? 'bg-red-500/10 text-red-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            {status}
          </div>
        )}

        {status.includes('✅') && (
          <p className="text-sm text-gray-400 mt-4">
            Puedes cerrar esta página y volver a Recordatorios
          </p>
        )}
      </div>
    </div>
  );
}
