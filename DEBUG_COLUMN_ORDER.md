# Debug: Orden de Columnas en INSERT

## Error SQL del Log

```
insert into `clients` (`id`, `user_id`, `name`, `email`, `phone`, `company`, 
`has_recurring_billing`, `billing_cycle`, `custom_cycle_days`, `amount`, 
`next_payment_date`, `currency`, `reminder_days`, `status`, `archived`, 
`notes`, `created_at`, `updated_at`) 
values (default, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

## Valores en el Params (del error)

```
params: 7,Andres Tobon,andrstobon1@gmail.com,+1 (305) 849-7410,ZeroFeesPOS,
false,,,,,USD,,active,false,,2026-01-25 01:29:05.237,2026-01-25 01:29:05.237
```

## Mapeo de Valores

1. `user_id` = 7 ✅
2. `name` = Andres Tobon ✅
3. `email` = andrstobon1@gmail.com ✅
4. `phone` = +1 (305) 849-7410 ✅
5. `company` = ZeroFeesPOS ✅
6. `has_recurring_billing` = false ✅
7. `billing_cycle` = (vacío) ❌ **AQUÍ ESTÁ EL PROBLEMA**
8. `custom_cycle_days` = (vacío)
9. `amount` = (vacío)
10. `next_payment_date` = (vacío)
11. `currency` = USD ✅
12. `reminder_days` = (vacío)
13. `status` = active ✅
14. `archived` = false ✅
15. `notes` = (vacío)
16. `created_at` = 2026-01-25 01:29:05.237 ✅
17. `updated_at` = 2026-01-25 01:29:05.237 ✅

## Problema Identificado

Los valores **vacíos** (empty strings) están siendo enviados en lugar de `NULL`.

Drizzle está generando:
- `billing_cycle` = '' (empty string)
- `custom_cycle_days` = '' (empty string)
- etc.

Pero debería ser:
- `billing_cycle` = NULL
- `custom_cycle_days` = NULL
- etc.

## Causa Raíz

En el código `db.ts`, estamos enviando:

```typescript
billing_cycle: data.has_recurring_billing ? data.billing_cycle : null,
```

Pero `data.billing_cycle` podría ser `undefined` o una cadena vacía `''`.

Cuando es `undefined`, el ternario devuelve `null` ✅
Pero cuando es `''` (empty string), el ternario devuelve `''` ❌

## Solución

Cambiar el código para que convierta empty strings a null:

```typescript
billing_cycle: data.has_recurring_billing && data.billing_cycle ? data.billing_cycle : null,
```

O mejor:

```typescript
billing_cycle: data.has_recurring_billing ? (data.billing_cycle || null) : null,
```
