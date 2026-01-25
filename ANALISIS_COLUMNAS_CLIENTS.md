# Análisis de Columnas - Tabla `clients`

## Columnas en la Base de Datos (18 columnas):
1. id
2. user_id
3. name
4. email
5. phone
6. company
7. has_recurring_billing
8. billing_cycle
9. custom_cycle_days
10. amount
11. next_payment_date
12. currency
13. reminder_days
14. status
15. archived
16. notes
17. created_at
18. updated_at

## Campos que estamos intentando insertar desde el backend:
```typescript
const clientData: any = {
  name,                      // ✅ existe
  email,                     // ✅ existe
  phone,                     // ✅ existe
  company,                   // ✅ existe
  has_recurring_billing,     // ✅ existe
  currency,                  // ✅ existe
  status,                    // ✅ existe
  archived,                  // ✅ existe
  notes,                     // ✅ existe
  user_id,                   // ✅ existe
  created_at,                // ✅ existe
  updated_at,                // ✅ existe
  
  // Solo si has_recurring_billing es true:
  billing_cycle,             // ✅ existe
  custom_cycle_days,         // ✅ existe
  amount,                    // ✅ existe
  next_payment_date,         // ✅ existe
  reminder_days,             // ✅ existe (pero se envía siempre, no solo cuando recurring)
};
```

## Problema Identificado:

El campo `archived` en el schema de Drizzle es de tipo `boolean`, pero en el frontend se está enviando como `number` (0 o 1).

En el input schema del backend:
```typescript
archived: z.number().default(0)
```

Pero en el schema de Drizzle:
```typescript
archived: boolean("archived").notNull().default(false)
```

**SOLUCIÓN:** Cambiar el tipo de `archived` en el input schema del backend a `boolean`.
