# Diseño del Nuevo Sistema de Clientes

## 🎯 PRINCIPIOS DE DISEÑO

1. **Simplicidad** - Menos campos, lógica clara
2. **Validación** - Datos siempre correctos
3. **Sin duplicados** - Prevención automática
4. **Predecibilidad** - Comportamiento consistente
5. **Trazabilidad** - Logging completo

---

## 📊 MODELO DE CLIENTE SIMPLIFICADO

### Campos Obligatorios
```typescript
{
  id: number;              // Auto-generado
  user_id: number;         // Propietario
  name: string;            // Nombre o razón social
  email: string;           // Email (único por usuario)
  status: 'active' | 'inactive';
  created_at: Date;        // Auto-generado
  updated_at: Date;        // Auto-actualizado
}
```

### Campos Opcionales
```typescript
{
  phone?: string;          // Teléfono (opcional)
  company?: string;        // Empresa
  notes?: string;          // Notas internas
  archived: boolean;       // Default: false
}
```

### Campos de Billing (Opcionales)
```typescript
{
  has_recurring_billing: boolean;  // Default: false
  billing_cycle?: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  custom_cycle_days?: number;
  amount?: string;
  next_payment_date?: Date;
  currency: string;        // Default: "USD"
  reminder_days: number;   // Default: 7
}
```

---

## 🔒 VALIDACIONES

### 1. Validación de Campos Obligatorios
```typescript
- name: min 2 caracteres, max 255
- email: formato válido, max 320 caracteres
- user_id: número positivo
- status: enum válido
```

### 2. Normalización de Datos
```typescript
- email: lowercase + trim
- name: trim
- phone: trim
- company: trim
- notes: trim
```

### 3. Prevención de Duplicados
```typescript
- Verificar que NO exista cliente con mismo email para mismo user_id
- Índice único en base de datos: (user_id, email)
- Mensaje claro: "Ya existe un cliente con este email"
```

### 4. Validación de Billing
```typescript
Si has_recurring_billing = true:
  - billing_cycle: requerido
  - amount: requerido, > 0
  - next_payment_date: requerido, fecha futura
  
Si has_recurring_billing = false:
  - billing_cycle: null
  - amount: null
  - next_payment_date: null
  - reminder_days: null
```

---

## 🔄 FLUJO DE CREACIÓN

### 1. Frontend - Validación Inicial
```
Usuario completa formulario
  ↓
Validar campos obligatorios (cliente)
  ↓
Normalizar datos (trim, lowercase email)
  ↓
Validar formato de email
  ↓
Si pasa → Enviar a backend
Si falla → Mostrar error inline
```

### 2. Backend - Validación y Creación
```
Recibir datos del frontend
  ↓
Validar input schema (Zod)
  ↓
Normalizar datos (trim, lowercase)
  ↓
Verificar duplicados (email + user_id)
  ↓
Si duplicado → Error 400 "Cliente ya existe"
  ↓
Validar campos de billing (si aplica)
  ↓
Crear cliente en DB
  ↓
Log: "Cliente creado: {id}"
  ↓
Retornar cliente creado
```

### 3. Base de Datos - Integridad
```
INSERT con todos los campos
  ↓
Índice único verifica duplicados
  ↓
Si duplicado → Error SQL
  ↓
Si OK → Cliente guardado
  ↓
Retornar ID generado
```

---

## 🛠️ IMPLEMENTACIÓN

### 1. Schema (drizzle/schema.ts)

**Cambios necesarios:**
```typescript
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),  // Ahora opcional
  company: varchar("company", { length: 255 }),
  has_recurring_billing: boolean("has_recurring_billing").notNull().default(false),
  billing_cycle: mysqlEnum("billing_cycle", ["monthly", "quarterly", "yearly", "custom"]),
  custom_cycle_days: int("custom_cycle_days"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  next_payment_date: timestamp("next_payment_date"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  reminder_days: int("reminder_days"),  // Ahora nullable
  status: mysqlEnum("status", ["active", "inactive", "overdue"]).notNull().default("active"),
  archived: boolean("archived").notNull().default(false),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Índice único para prevenir duplicados
  uniqueEmailPerUser: unique().on(table.user_id, table.email),
}));
```

### 2. Backend - Función createClient (db.ts)

```typescript
export async function createClient(data: {
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  has_recurring_billing: boolean;
  billing_cycle?: string;
  custom_cycle_days?: number;
  amount?: string;
  next_payment_date?: Date;
  currency: string;
  reminder_days?: number;
  status: string;
  archived: boolean;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Normalizar email
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // Verificar duplicados
    const existing = await db
      .select()
      .from(clients)
      .where(
        sql`${clients.user_id} = ${data.user_id} AND ${clients.email} = ${normalizedEmail}`
      )
      .limit(1);
    
    if (existing.length > 0) {
      throw new Error("DUPLICATE_CLIENT");
    }
    
    // Preparar datos normalizados
    const clientData = {
      user_id: data.user_id,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      has_recurring_billing: data.has_recurring_billing,
      billing_cycle: data.has_recurring_billing ? data.billing_cycle : null,
      custom_cycle_days: data.has_recurring_billing ? data.custom_cycle_days : null,
      amount: data.has_recurring_billing ? data.amount : null,
      next_payment_date: data.has_recurring_billing ? data.next_payment_date : null,
      currency: data.currency || "USD",
      reminder_days: data.has_recurring_billing ? data.reminder_days : null,
      status: data.status,
      archived: data.archived,
      notes: data.notes?.trim() || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Insertar cliente
    const result = await db.insert(clients).values(clientData);
    
    // Obtener cliente creado
    const newClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, result[0].insertId))
      .limit(1);
    
    console.log(`[DB] Cliente creado: ${newClient[0].id} - ${newClient[0].name}`);
    
    return newClient[0];
  } catch (error: any) {
    if (error.message === "DUPLICATE_CLIENT") {
      console.log(`[DB] Intento de crear cliente duplicado: ${data.email} (user: ${data.user_id})`);
      throw new Error("Ya existe un cliente con este email");
    }
    console.error("[DB] Error al crear cliente:", error);
    throw error;
  }
}
```

### 3. Backend - Router (routers.ts)

```typescript
create: protectedProcedure
  .input(z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
    email: z.string().email("Email inválido").max(320),
    phone: z.string().optional(),
    company: z.string().optional(),
    has_recurring_billing: z.boolean().default(false),
    billing_cycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional(),
    custom_cycle_days: z.number().optional(),
    amount: z.string().optional(),
    next_payment_date: z.string().optional(),
    currency: z.string().length(3).default("USD"),
    reminder_days: z.number().optional(),
    status: z.enum(["active", "inactive", "overdue"]).default("active"),
    notes: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Verificar límites de plan
      if (ctx.user.role !== 'super_admin') {
        const { getPlanLimit } = await import("./plans");
        const clientLimit = getPlanLimit(ctx.user.subscription_plan as any, 'clients');
        
        if (clientLimit !== Infinity) {
          const existingClients = await db.getClientsByUserId(ctx.user.id);
          if (existingClients.length >= clientLimit) {
            throw new Error(`Has alcanzado el límite de ${clientLimit} clientes en el plan Free. Actualiza a Pro para clientes ilimitados.`);
          }
        }
      }
      
      // Validar campos de billing si es recurrente
      if (input.has_recurring_billing) {
        if (!input.billing_cycle) {
          throw new Error("El ciclo de facturación es requerido para clientes recurrentes");
        }
        if (!input.amount || parseFloat(input.amount) <= 0) {
          throw new Error("El monto debe ser mayor a 0 para clientes recurrentes");
        }
        if (!input.next_payment_date) {
          throw new Error("La fecha del próximo pago es requerida para clientes recurrentes");
        }
      }
      
      // Crear cliente
      const client = await db.createClient({
        user_id: ctx.user.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        has_recurring_billing: input.has_recurring_billing,
        billing_cycle: input.billing_cycle,
        custom_cycle_days: input.custom_cycle_days,
        amount: input.amount,
        next_payment_date: input.next_payment_date ? new Date(input.next_payment_date) : undefined,
        currency: input.currency,
        reminder_days: input.reminder_days,
        status: input.status,
        archived: false,
        notes: input.notes,
      });
      
      console.log(`[API] Cliente creado exitosamente: ${client.id}`);
      
      return { 
        success: true, 
        client: client 
      };
    } catch (error: any) {
      console.error(`[API] Error al crear cliente:`, error.message);
      throw new Error(error.message || "Error al crear cliente");
    }
  }),
```

### 4. Frontend - Formulario (Clients.tsx)

**Cambios principales:**
- Validar email antes de enviar
- Normalizar datos (trim, lowercase)
- Mostrar errores específicos
- Simplificar lógica de billing

---

## 📝 LOGGING

### Eventos a Registrar

1. **Intento de creación**
   - `[API] Intentando crear cliente: {email} (user: {user_id})`

2. **Cliente duplicado**
   - `[DB] Cliente duplicado detectado: {email} (user: {user_id})`

3. **Cliente creado**
   - `[DB] Cliente creado: {id} - {name}`
   - `[API] Cliente creado exitosamente: {id}`

4. **Error de validación**
   - `[API] Error de validación: {mensaje}`

5. **Error de base de datos**
   - `[DB] Error al crear cliente: {error}`

---

## ✅ CRITERIOS DE ÉXITO

1. ✅ No se pueden crear clientes duplicados (mismo email)
2. ✅ Todos los campos se validan correctamente
3. ✅ Datos siempre normalizados (email lowercase, trim)
4. ✅ Mensajes de error claros y específicos
5. ✅ Logging completo de todas las operaciones
6. ✅ Formulario simple y claro
7. ✅ Sin estados inconsistentes
8. ✅ Compatible con facturas y pagos existentes
