/**
 * Alert Service - Sistema inteligente de generación de alertas
 * Genera alertas automáticamente basado en eventos del sistema
 */

import { getDb } from "./db";
import { alerts, invoices, clients, users, transactions } from "../drizzle/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

type AlertType = "info" | "warning" | "critical";

interface CreateAlertParams {
  user_id: number;
  type: AlertType;
  event: string;
  message: string;
  persistent?: boolean;
  shown_as_toast?: boolean;
  action_url?: string;
  action_text?: string;
  required_plan?: "free" | "pro" | "business";
  related_id?: number;
  related_type?: string;
}

/**
 * Create an alert in the database
 */
export async function createAlert(params: CreateAlertParams) {
  const db = await getDb();
  
  // Check if similar alert already exists (avoid duplicates)
  const existingAlerts = await db
    .select()
    .from(alerts)
    .where(and(
      eq(alerts.user_id, params.user_id),
      eq(alerts.event, params.event),
      eq(alerts.related_id, params.related_id || 0),
      eq(alerts.is_read, 0)
    ))
    .limit(1);

  if (existingAlerts.length > 0) {
    // Alert already exists, don't create duplicate
    return null;
  }

  const result = await db.insert(alerts).values({
    user_id: params.user_id,
    type: params.type,
    event: params.event,
    message: params.message,
    persistent: params.persistent !== false ? 1 : 0,
    shown_as_toast: params.shown_as_toast === true ? 1 : 0,
    is_read: 0,
    action_url: params.action_url,
    action_text: params.action_text,
    required_plan: params.required_plan,
    related_id: params.related_id,
    related_type: params.related_type,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return result[0].insertId;
}

/**
 * Check for overdue invoices and create alerts
 */
export async function checkOverdueInvoices(user_id: number) {
  const db = await getDb();
  
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.status, "sent"),
      sql`${invoices.due_date} < NOW()`
    ));

  if (overdueInvoices.length > 0) {
    await createAlert({
      user_id,
      type: "critical",
      event: "Facturas Vencidas",
      message: `Tienes ${overdueInvoices.length} factura${overdueInvoices.length > 1 ? 's' : ''} vencida${overdueInvoices.length > 1 ? 's' : ''}`,
      shown_as_toast: true,
      action_url: "/invoices",
      action_text: "Ver facturas",
      related_id: overdueInvoices[0].id,
      related_type: "invoice",
    });
  }
}

/**
 * Check for invoices with pending payment proof
 */
export async function checkPendingPaymentProof(user_id: number) {
  const db = await getDb();
  
  const pendingProofInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.status, "pending_confirmation"),
      sql`${invoices.payment_proof_url} IS NOT NULL`
    ));

  if (pendingProofInvoices.length > 0) {
    await createAlert({
      user_id,
      type: "warning",
      event: "Comprobantes Pendientes",
      message: `${pendingProofInvoices.length} comprobante${pendingProofInvoices.length > 1 ? 's' : ''} de pago esperando confirmación`,
      shown_as_toast: true,
      action_url: "/invoices",
      action_text: "Revisar",
      related_id: pendingProofInvoices[0].id,
      related_type: "invoice",
    });
  }
}

/**
 * Check for invoices due soon (within 3 days)
 */
export async function checkUpcomingInvoices(user_id: number) {
  const db = await getDb();
  
  const upcomingInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.status, "sent"),
      sql`${invoices.due_date} BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)`
    ));

  if (upcomingInvoices.length > 0) {
    await createAlert({
      user_id,
      type: "warning",
      event: "Facturas Próximas a Vencer",
      message: `${upcomingInvoices.length} factura${upcomingInvoices.length > 1 ? 's' : ''} vence${upcomingInvoices.length > 1 ? 'n' : ''} en los próximos 3 días`,
      shown_as_toast: false,
      action_url: "/invoices",
      action_text: "Ver facturas",
      related_id: upcomingInvoices[0].id,
      related_type: "invoice",
    });
  }
}

/**
 * Check for confirmed income (invoice paid)
 */
export async function checkConfirmedIncome(user_id: number, invoice_id: number) {
  const db = await getDb();
  
  const invoice = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.id, invoice_id),
      eq(invoices.user_id, user_id)
    ))
    .limit(1);

  if (invoice.length > 0) {
    await createAlert({
      user_id,
      type: "info",
      event: "Ingreso Confirmado",
      message: `Pago confirmado: $${invoice[0].total.toFixed(2)} de ${invoice[0].client_name}`,
      shown_as_toast: true,
      action_url: "/transactions",
      action_text: "Ver transacciones",
      related_id: invoice_id,
      related_type: "invoice",
    });
  }
}

/**
 * Check monthly income comparison
 */
export async function checkMonthlyIncomeComparison(user_id: number) {
  const db = await getDb();
  
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // Current month income
  const currentMonthResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.user_id, user_id),
      eq(transactions.type, "income"),
      gte(transactions.date, currentMonthStart),
      lte(transactions.date, currentMonthEnd)
    ));

  // Last month income
  const lastMonthResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.user_id, user_id),
      eq(transactions.type, "income"),
      gte(transactions.date, lastMonthStart),
      lte(transactions.date, lastMonthEnd)
    ));

  const currentIncome = currentMonthResult[0]?.total || 0;
  const lastIncome = lastMonthResult[0]?.total || 0;

  if (lastIncome === 0) return; // No comparison possible

  const percentageChange = ((currentIncome - lastIncome) / lastIncome) * 100;

  if (percentageChange < -20) {
    // Income decreased by more than 20%
    await createAlert({
      user_id,
      type: "warning",
      event: "Ingresos Mensuales Bajos",
      message: `Tus ingresos han disminuido ${Math.abs(percentageChange).toFixed(0)}% respecto al mes anterior`,
      shown_as_toast: true,
      action_url: "/dashboard",
      action_text: "Ver dashboard",
    });
  } else if (percentageChange > 20) {
    // Income increased by more than 20%
    await createAlert({
      user_id,
      type: "info",
      event: "Ingresos Mensuales en Aumento",
      message: `Tus ingresos han aumentado ${percentageChange.toFixed(0)}% respecto al mes anterior`,
      shown_as_toast: true,
      action_url: "/dashboard",
      action_text: "Ver dashboard",
    });
  }
}

/**
 * Check for month with no income
 */
export async function checkMonthWithNoIncome(user_id: number) {
  const db = await getDb();
  
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const incomeResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(
      eq(transactions.user_id, user_id),
      eq(transactions.type, "income"),
      gte(transactions.date, currentMonthStart),
      lte(transactions.date, currentMonthEnd)
    ));

  const incomeCount = incomeResult[0]?.count || 0;

  if (incomeCount === 0 && new Date().getDate() > 15) {
    // No income and we're past mid-month
    await createAlert({
      user_id,
      type: "warning",
      event: "Mes Sin Ingresos",
      message: "No has registrado ingresos este mes",
      shown_as_toast: true,
      action_url: "/transactions",
      action_text: "Registrar ingreso",
    });
  }
}

/**
 * Check for plan limits (Free plan)
 */
export async function checkPlanLimits(user_id: number) {
  const db = await getDb();
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, user_id))
    .limit(1);

  if (user.length === 0 || user[0].subscription_plan !== "free") return;

  // Check invoice count
  const invoiceCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invoices)
    .where(eq(invoices.user_id, user_id));

  const count = invoiceCount[0]?.count || 0;

  if (count >= 10) {
    await createAlert({
      user_id,
      type: "warning",
      event: "Límite de Plan Alcanzado",
      message: "Has alcanzado el límite de 10 facturas del plan Free",
      shown_as_toast: true,
      action_url: "/settings",
      action_text: "Actualizar plan",
      required_plan: "pro",
    });
  }
}

/**
 * Check for Pro feature blocked
 */
export async function checkProFeatureBlocked(user_id: number, feature: string) {
  await createAlert({
    user_id,
    type: "info",
    event: "Función Pro Bloqueada",
    message: `La función "${feature}" requiere un plan Pro o Business`,
    shown_as_toast: false,
    action_url: "/settings",
    action_text: "Ver planes",
    required_plan: "pro",
  });
}

/**
 * Check for multiple pending invoices
 */
export async function checkMultiplePendingInvoices(user_id: number) {
  const db = await getDb();
  
  const pendingInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.status, "sent")
    ));

  if (pendingInvoices.length >= 5) {
    await createAlert({
      user_id,
      type: "warning",
      event: "Múltiples Facturas Pendientes",
      message: `Tienes ${pendingInvoices.length} facturas pendientes de pago`,
      shown_as_toast: true,
      action_url: "/invoices",
      action_text: "Gestionar facturas",
    });
  }
}

/**
 * Check for client with late payment history
 */
export async function checkClientPaymentHistory(user_id: number, client_id: number) {
  const db = await getDb();
  
  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.client_id, client_id),
      eq(invoices.status, "paid")
    ))
    .orderBy(desc(invoices.paid_at));

  if (clientInvoices.length < 3) return; // Need at least 3 invoices

  let latePayments = 0;
  for (const invoice of clientInvoices.slice(0, 3)) {
    if (invoice.paid_at && invoice.due_date) {
      const daysLate = differenceInDays(new Date(invoice.paid_at), new Date(invoice.due_date));
      if (daysLate > 0) {
        latePayments++;
      }
    }
  }

  if (latePayments >= 2) {
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, client_id))
      .limit(1);

    if (client.length > 0) {
      await createAlert({
        user_id,
        type: "info",
        event: "Cliente con Pagos Tardíos",
        message: `${client[0].name} tiene historial de pagos tardíos`,
        shown_as_toast: false,
        action_url: `/clients`,
        action_text: "Ver cliente",
        related_id: client_id,
        related_type: "client",
      });
    }
  }
}

/**
 * Run all alert checks for a user
 */
export async function runAlertChecks(user_id: number) {
  try {
    await checkOverdueInvoices(user_id);
    await checkPendingPaymentProof(user_id);
    await checkUpcomingInvoices(user_id);
    await checkMonthlyIncomeComparison(user_id);
    await checkMonthWithNoIncome(user_id);
    await checkPlanLimits(user_id);
    await checkMultiplePendingInvoices(user_id);
  } catch (error) {
    console.error(`Error running alert checks for user ${user_id}:`, error);
  }
}
