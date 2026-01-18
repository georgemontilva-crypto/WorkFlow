import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Crear clientes de prueba
const clients = [
  {
    userId: 1,
    name: 'Tech Solutions SA',
    email: 'contacto@techsolutions.com',
    phone: '+1234567890',
    company: 'Tech Solutions',
    address: 'Av. Principal 123, Ciudad',
    amount: '1500.00',
    frequency: 'monthly',
    nextPaymentDate: new Date('2026-02-15'),
    status: 'active',
    reminderDays: 7,
  },
  {
    userId: 1,
    name: 'Marketing Pro',
    email: 'info@marketingpro.com',
    phone: '+1234567891',
    company: 'Marketing Pro',
    address: 'Calle Comercio 456, Ciudad',
    amount: '2500.00',
    frequency: 'monthly',
    nextPaymentDate: new Date('2026-02-20'),
    status: 'active',
    reminderDays: 5,
  },
  {
    userId: 1,
    name: 'Diseño Creativo',
    email: 'hola@disenocreativo.com',
    phone: '+1234567892',
    company: 'Diseño Creativo',
    address: 'Plaza Arte 789, Ciudad',
    amount: '1800.00',
    frequency: 'monthly',
    nextPaymentDate: new Date('2026-02-10'),
    status: 'active',
    reminderDays: 7,
  },
];

console.log('Insertando clientes de prueba...');
for (const client of clients) {
  await db.insert(schema.clients).values(client);
}
console.log('✅ Clientes creados');

// Crear facturas de prueba
const invoices = [
  {
    userId: 1,
    clientId: 1,
    invoiceNumber: 'INV-2026-001',
    issueDate: new Date('2026-01-15'),
    dueDate: new Date('2026-02-15'),
    amount: '1500.00',
    paidAmount: '0',
    status: 'pending',
    items: [
      { description: 'Desarrollo de sitio web', quantity: 1, unitPrice: 1000, total: 1000 },
      { description: 'Hosting anual', quantity: 1, unitPrice: 500, total: 500 },
    ],
    notes: 'Pago por servicios de desarrollo web',
  },
  {
    userId: 1,
    clientId: 2,
    invoiceNumber: 'INV-2026-002',
    issueDate: new Date('2026-01-10'),
    dueDate: new Date('2026-02-10'),
    amount: '2500.00',
    paidAmount: '2500.00',
    status: 'paid',
    items: [
      { description: 'Campaña de marketing digital', quantity: 1, unitPrice: 2000, total: 2000 },
      { description: 'Gestión de redes sociales', quantity: 1, unitPrice: 500, total: 500 },
    ],
    notes: 'Servicios de marketing mes de enero',
  },
  {
    userId: 1,
    clientId: 3,
    invoiceNumber: 'INV-2026-003',
    issueDate: new Date('2026-01-05'),
    dueDate: new Date('2026-01-20'),
    amount: '1800.00',
    paidAmount: '900.00',
    status: 'pending',
    items: [
      { description: 'Diseño de logo', quantity: 1, unitPrice: 800, total: 800 },
      { description: 'Diseño de tarjetas de presentación', quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    notes: 'Pago parcial recibido',
  },
  {
    userId: 1,
    clientId: 1,
    invoiceNumber: 'INV-2025-012',
    issueDate: new Date('2025-12-15'),
    dueDate: new Date('2026-01-15'),
    amount: '1500.00',
    paidAmount: '0',
    status: 'overdue',
    items: [
      { description: 'Mantenimiento web diciembre', quantity: 1, unitPrice: 1500, total: 1500 },
    ],
    notes: 'Factura vencida - requiere seguimiento',
  },
  {
    userId: 1,
    clientId: 2,
    invoiceNumber: 'INV-2025-011',
    issueDate: new Date('2025-12-10'),
    dueDate: new Date('2026-01-10'),
    amount: '2500.00',
    paidAmount: '2500.00',
    status: 'paid',
    items: [
      { description: 'Campaña de marketing diciembre', quantity: 1, unitPrice: 2500, total: 2500 },
    ],
    notes: 'Pagado en su totalidad',
  },
];

console.log('Insertando facturas de prueba...');
for (const invoice of invoices) {
  await db.insert(schema.invoices).values(invoice);
}
console.log('✅ Facturas creadas');

console.log('\n🎉 Datos de prueba insertados exitosamente!');
console.log('- 3 clientes creados');
console.log('- 5 facturas creadas (1 pagada, 2 pendientes, 1 vencida, 1 con pago parcial)');

await connection.end();
