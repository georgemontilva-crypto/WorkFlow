# Finwrk Design System

**Versión:** 1.0  
**Última actualización:** Enero 2026

---

## 📐 Principios Visuales Fundamentales

Finwrk es una plataforma fintech profesional que transmite **confianza, estabilidad y claridad**. El diseño debe ser:

- **Limpio y estructurado** - Sin elementos decorativos innecesarios
- **Claro y legible** - Jerarquía visual bien definida
- **Profesional** - Estética fintech / SaaS B2B
- **Consistente** - Mismas reglas en toda la plataforma

---

## 🎨 Paleta de Colores

### Colores Primarios

| Color | Hex | Uso |
|-------|-----|-----|
| **Primary** | `#FF9500` | Acento principal, CTA, elementos interactivos |
| **Background** | `#0A0A0A` | Fondo principal de la aplicación |
| **Foreground** | `#F5F5F5` | Texto principal |

### Colores de Superficie

| Color | Hex | Uso |
|-------|-----|-----|
| **Card** | `#1A1A1A` | Fondo de cards y contenedores |
| **Secondary** | `#2A2A2A` | Fondos secundarios |
| **Muted** | `#3A3A3A` | Elementos deshabilitados |

### Colores de Borde

| Color | Hex | Uso |
|-------|-----|-----|
| **Border** | `#333333` | Bordes de contenedores |
| **Input** | `#2A2A2A` | Fondo de inputs |
| **Ring** | `#FF9500` | Focus ring |

### Colores de Estado

| Color | Hex | Uso |
|-------|-----|-----|
| **Success** | `#2ECC71` | Operaciones exitosas |
| **Warning** | `#FFA500` | Advertencias |
| **Error** | `#FF3B30` | Errores y acciones destructivas |
| **Info** | `#3498DB` | Información neutral |

---

## 📏 Espaciado

Sistema de espaciado basado en múltiplos de 4px:

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | 4px | Espaciado mínimo |
| `--spacing-sm` | 8px | Espaciado pequeño |
| `--spacing-md` | 16px | Espaciado estándar |
| `--spacing-lg` | 24px | Espaciado grande |
| `--spacing-xl` | 32px | Espaciado extra grande |
| `--spacing-2xl` | 48px | Espaciado máximo |

---

## 🔲 Formas y Contenedores

### Border Radius

**Regla fundamental:** Todos los contenedores son **rectangulares con esquinas suavemente redondeadas**. Nunca circulares.

| Elemento | Valor | Uso |
|----------|-------|-----|
| **Inputs, Botones, Dropdowns** | 6px | `--radius-input` |
| **Cards, Contenedores** | 8px | `--radius-card` |
| **Modales, Popups** | 10px | `--radius-modal` |

**Prohibido:**
- ❌ `border-radius: 50%` (círculos completos)
- ❌ Valores excesivos tipo "pill buttons"

**Excepciones permitidas:**
- ✅ Avatares de usuario (circulares)
- ✅ Spinners de carga (circulares por naturaleza)
- ✅ Badges de notificación pequeños

---

## 📐 Líneas y Bordes

### Grosor de Línea

**Regla fundamental:** Todas las líneas tienen **1px de grosor**.

```css
--border-width: 1px;
```

### Sombras

Las sombras deben ser **muy sutiles o inexistentes**. Priorizar bordes sobre sombras.

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Sombra mínima |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Sombra estándar |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Sombra máxima |

---

## 🔘 Botones

### Regla Fundamental

**TODOS los botones deben ser outline (solo borde, sin fondo sólido).**

### Variantes

| Variante | Estilo | Uso |
|----------|--------|-----|
| **Default** | Borde naranja, fondo transparente | Acción principal |
| **Destructive** | Borde rojo, fondo transparente | Acciones destructivas |
| **Secondary** | Borde gris, fondo transparente | Acciones secundarias |
| **Ghost** | Sin borde, fondo transparente | Acciones terciarias |

### Estados

```css
/* Default */
border: 1px solid #FF9500;
background: transparent;

/* Hover */
background: rgba(255, 149, 0, 0.1);
border-color: #FFA500;

/* Active */
background: rgba(255, 149, 0, 0.15);
```

### Tamaños

| Tamaño | Altura | Padding | Uso |
|--------|--------|---------|-----|
| **Small** | 32px | 12px | Botones compactos |
| **Default** | 40px | 20px | Botones estándar |
| **Large** | 48px | 28px | CTAs principales |

---

## 🔤 Tipografía

### Fuente Principal

**Inter** - Sans-serif moderna y profesional

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
```

### Escala Tipográfica

| Elemento | Tamaño | Peso | Line Height | Uso |
|----------|--------|------|-------------|-----|
| **H1** | 36px | 700 | 1.25 | Títulos principales |
| **H2** | 30px | 700 | 1.25 | Títulos de sección |
| **H3** | 24px | 700 | 1.25 | Subtítulos |
| **H4** | 20px | 700 | 1.25 | Títulos de card |
| **Body** | 16px | 400 | 1.5 | Texto principal |
| **Small** | 14px | 400 | 1.5 | Texto secundario |
| **Caption** | 12px | 400 | 1.5 | Etiquetas y metadatos |

### Jerarquía

```css
/* Headings */
font-weight: var(--font-weight-bold);
line-height: var(--line-height-tight);
letter-spacing: -0.02em;

/* Body */
font-weight: var(--font-weight-normal);
line-height: var(--line-height-relaxed);
```

---

## 🎯 Iconografía

### Estilo

**Exclusivamente iconos minimalistas tipo outline.**

### Librería

**Lucide React** - Iconos outline consistentes

```tsx
import { Icon } from 'lucide-react';
```

### Reglas

- ✅ Grosor de línea consistente (1-2px)
- ✅ Estilo simple y geométrico
- ❌ **NO usar emojis en ningún contexto**
- ❌ NO usar iconos filled o solid

### Tamaños

| Contexto | Tamaño | Clase |
|----------|--------|-------|
| **Inline** | 16px | `size-4` |
| **Botones** | 20px | `size-5` |
| **Cards** | 24px | `size-6` |
| **Hero** | 32px | `size-8` |

---

## 📦 Componentes Base

### Card

```tsx
<Card className="bg-card border border-border rounded-lg p-6">
  {/* Contenido */}
</Card>
```

### Button

```tsx
<Button variant="default">
  Acción Principal
</Button>

<Button variant="secondary">
  Acción Secundaria
</Button>

<Button variant="destructive">
  Eliminar
</Button>
```

### Input

```tsx
<Input 
  className="rounded-md border border-border bg-input"
  placeholder="Ingresa un valor"
/>
```

---

## 🎭 Estados Interactivos

### Hover

```css
transition: all 200ms ease-out;
```

- Cambio sutil de color de borde
- Fondo translúcido (10% del color primario)

### Focus

```css
outline: none;
ring: 2px solid rgba(255, 149, 0, 0.5);
```

### Disabled

```css
opacity: 0.5;
pointer-events: none;
```

---

## 📱 Responsive

### Breakpoints

| Breakpoint | Ancho | Uso |
|------------|-------|-----|
| **Mobile** | < 640px | Vista móvil |
| **Tablet** | 640px - 1024px | Vista tablet |
| **Desktop** | > 1024px | Vista desktop |

### Adaptaciones

- **Mobile:** Scroll horizontal para cards
- **Tablet:** Grid de 2 columnas
- **Desktop:** Grid de 3-4 columnas

---

## ✅ Checklist de Implementación

Al crear un nuevo componente, verificar:

- [ ] Usa tipografía Inter
- [ ] Bordes de 1px
- [ ] Border-radius según tipo de elemento (6px/8px/10px)
- [ ] Botones son outline (sin fondo sólido)
- [ ] Iconos son outline (Lucide)
- [ ] No usa emojis
- [ ] Sombras sutiles o inexistentes
- [ ] Colores de la paleta oficial
- [ ] Espaciado consistente
- [ ] Estados hover/focus definidos

---

## 🚫 Prohibiciones

| ❌ Prohibido | ✅ Correcto |
|-------------|------------|
| Bordes circulares (`border-radius: 50%`) | Rectangulares con esquinas suaves (6-10px) |
| Botones con fondo sólido | Botones outline |
| Sombras pesadas (`shadow-2xl`) | Sombras sutiles (`shadow-sm/md`) |
| Emojis | Iconos outline (Lucide) |
| Tipografías decorativas | Inter |
| Valores hardcodeados | Design tokens |
| Gradientes fuertes | Colores sólidos |

---

## 📚 Recursos

- **Tipografía:** [Inter](https://rsms.me/inter/)
- **Iconos:** [Lucide](https://lucide.dev/)
- **Componentes:** [shadcn/ui](https://ui.shadcn.com/)
- **Framework:** [Tailwind CSS](https://tailwindcss.com/)

---

## 🎯 Objetivo Final

Finwrk debe sentirse:
- **Sólido** - Estructura clara y confiable
- **Profesional** - Estética fintech seria
- **Coherente** - Mismas reglas en toda la plataforma
- **Moderno** - Tecnología actual sin ser juguetón

El usuario debe percibir un **sistema financiero serio, moderno y bien construido** desde el primer contacto.
