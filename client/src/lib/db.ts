/**
 * WorkFlow Database - Dexie.js Configuration
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
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customCycleDays?: number;
  amount: number;
  nextPaymentDate: string;
  reminderDays: number; // Días de anticipación para recordatorio
  status: 'active' | 'inactive' | 'overdue';
  archived?: boolean; // Indica si el recordatorio está archivado
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id?: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount?: number; // Monto pagado (para pagos parciales)
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'archived';
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  clientId?: number;
  invoiceId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Configuración de la base de datos
const db = new Dexie('WorkFlowDB') as Dexie & {
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
