/**
 * PaymentReceivedNotification Component
 * Shows a popup notification when a client sends a payment proof
 * Design Philosophy: Apple Minimalism with attention-grabbing animations
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, X, Eye, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

interface PaymentNotification {
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  currency: string;
}

export function PaymentReceivedNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<PaymentNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [, setLocation] = useLocation();
  
  // Get user to check if authenticated
  const { data: user } = trpc.auth.me.useQuery();
  
  // Get invoices to check for payment_sent status
  const { data: invoices, refetch } = trpc.invoices.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000, // Check every 30 seconds
  });
  
  // Track which notifications have been shown
  const [shownNotifications, setShownNotifications] = useState<Set<number>>(() => {
    const stored = localStorage.getItem('shownPaymentNotifications');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  
  // Get clients for names
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Check for new payment_sent invoices
  useEffect(() => {
    if (!invoices || !clients) return;
    
    const paymentSentInvoices = invoices.filter(
      inv => inv.status === 'payment_sent' && !shownNotifications.has(inv.id)
    );
    
    if (paymentSentInvoices.length > 0) {
      const invoice = paymentSentInvoices[0];
      const client = clients.find(c => c.id === invoice.client_id);
      
      setNotification({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: client?.name || 'Cliente',
        amount: invoice.total,
        currency: invoice.currency || 'USD',
      });
      
      // Show notification with animation
      setTimeout(() => setIsVisible(true), 100);
      
      // Mark as shown
      const newShown = new Set(shownNotifications);
      newShown.add(invoice.id);
      setShownNotifications(newShown);
      localStorage.setItem('shownPaymentNotifications', JSON.stringify([...newShown]));
    }
  }, [invoices, clients, shownNotifications]);
  
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);
  
  const handleView = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
      setLocation('/invoices');
    }, 300);
  }, [setLocation]);
  
  return (
    <>
      {children}
      
      {notification && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ maxWidth: '420px', width: 'calc(100vw - 2rem)' }}
        >
          <Card 
            className="bg-popover border-2 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.4)] animate-pulse-border-green"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="p-2.5 rounded-xl bg-green-500/20 text-green-500 flex-shrink-0 animate-bounce-subtle">
                  <DollarSign className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      Comprobante de Pago Recibido
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{notification.clientName}</span> ha enviado un comprobante de pago
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Factura {notification.invoiceNumber} • <span className="font-mono font-semibold text-green-400">${parseFloat(notification.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleView}
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver Factura
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismiss}
                      className="border-border text-muted-foreground hover:bg-accent w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Descartar
                    </Button>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          <style>{`
            @keyframes pulse-border-green {
              0%, 100% {
                border-color: rgb(34 197 94);
                box-shadow: 0 0 25px rgba(34, 197, 94, 0.4);
              }
              50% {
                border-color: rgb(34 197 94 / 0.6);
                box-shadow: 0 0 35px rgba(34, 197, 94, 0.6);
              }
            }

            @keyframes bounce-subtle {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-3px);
              }
            }

            .animate-pulse-border-green {
              animation: pulse-border-green 2s ease-in-out infinite;
            }

            .animate-bounce-subtle {
              animation: bounce-subtle 2s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
