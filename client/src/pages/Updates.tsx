/**
 * Updates Page - Finwrk
 * Changelog and platform updates history
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, CheckCircle2, Sparkles, Bug, Zap, Shield } from 'lucide-react';

interface Update {
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'security';
  changes: string[];
}

const updates: Update[] = [
  {
    version: '1.0.0',
    date: '2026-01-20',
    type: 'feature',
    changes: [
      'Sistema de autenticación de dos factores (2FA) completamente funcional',
      'Verificación de código TOTP durante el login',
      'Nuevos templates de email con diseño minimalista',
      'Logo de 512px en emails con contenedor con borde',
      'Email del super admin actualizado a admin@finwrk.app',
      'Página de Updates para historial de cambios',
      'Logo del sidebar reducido proporcionalmente',
      'Botones de upgrade en color blanco',
      'Versión de la app visible en el footer del sidebar',
    ],
  },
  {
    version: '0.9.5',
    date: '2026-01-19',
    type: 'improvement',
    changes: [
      'Rebranding completo de Hiwork a Finwrk',
      'Nuevo logo y favicon implementados',
      'Sistema de suscripciones (Free, Pro, Business)',
      'Página de pricing dentro del dashboard',
      'Badges de plan en el sidebar',
      'Indicador de fortaleza de contraseña en signup',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-01-18',
    type: 'feature',
    changes: [
      'Sistema de verificación de email con Resend',
      'Funcionalidad de recuperación de contraseña',
      'Templates de email profesionales',
      'Safe-area-inset para dispositivos móviles',
      'Configuración de DNS para finwrk.app',
    ],
  },
  {
    version: '0.8.5',
    date: '2026-01-17',
    type: 'improvement',
    changes: [
      'Landing page con sección de seguridad',
      'FAQ implementado',
      'Sección de pricing en landing',
      'Mejoras en el diseño responsive',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-16',
    type: 'feature',
    changes: [
      'Dashboard principal con widgets',
      'Sistema de clientes',
      'Generación de facturas',
      'Gestión de finanzas',
      'Metas de ahorro',
      'Sistema de recordatorios',
    ],
  },
];

const typeConfig = {
  feature: {
    label: 'Nueva Funcionalidad',
    icon: Sparkles,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  improvement: {
    label: 'Mejora',
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  bugfix: {
    label: 'Corrección de Errores',
    icon: Bug,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  security: {
    label: 'Seguridad',
    icon: Shield,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
};

export default function Updates() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Actualizaciones de Finwrk
          </h1>
          <p className="text-muted-foreground">
            Historial de cambios, mejoras y nuevas funcionalidades de la plataforma
          </p>
        </div>

        {/* Updates Timeline */}
        <div className="space-y-6">
          {updates.map((update, index) => {
            const config = typeConfig[update.type];
            const Icon = config.icon;

            return (
              <div
                key={update.version}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Version Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Versión {update.version}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(update.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                    {config.label}
                  </span>
                </div>

                {/* Changes List */}
                <div className="space-y-2">
                  {update.changes.map((change, changeIndex) => (
                    <div
                      key={changeIndex}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
          <p className="text-sm text-muted-foreground text-center">
            ¿Tienes sugerencias o encontraste un error?{' '}
            <a href="/settings" className="text-primary hover:underline font-semibold">
              Contáctanos desde Configuración
            </a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
