# Análisis de Campos Faltantes en clientData

## Estructura de la Tabla `clients` (según schema.ts)

1. `id` - serial (auto)
2. `user_id` - int
3. `name` - varchar
4. `email` - varchar
5. `phone` - varchar
6. `company` - varchar
7. `has_recurring_billing` - boolean
8. `billing_cycle` - enum (nullable)
9. `custom_cycle_days` - int (nullable)
10. `amount` - decimal (nullable)
11. `next_payment_date` - timestamp (nullable)
12. `currency` - varchar
13. `reminder_days` - int
14. `status` - enum
15. `archived` - boolean
16. `notes` - text (nullable)
17. `created_at` - timestamp
18. `updated_at` - timestamp

**Total: 18 columnas**

---

## Campos en clientData (routers.ts líneas 725-738)

### Siempre incluidos:
1. `name` ✅
2. `email` ✅
3. `phone` ✅
4. `company` ✅
5. `has_recurring_billing` ✅
6. `currency` ✅
7. `status` ✅
8. `archived` ✅
9. `notes` ✅
10. `user_id` ✅
11. `created_at` ✅
12. `updated_at` ✅

### Solo si `has_recurring_billing = true`:
13. `billing_cycle` ⚠️
14. `custom_cycle_days` ⚠️
15. `amount` ⚠️
16. `next_payment_date` ⚠️
17. `reminder_days` ⚠️

---

## PROBLEMA IDENTIFICADO

Cuando `has_recurring_billing = false` (cliente NO recurrente):

- **Campos enviados:** 12 campos
- **Campos esperados:** 18 columnas en la tabla
- **Campos faltantes:** `billing_cycle`, `custom_cycle_days`, `amount`, `next_payment_date`, `reminder_days`

**Drizzle ORM está intentando hacer un INSERT con solo 12 valores, pero la tabla tiene 18 columnas.**

---

## SOLUCIÓN

Estos campos son **NULLABLE** en el schema, por lo que debemos enviarlos como `null` o `undefined` cuando el cliente NO es recurrente:

```typescript
const clientData: any = {
  name: input.name,
  email: input.email,
  phone: input.phone || "",
  company: input.company,
  has_recurring_billing: input.has_recurring_billing,
  currency: input.currency || "USD",
  status: input.status,
  archived: input.archived,
  notes: input.notes,
  user_id: ctx.user.id,
  created_at: new Date(),
  updated_at: new Date(),
  // AGREGAR ESTOS CAMPOS SIEMPRE:
  billing_cycle: input.has_recurring_billing ? (input.billing_cycle || "monthly") : null,
  custom_cycle_days: input.has_recurring_billing ? input.custom_cycle_days : null,
  amount: input.has_recurring_billing ? (input.amount || "0") : null,
  next_payment_date: input.has_recurring_billing ? (input.next_payment_date ? new Date(input.next_payment_date) : new Date()) : null,
  reminder_days: input.has_recurring_billing ? input.reminder_days : null,
};
```

**Esto asegura que TODOS los campos estén presentes en el INSERT, con valores `null` para clientes no recurrentes.**
