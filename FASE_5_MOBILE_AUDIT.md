# FASE 5 — AUDITORÍA MOBILE

**Fecha:** 25 enero 2026
**Objetivo:** Identificar problemas mobile antes de optimizar

---

## 📱 PÁGINAS AUDITADAS

### 1. Clients.tsx
**Problemas detectados:**
- ✅ Ya usa layout responsive (flex-col sm:flex-row)
- ⚠️ Acciones visibles siempre (debería ser menú en mobile)
- ⚠️ Botones pequeños para touch (necesita size="lg" en mobile)
- ⚠️ Padding podría ser más generoso en mobile
- ✅ Info ya se apila verticalmente

**Optimizaciones necesarias:**
- Mover acciones secundarias a menú contextual en mobile
- Aumentar tamaño de botones (min-height 44px)
- Aumentar padding en mobile (p-4 → p-6)

---

### 2. Invoices.tsx
**Problemas detectados:**
- ✅ Monto oculto en mobile (hidden md:block)
- ✅ Layout responsive básico
- ⚠️ Acciones en hover no funciona en mobile (necesita ser visible o menú)
- ⚠️ Dropdown puede ser difícil de tocar
- ⚠️ Botones icon-only pequeños

**Optimizaciones necesarias:**
- Hacer acciones siempre visibles en mobile o usar menú único
- Aumentar tamaño de touch targets
- Simplificar acciones en mobile (solo las esenciales)

---

### 3. Savings.tsx
**Problemas detectados:**
- ✅ Ya tiene sección mobile dedicada (md:hidden)
- ✅ Progreso se muestra debajo en mobile
- ⚠️ Botón "Agregar" en hover no funciona en mobile
- ⚠️ Dropdown puede ser pequeño para touch
- ✅ Layout responsive bien implementado

**Optimizaciones necesarias:**
- Hacer botón "Agregar" siempre visible en mobile
- Aumentar tamaño de dropdown trigger
- Mejorar espaciado en sección mobile

---

### 4. Finances.tsx
**Problemas detectados:**
- ⚠️ Tarjetas de totales pueden ser pequeñas
- ⚠️ Transacciones pueden necesitar más espaciado
- ⚠️ Navegación de mes puede ser difícil de tocar
- ⚠️ Modal de nueva transacción puede ser grande para mobile

**Optimizaciones necesarias:**
- Apilar tarjetas de totales verticalmente en mobile
- Aumentar espaciado entre transacciones
- Hacer flechas de navegación más grandes
- Optimizar modal para pantalla completa en mobile

---

### 5. DashboardLayout / Navegación
**Problemas detectados:**
- ⚠️ Sidebar puede ocupar mucho espacio en mobile
- ⚠️ Header puede necesitar optimización
- ⚠️ Navegación puede ser difícil de usar con el pulgar

**Optimizaciones necesarias:**
- Sidebar colapsable o bottom navigation en mobile
- Header más compacto
- Touch targets de 44px mínimo

---

## 🎯 PRIORIDADES

### Alta Prioridad
1. Touch targets mínimo 44px
2. Acciones en menú contextual (no hover)
3. Espaciados amplios (p-6 en cards)
4. Botones grandes y accesibles

### Media Prioridad
5. Cards apiladas verticalmente
6. Navegación optimizada
7. Modales pantalla completa

### Baja Prioridad
8. Animaciones touch-friendly
9. Gestos swipe (opcional)

---

## 📋 CHECKLIST MOBILE

### Touch Targets
- [ ] Botones mínimo 44x44px
- [ ] Iconos clickeables mínimo 44x44px
- [ ] Inputs altura mínima 44px
- [ ] Spacing entre elementos tocables mínimo 8px

### Layout
- [ ] Cards apiladas verticalmente (no grid en mobile)
- [ ] Padding generoso (p-6 mínimo)
- [ ] Márgenes laterales (px-4 mínimo)
- [ ] Sin scroll horizontal

### Acciones
- [ ] Acciones principales visibles
- [ ] Acciones secundarias en menú
- [ ] Sin hover states (usar tap)
- [ ] Feedback visual al tocar

### Tipografía
- [ ] Texto legible (min 16px para body)
- [ ] Line height generoso (1.5+)
- [ ] Contraste adecuado
- [ ] Sin texto truncado importante

### Navegación
- [ ] Fácil acceso con pulgar
- [ ] Bottom nav o sidebar colapsable
- [ ] Back button visible
- [ ] Breadcrumbs si es necesario

---

## 🚀 PLAN DE ACCIÓN

### Fase 1: Componentes Base
- Actualizar Button component (size="lg" para mobile)
- Actualizar Input component (altura mínima)
- Crear MobileMenu component

### Fase 2: Páginas Principales
- Optimizar Clients
- Optimizar Invoices
- Optimizar Savings
- Optimizar Finances

### Fase 3: Navegación
- Optimizar DashboardLayout
- Implementar bottom nav o sidebar colapsable
- Optimizar header

### Fase 4: Validación
- Probar en dispositivos reales
- Validar touch targets
- Validar espaciados
- Validar legibilidad

---

**Siguiente paso:** Implementar optimizaciones
