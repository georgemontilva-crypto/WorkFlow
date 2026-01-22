# Política de Retención de Datos - Finwrk

## 📋 Principio General

**La base de datos debe conservar TODO el historial financiero de forma permanente.**

Esta política garantiza:
- Integridad del historial financiero completo
- Cumplimiento de auditorías y regulaciones
- Trazabilidad total de operaciones
- Respaldo legal en caso de disputas

---

## 🚫 Prohibiciones Estrictas

### ❌ NO se permite eliminación automática de:

1. **Facturas** (excepto borradores antiguos sin uso)
2. **Transacciones financieras** (nunca, bajo ninguna circunstancia)
3. **Clientes** con historial de facturas o transacciones
4. **Recordatorios** completados (mantener historial)
5. **Metas de ahorro** completadas o canceladas

---

## ✅ Eliminación Permitida

### 1. Facturas en estado "Borrador" (Draft)

**Condiciones para eliminación automática:**
- Estado: `draft`
- Sin transacciones asociadas
- Antigüedad: > 90 días sin modificación
- Sin pagos parciales registrados

**Implementación:**
```sql
DELETE FROM invoices 
WHERE status = 'draft' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND paid_amount = 0
  AND id NOT IN (SELECT invoice_id FROM transactions WHERE invoice_id IS NOT NULL);
```

### 2. Eliminación de Cuenta de Usuario

**Condiciones:**
- Solicitud explícita del usuario
- Cumplimiento legal (GDPR, CCPA, etc.)
- Proceso de confirmación de 30 días

**Datos a eliminar:**
- Información personal del usuario
- Preferencias y configuraciones

**Datos a CONSERVAR (anonimizados):**
- Transacciones financieras (user_id → NULL)
- Facturas emitidas (anonimizar cliente)
- Registros de auditoría

---

## 🗂️ Gestión Visual sin Eliminación

### Archivado

**Facturas:**
- Campo `archived = 1` para facturas pagadas
- Vista de carpetas por cliente
- No se eliminan, solo se ocultan de la vista principal

**Transacciones:**
- Estado `voided` para anulaciones
- Crear transacción reversora (no eliminar original)
- Mantener registro completo de anulaciones

### Filtros y Paginación

**Implementar en todas las vistas:**
- Filtro por fecha (últimos 30/60/90 días, año actual, personalizado)
- Filtro por estado (draft, sent, paid, overdue, archived)
- Filtro por cliente
- Paginación (20-50 registros por página)
- Búsqueda por número de factura/transacción

---

## 📊 Límites de Rendimiento

### Consultas Optimizadas

**Por defecto mostrar:**
- Facturas: Últimos 90 días + no archivadas
- Transacciones: Últimos 30 días
- Clientes: Todos (con paginación)

**Índices requeridos:**
```sql
CREATE INDEX idx_invoices_status_date ON invoices(status, created_at);
CREATE INDEX idx_invoices_archived_date ON invoices(archived, created_at);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
```

---

## 🔒 Cumplimiento Legal

### Retención Mínima

**Facturas y transacciones:**
- Mínimo: 7 años (regulación fiscal estándar)
- Recomendado: Permanente (sin límite)

### Derecho al Olvido (GDPR)

**Proceso:**
1. Usuario solicita eliminación de cuenta
2. Período de gracia: 30 días
3. Anonimización de datos personales
4. Conservación de registros financieros anonimizados

---

## 🛠️ Implementación Técnica

### Backend (server/routers.ts)

**Eliminar endpoints:**
- ❌ `invoices.delete` (excepto para borradores antiguos)
- ❌ `transactions.delete` (usar `void` en su lugar)

**Mantener endpoints:**
- ✅ `invoices.update` (con campo `archived`)
- ✅ `transactions.void` (anulación con reversión)

### Frontend (client/src/pages/)

**Remover botones:**
- ❌ "Eliminar Factura" (excepto borradores)
- ❌ "Eliminar Transacción"
- ❌ "Cancelar Factura" (usar archivado)

**Agregar controles:**
- ✅ Filtros por fecha
- ✅ Filtros por estado
- ✅ Paginación
- ✅ Búsqueda

---

## 📝 Registro de Auditoría

**Eventos a registrar:**
- Creación de facturas/transacciones
- Modificación de estados
- Archivado/restauración
- Anulación de transacciones
- Intentos de eliminación (con razón)

**Campos requeridos:**
- `user_id`: Quién realizó la acción
- `action`: Tipo de acción
- `entity_type`: Factura/Transacción/Cliente
- `entity_id`: ID del registro
- `timestamp`: Fecha y hora
- `metadata`: Datos adicionales (JSON)

---

## 🔄 Mantenimiento Periódico

### Limpieza Automática (Cron Job)

**Ejecutar mensualmente:**
```javascript
// Eliminar borradores antiguos sin uso
DELETE FROM invoices 
WHERE status = 'draft' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND paid_amount = 0;
```

**Ejecutar anualmente:**
```javascript
// Archivar automáticamente facturas pagadas > 1 año
UPDATE invoices 
SET archived = 1 
WHERE status = 'paid' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
  AND archived = 0;
```

---

## ✅ Checklist de Implementación

- [x] Remover opciones de eliminar/cancelar facturas
- [x] Implementar campo `archived` en facturas
- [x] Crear vista de carpetas por cliente
- [ ] Agregar filtros por fecha y estado
- [ ] Implementar paginación
- [ ] Crear endpoint para eliminar borradores antiguos
- [ ] Configurar cron job de limpieza mensual
- [ ] Agregar índices de base de datos
- [ ] Documentar proceso de eliminación de cuenta
- [ ] Implementar registro de auditoría

---

**Última actualización:** 2026-01-22  
**Versión:** 1.0  
**Responsable:** Sistema Finwrk
