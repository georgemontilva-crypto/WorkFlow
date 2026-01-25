# Checklist de Testing - Sistema de Moneda Principal

**Fecha:** Enero 2026  
**Sistema:** Moneda Principal del Usuario  
**Objetivo:** Verificar que todas las funcionalidades del sistema de moneda funcionan correctamente

---

## ✅ Pre-requisitos

- [ ] Aplicación desplegada en Railway
- [ ] Base de datos actualizada con campo `primary_currency`
- [ ] Usuarios existentes tienen USD como default
- [ ] Frontend compilado sin errores
- [ ] Backend sin errores en logs

---

## 🧪 Tests de Registro (Signup)

### Test 1: Registro con moneda por defecto
- [ ] Abrir página de signup
- [ ] Completar formulario sin seleccionar moneda
- [ ] Verificar que el selector muestra USD por defecto
- [ ] Completar registro
- [ ] **Esperado:** Usuario creado con primary_currency = 'USD'
- [ ] **Verificar en logs:** `[Auth] Currency validated: USD - Dólar estadounidense`

### Test 2: Registro con moneda personalizada
- [ ] Abrir página de signup
- [ ] Click en selector de moneda
- [ ] Buscar "EUR" en el campo de búsqueda
- [ ] Seleccionar "EUR - Euro"
- [ ] Completar registro
- [ ] **Esperado:** Usuario creado con primary_currency = 'EUR'
- [ ] **Verificar en logs:** `[Auth] Currency validated: EUR - Euro`

### Test 3: Búsqueda de moneda
- [ ] Abrir selector de moneda
- [ ] Buscar "peso"
- [ ] **Esperado:** Ver MXN, COP, ARS, CLP, UYU
- [ ] Buscar "dollar"
- [ ] **Esperado:** Ver USD, CAD, AUD, NZD, SGD, HKD, TWD
- [ ] Buscar "xyz"
- [ ] **Esperado:** "No se encontraron monedas"

### Test 4: Validación de campo requerido
- [ ] Intentar registrarse sin seleccionar moneda
- [ ] **Esperado:** Usar USD por defecto (no debería fallar)

---

## ⚙️ Tests de Settings (Cambio de Moneda)

### Test 5: Ver moneda actual
- [ ] Login con usuario existente
- [ ] Ir a Settings
- [ ] Buscar card "Moneda Principal"
- [ ] **Esperado:** Ver badge con código de moneda actual
- [ ] **Esperado:** Ver nombre completo de la moneda
- [ ] **Esperado:** Ver símbolo de la moneda

### Test 6: Cambiar moneda exitosamente
- [ ] En Settings, click en "Cambiar Moneda"
- [ ] **Esperado:** Ver warning sobre datos históricos
- [ ] Seleccionar nueva moneda (ej: EUR)
- [ ] Click en "Confirmar Cambio"
- [ ] **Esperado:** Toast "Currency updated successfully"
- [ ] **Esperado:** Página se recarga automáticamente
- [ ] **Verificar:** Badge ahora muestra EUR
- [ ] **Verificar en logs:** `[Auth] Currency change request from user X: USD -> EUR`
- [ ] **Verificar en logs:** `[Auth] Primary currency updated successfully for user X: EUR`

### Test 7: Cancelar cambio de moneda
- [ ] Click en "Cambiar Moneda"
- [ ] Seleccionar nueva moneda
- [ ] Click en "Cancelar"
- [ ] **Esperado:** Modal se cierra
- [ ] **Esperado:** Moneda no cambia
- [ ] **Esperado:** No hay logs de cambio

### Test 8: Intentar cambiar a la misma moneda
- [ ] Click en "Cambiar Moneda"
- [ ] Seleccionar la misma moneda actual
- [ ] Click en "Confirmar Cambio"
- [ ] **Esperado:** Error "Please select a different currency"
- [ ] **Esperado:** No se realiza el cambio

---

## 📄 Tests de Facturas (Invoices)

### Test 9: Ver moneda en formulario de creación
- [ ] Ir a Invoices
- [ ] Click en "Nueva Factura"
- [ ] **Esperado:** Ver badge informativo con moneda del usuario
- [ ] **Esperado:** Ver texto "La moneda se asigna automáticamente desde tu perfil"
- [ ] **Esperado:** Ver símbolo y código de moneda
- [ ] **Esperado:** NO ver selector de moneda

### Test 10: Crear factura con moneda auto-asignada
- [ ] Completar formulario de factura
- [ ] Agregar al menos 1 ítem
- [ ] Click en "Crear Factura"
- [ ] **Esperado:** Factura creada exitosamente
- [ ] Abrir detalles de la factura
- [ ] **Esperado:** Ver moneda del usuario en la factura
- [ ] **Verificar en logs:** `[Invoices] Invoice number: INV-..., currency: XXX`

### Test 11: Crear múltiples facturas
- [ ] Crear 3 facturas diferentes
- [ ] **Esperado:** Todas usan la misma moneda (primary_currency)
- [ ] Cambiar moneda en Settings
- [ ] Crear 2 facturas nuevas
- [ ] **Esperado:** Las nuevas facturas usan la nueva moneda
- [ ] **Esperado:** Las 3 facturas antiguas mantienen su moneda original

---

## 💰 Tests de Dashboard Financiero (Finances)

### Test 12: Ver badge de moneda en dashboard
- [ ] Ir a Finances
- [ ] **Esperado:** Ver badge con símbolo y código en el header
- [ ] **Esperado:** Badge muestra la moneda del usuario
- [ ] **Ejemplo:** "$ USD" o "€ EUR"

### Test 13: Verificar filtrado por moneda
- [ ] Tener facturas en USD
- [ ] Cambiar moneda a EUR en Settings
- [ ] Crear 1 factura en EUR y marcarla como pagada
- [ ] Ir a Finances
- [ ] **Esperado:** Ver solo la factura en EUR
- [ ] **Esperado:** Ingresos totales = solo suma de facturas en EUR
- [ ] **Esperado:** Las facturas en USD no se muestran

### Test 14: Formateo de montos
- [ ] Crear factura de $1,234.56
- [ ] Marcar como pagada
- [ ] Ir a Finances
- [ ] **Esperado (USD):** "$1,234.56" o formato local correcto
- [ ] Cambiar a EUR
- [ ] Crear factura de €1,234.56
- [ ] **Esperado (EUR):** "€1,234.56" o "1.234,56 €" según locale

### Test 15: Gráficos y tablas
- [ ] Verificar que todos los montos en gráficos usan el símbolo correcto
- [ ] Verificar que la tabla de historial muestra montos formateados
- [ ] Verificar que las cards de resumen usan el símbolo correcto

---

## 🔒 Tests de Validación Backend

### Test 16: Código de moneda inválido (manual/API)
- [ ] Intentar signup con `primaryCurrency: "XXX"` (no existe)
- [ ] **Esperado:** Error "Invalid currency code: XXX"
- [ ] **Verificar en logs:** `[Auth] Invalid currency code: XXX`

### Test 17: Código de moneda con longitud incorrecta
- [ ] Intentar signup con `primaryCurrency: "US"` (2 chars)
- [ ] **Esperado:** Error "Currency code must be 3 characters"
- [ ] Intentar con `primaryCurrency: "USDD"` (4 chars)
- [ ] **Esperado:** Error "Currency code must be 3 characters"

### Test 18: Transform a uppercase
- [ ] Intentar signup con `primaryCurrency: "usd"` (lowercase)
- [ ] **Esperado:** Se acepta y se convierte a "USD"
- [ ] **Verificar en BD:** Campo guardado como "USD"

### Test 19: Validación NOT NULL en BD
- [ ] Verificar que el campo `primary_currency` en BD tiene constraint NOT NULL
- [ ] Intentar insertar usuario sin primary_currency (SQL directo)
- [ ] **Esperado:** Error de BD o usa default 'USD'

---

## 🌍 Tests de Monedas Específicas

### Test 20: Monedas de América
- [ ] Probar con: USD, CAD, MXN, COP, ARS, CLP, BRL
- [ ] **Esperado:** Todas funcionan correctamente
- [ ] **Verificar:** Símbolos correctos ($, C$, R$, etc.)

### Test 21: Monedas de Europa
- [ ] Probar con: EUR, GBP, CHF, SEK, NOK
- [ ] **Esperado:** Todas funcionan correctamente
- [ ] **Verificar:** Símbolos correctos (€, £, CHF, kr)

### Test 22: Monedas de Asia
- [ ] Probar con: JPY, CNY, KRW, INR, AUD
- [ ] **Esperado:** Todas funcionan correctamente
- [ ] **Verificar:** Símbolos correctos (¥, ₩, ₹, A$)

### Test 23: Monedas de Medio Oriente y África
- [ ] Probar con: AED, SAR, ZAR, NGN
- [ ] **Esperado:** Todas funcionan correctamente
- [ ] **Verificar:** Símbolos correctos (د.إ, ﷼, R, ₦)

---

## 📊 Tests de Integración

### Test 24: Flujo completo de nuevo usuario
1. [ ] Registrarse con EUR
2. [ ] Crear 3 clientes
3. [ ] Crear 5 facturas en EUR
4. [ ] Marcar 3 facturas como pagadas
5. [ ] Ir a Finances
6. [ ] **Esperado:** Ver ingresos totales en EUR
7. [ ] Cambiar moneda a USD en Settings
8. [ ] Crear 2 facturas nuevas en USD
9. [ ] Marcar 1 como pagada
10. [ ] Ir a Finances
11. [ ] **Esperado:** Ver solo la factura en USD (no las de EUR)

### Test 25: Migración de usuario existente
- [ ] Usuario creado antes del sistema de moneda
- [ ] **Verificar:** Tiene USD por defecto
- [ ] Cambiar a EUR
- [ ] Crear facturas
- [ ] **Esperado:** Nuevas facturas en EUR

### Test 26: Consistencia entre módulos
- [ ] Verificar que Settings muestra la misma moneda que Invoices
- [ ] Verificar que Invoices muestra la misma moneda que Finances
- [ ] Cambiar moneda en Settings
- [ ] **Esperado:** Cambio se refleja en todos los módulos

---

## 🚨 Tests de Edge Cases

### Test 27: Usuario sin facturas
- [ ] Usuario nuevo sin facturas
- [ ] Ir a Finances
- [ ] **Esperado:** Mostrar $0.00 (o símbolo de su moneda)
- [ ] **Esperado:** No hay errores

### Test 28: Cambio rápido de moneda
- [ ] Cambiar de USD a EUR
- [ ] Inmediatamente cambiar de EUR a GBP
- [ ] **Esperado:** Ambos cambios se registran correctamente
- [ ] **Verificar logs:** Dos entradas de cambio de moneda

### Test 29: Concurrencia (si aplica)
- [ ] Abrir Settings en dos pestañas
- [ ] Cambiar moneda en pestaña 1
- [ ] Intentar cambiar moneda en pestaña 2
- [ ] **Esperado:** Última actualización gana
- [ ] **Esperado:** No hay errores de BD

### Test 30: Moneda con caracteres especiales
- [ ] Verificar monedas con símbolos especiales (₹, ₩, ₦, ₴, etc.)
- [ ] **Esperado:** Se muestran correctamente en todos los lugares
- [ ] **Esperado:** No hay problemas de encoding

---

## 📱 Tests de Responsive Design

### Test 31: Mobile (< 768px)
- [ ] Abrir Settings en mobile
- [ ] **Esperado:** Card de moneda se ve correctamente
- [ ] Abrir selector de moneda
- [ ] **Esperado:** Dialog se adapta a pantalla pequeña
- [ ] Crear factura
- [ ] **Esperado:** Badge de moneda se ve correctamente

### Test 32: Tablet (768px - 1024px)
- [ ] Verificar grid 2x2 en Settings
- [ ] Verificar formulario de facturas
- [ ] Verificar dashboard de Finances

### Test 33: Desktop (> 1024px)
- [ ] Verificar todos los componentes en pantalla grande
- [ ] **Esperado:** Layout óptimo y legible

---

## 🔍 Tests de Logs y Monitoreo

### Test 34: Logs de signup
- [ ] Registrar usuario nuevo
- [ ] Verificar logs en Railway:
  ```
  [Auth] Signup attempt: user@example.com
  [Auth] Currency validated: USD - Dólar estadounidense
  [Auth] User created: 123
  ```

### Test 35: Logs de cambio de moneda
- [ ] Cambiar moneda en Settings
- [ ] Verificar logs:
  ```
  [Auth] Currency change request from user 123: USD -> EUR
  [Auth] Currency validated: EUR - Euro
  [Auth] Primary currency updated successfully for user 123: EUR
  ```

### Test 36: Logs de creación de factura
- [ ] Crear factura
- [ ] Verificar logs:
  ```
  [Invoices] Create attempt by user 123: { client_id: 45, items_count: 3 }
  [Invoices] Invoice number: INV-20260124-1234, currency: USD
  [Invoices] Invoice 789 created successfully
  ```

---

## ✅ Checklist Final

### Funcionalidad
- [ ] Registro con selección de moneda funciona
- [ ] Cambio de moneda en Settings funciona
- [ ] Facturas usan moneda del usuario automáticamente
- [ ] Dashboard filtra por moneda del usuario
- [ ] Formateo de montos es correcto

### Validaciones
- [ ] Backend valida código de 3 caracteres
- [ ] Backend valida contra catálogo CURRENCIES
- [ ] Transform a uppercase funciona
- [ ] NOT NULL constraint en BD funciona

### UI/UX
- [ ] Selector de moneda es intuitivo
- [ ] Warning de datos históricos es claro
- [ ] Badges de moneda son visibles
- [ ] Responsive design funciona en todos los tamaños

### Logging
- [ ] Todos los eventos importantes se registran
- [ ] Logs incluyen información relevante (user_id, currency, etc.)
- [ ] Errores se registran con contexto

### Documentación
- [ ] SISTEMA_MONEDA_PRINCIPAL.md está completo
- [ ] TESTING_MONEDA_CHECKLIST.md está completo
- [ ] Código tiene comentarios donde es necesario

---

## 📋 Reporte de Bugs

Si encuentras algún bug durante el testing, documéntalo aquí:

### Bug #1
- **Descripción:**
- **Pasos para reproducir:**
- **Comportamiento esperado:**
- **Comportamiento actual:**
- **Prioridad:** Alta / Media / Baja
- **Estado:** Pendiente / En progreso / Resuelto

---

## ✨ Resultado Final

**Total de tests:** 36 tests  
**Tests pasados:** ___  
**Tests fallidos:** ___  
**Bugs encontrados:** ___  
**Estado del sistema:** ✅ Aprobado / ⚠️ Con observaciones / ❌ Rechazado

**Notas adicionales:**
_Agregar cualquier observación importante aquí_

---

**Fecha de testing:** ___________  
**Testeado por:** ___________  
**Aprobado por:** ___________
