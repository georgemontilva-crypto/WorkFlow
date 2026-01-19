/**
 * HiWork Database - Dexie.js Configuration
 * Design Philosophy: Apple Minimalism - Clean, efficient, offline-first
 * 
 * Base de datos local para modo offline con IndexedDB
 */

import Dexie, { type EntityTable } from 'dexie';

// Tipos de datos
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  custom_cycle_days?: number;
  amount: number;
  next_payment_date: string;
  reminder_days: number; // Días de anticipación para recordatorio
  status: 'active' | 'inactive' | 'overdue';
  archived?: boolean; // Indica si el recordatorio está archivado
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id?: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax: string;
  total: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: string; // JSON string
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  client_id?: number;
  invoice_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Configuración de la base de datos
const db = new Dexie('HiWorkDB') as Dexie & {
  clients: EntityTable<Client, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  savingsGoals: EntityTable<SavingsGoal, 'id'>;
};

// Schema de la base de datos
db.version(1).stores({
  clients: '++id, name, email, status, nextPaymentDate, createdAt',
  invoices: '++id, clientId, invoiceNumber, status, dueDate, createdAt',
  transactions: '++id, type, category, date, clientId, invoiceId, createdAt',
  savingsGoals: '++id, name, status, deadline, createdAt'
});

export { db };
