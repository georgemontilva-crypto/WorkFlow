# WorkFlow - Diseño Final: Minimalismo Apple

## Contexto
WorkFlow es una aplicación de gestión financiera y CRM para emprendedores que manejan pagos recurrentes. La estética visual debe ser **minimalista tipo Apple**: negro, grises (claros y oscuros) y blanco, transmitiendo elegancia, precisión y profesionalismo.

---

## Filosofía de Diseño: "Apple Minimalism"

**Design Movement:** Apple Design Language + Swiss Minimalism

**Core Principles:**
- Menos es más: cada elemento tiene un propósito claro
- Espaciado generoso y respiración visual
- Tipografía impecable con jerarquía clara
- Enfoque en el contenido, no en la decoración
- Interacciones sutiles y refinadas

**Color Philosophy:**
- **Negro Profundo:** #000000 (fondos principales, texto primario)
- **Gris Oscuro:** #1a1a1a, #2a2a2a (tarjetas, superficies elevadas)
- **Gris Medio:** #6b7280, #9ca3af (texto secundario, bordes)
- **Gris Claro:** #e5e7eb, #f3f4f6 (fondos alternativos, hover)
- **Blanco:** #ffffff (texto sobre fondos oscuros, tarjetas en modo claro)
- **Acento Único:** Gris azulado sutil (#8b9dc3) para estados activos

**Layout Paradigm:**
- Sidebar izquierdo fijo con navegación minimalista
- Dashboard central con tarjetas en grid limpio
- Espaciado consistente: 8px, 16px, 24px, 32px, 48px
- Bordes redondeados sutiles (8-12px)
- Sin sombras pesadas: solo elevaciones sutiles

**Signature Elements:**
1. Tarjetas con fondo gris oscuro (#1a1a1a) y borde sutil
2. Tipografía SF Pro Display (o Inter como alternativa web)
3. Iconografía minimalista con líneas finas
4. Indicadores de estado con opacidad (no colores brillantes)
5. Números grandes y legibles para valores monetarios

**Interaction Philosophy:**
- Hover: cambio sutil de opacidad (0.8 → 1.0)
- Click: feedback visual mínimo pero claro
- Transiciones rápidas y fluidas (150-200ms)
- Estados activos con fondo gris más claro
- Sin animaciones innecesarias

**Animation:**
- Entrada de elementos: fade-in suave (200ms)
- Transiciones de estado: ease-in-out (150ms)
- Gráficos: dibujado progresivo con timing preciso
- Hover: cambio de opacidad/escala sutil (1 → 1.01)

**Typography System:**
- **Display:** Inter Bold 700 (títulos principales)
- **Heading:** Inter SemiBold 600 (subtítulos)
- **Body:** Inter Regular 400 (contenido)
- **Mono:** JetBrains Mono Regular 400 (valores monetarios)
- **Escala:** 12px → 14px → 16px → 20px → 28px → 36px

---

## Paleta de Colores Definitiva

### Modo Oscuro (Principal)
```
Background: #000000
Surface: #1a1a1a
Surface Elevated: #2a2a2a
Border: #3a3a3a
Text Primary: #ffffff
Text Secondary: #9ca3af
Text Tertiary: #6b7280
Accent: #8b9dc3
```

### Modo Claro (Alternativo)
```
Background: #ffffff
Surface: #f9fafb
Surface Elevated: #f3f4f6
Border: #e5e7eb
Text Primary: #000000
Text Secondary: #4b5563
Text Tertiary: #9ca3af
Accent: #6b7280
```

---

## Componentes Clave

### Dashboard
- Fondo negro (#000000)
- Tarjetas con fondo #1a1a1a y borde #3a3a3a
- Espaciado entre tarjetas: 24px
- Grid responsive: 1 col (móvil) → 2 cols (tablet) → 3 cols (desktop)

### Sidebar
- Fondo #1a1a1a
- Ancho: 240px
- Items con hover: fondo #2a2a2a
- Item activo: fondo #2a2a2a + borde izquierdo #8b9dc3

### Tablas
- Fondo #1a1a1a
- Filas alternadas: #1a1a1a / #1f1f1f
- Hover: #2a2a2a
- Bordes sutiles: #3a3a3a

### Botones
- Primario: fondo #ffffff, texto #000000
- Secundario: fondo transparente, borde #3a3a3a, texto #ffffff
- Hover primario: opacidad 0.9
- Hover secundario: fondo #1a1a1a

### Gráficos
- Líneas/barras: gradientes de gris (#6b7280 → #9ca3af)
- Grid: #2a2a2a
- Tooltips: fondo #2a2a2a, texto #ffffff

---

## Principios de Implementación

1. **Espaciado Consistente:** Usar múltiplos de 8px (8, 16, 24, 32, 48)
2. **Tipografía Clara:** Inter para todo, JetBrains Mono solo para números
3. **Sin Colores Brillantes:** Solo grises, negro y blanco
4. **Bordes Sutiles:** 1px con color #3a3a3a
5. **Transiciones Rápidas:** 150-200ms máximo
6. **Iconografía Consistente:** Lucide React con stroke-width: 1.5
7. **Accesibilidad:** Contraste mínimo 4.5:1 (WCAG AA)
8. **Responsive:** Mobile-first, breakpoints en 640px, 1024px

---

## Tema por Defecto

**Modo Oscuro** será el tema principal, reflejando la estética Apple moderna y reduciendo fatiga visual en sesiones largas de trabajo.
