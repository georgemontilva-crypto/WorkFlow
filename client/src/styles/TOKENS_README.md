# FINWRK DESIGN TOKENS

Sistema global de design tokens - **ÚNICA fuente de verdad** para estilos visuales.

## 📁 Archivos

- **`tokens.css`** - Variables CSS globales (`:root`)
- **`tokens.ts`** - Tokens TypeScript para componentes React
- **`TOKENS_README.md`** - Esta documentación

## 🎯 Propósito

Los design tokens garantizan:
- ✅ Consistencia visual en toda la aplicación
- ✅ Única fuente de verdad para colores, tipografía, espaciado
- ✅ Facilidad de mantenimiento y cambios globales
- ✅ Cumplimiento de reglas de diseño estrictas

## 🚫 REGLAS ESTRICTAS

### 1. Prohibidos botones con fondo sólido
```tsx
// ❌ INCORRECTO
<button className="bg-green-500">Click</button>

// ✅ CORRECTO
<button className="border border-accent-primary">Click</button>
```

### 2. Prohibidas sombras duras
```css
/* ❌ INCORRECTO */
box-shadow: 0 10px 30px rgba(0,0,0,0.5);

/* ✅ CORRECTO */
box-shadow: var(--shadow-subtle);
/* o */
box-shadow: var(--shadow-none);
```

### 3. Outlines SOLO en botones e inputs
```tsx
// ✅ CORRECTO - Botones e inputs pueden tener outline
<button className="border-2 border-white">Button</button>
<input className="border border-gray-300" />

// ❌ INCORRECTO - Cards NO deben tener outline grueso
<div className="border-4 border-white">Card</div>

// ✅ CORRECTO - Cards con borde sutil
<div className="border border-subtle">Card</div>
```

### 4. No usar colores fuera del sistema
```tsx
// ❌ INCORRECTO
<div style={{ color: '#FF5733' }}>Text</div>

// ✅ CORRECTO
<div style={{ color: tokens.colors.text.primary }}>Text</div>
// o
<div className="text-primary">Text</div>
```

## 📖 USO

### En CSS
```css
.my-component {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-large);
  padding: var(--spacing-6);
  color: var(--color-text-primary);
}
```

### En TypeScript/React
```tsx
import { tokens } from '@/styles/tokens';

function MyComponent() {
  return (
    <div style={{
      backgroundColor: tokens.colors.bg.card,
      borderRadius: tokens.radius.large,
      padding: tokens.spacing[6],
      color: tokens.colors.text.primary,
    }}>
      Content
    </div>
  );
}
```

### Con Tailwind (si está configurado)
```tsx
// Usar clases personalizadas basadas en tokens
<div className="bg-card rounded-large p-6 text-primary">
  Content
</div>
```

## 🎨 SISTEMA DE COLORES

### Backgrounds
- `--color-bg-primary` / `tokens.colors.bg.primary` - #0E0F12
- `--color-bg-secondary` / `tokens.colors.bg.secondary` - #14161B
- `--color-bg-card` / `tokens.colors.bg.card` - #1B1E24

### Text
- `--color-text-primary` / `tokens.colors.text.primary` - #EDEDED
- `--color-text-secondary` / `tokens.colors.text.secondary` - #9AA0AA
- `--color-text-muted` / `tokens.colors.text.muted` - #6B7280

### Accent
- `--color-accent-primary` / `tokens.colors.accent.primary` - #4ADE80

### Status
- `--color-error` / `tokens.colors.status.error` - #EF4444
- `--color-warning` / `tokens.colors.status.warning` - #F59E0B
- `--color-success` / `tokens.colors.status.success` - #4ADE80

### Borders
- `--color-border-subtle` / `tokens.colors.border.subtle` - rgba(255,255,255,0.06)
- `--color-border-default` / `tokens.colors.border.default` - rgba(255,255,255,0.1)
- `--color-border-hover` / `tokens.colors.border.hover` - rgba(255,255,255,0.15)

## 📏 FORMA

### Border Radius
- `--radius-small` / `tokens.radius.small` - 6px
- `--radius-medium` / `tokens.radius.medium` - 10px
- `--radius-large` / `tokens.radius.large` - 14px

## 🔤 TIPOGRAFÍA

### Font Family
- `--font-family-base` / `tokens.typography.fontFamily.base`
- Inter, system-ui, sans-serif

### Font Weights (SOLO estos permitidos)
- `--font-weight-normal` / `tokens.typography.fontWeight.normal` - 400
- `--font-weight-medium` / `tokens.typography.fontWeight.medium` - 500
- `--font-weight-semibold` / `tokens.typography.fontWeight.semibold` - 600

### Font Sizes
- `--font-size-xs` / `tokens.typography.fontSize.xs` - 0.75rem (12px)
- `--font-size-sm` / `tokens.typography.fontSize.sm` - 0.875rem (14px)
- `--font-size-base` / `tokens.typography.fontSize.base` - 1rem (16px)
- `--font-size-lg` / `tokens.typography.fontSize.lg` - 1.125rem (18px)
- `--font-size-xl` / `tokens.typography.fontSize.xl` - 1.25rem (20px)
- `--font-size-2xl` / `tokens.typography.fontSize['2xl']` - 1.5rem (24px)
- `--font-size-3xl` / `tokens.typography.fontSize['3xl']` - 1.875rem (30px)

## 📐 ESPACIADO

- `--spacing-1` / `tokens.spacing[1]` - 0.25rem (4px)
- `--spacing-2` / `tokens.spacing[2]` - 0.5rem (8px)
- `--spacing-3` / `tokens.spacing[3]` - 0.75rem (12px)
- `--spacing-4` / `tokens.spacing[4]` - 1rem (16px)
- `--spacing-5` / `tokens.spacing[5]` - 1.25rem (20px)
- `--spacing-6` / `tokens.spacing[6]` - 1.5rem (24px)
- `--spacing-8` / `tokens.spacing[8]` - 2rem (32px)
- `--spacing-10` / `tokens.spacing[10]` - 2.5rem (40px)
- `--spacing-12` / `tokens.spacing[12]` - 3rem (48px)
- `--spacing-16` / `tokens.spacing[16]` - 4rem (64px)

## 🧩 COMPONENTES

### Buttons
```tsx
// Tokens disponibles
tokens.components.button.borderWidth    // '1px'
tokens.components.button.paddingX       // '1rem'
tokens.components.button.paddingY       // '0.5rem'
tokens.components.button.fontWeight     // 500
```

### Inputs
```tsx
// Tokens disponibles
tokens.components.input.borderWidth     // '1px'
tokens.components.input.paddingX        // '0.75rem'
tokens.components.input.paddingY        // '0.5rem'
tokens.components.input.bg              // 'transparent'
tokens.components.input.borderColor     // 'rgba(255,255,255,0.1)'
tokens.components.input.borderColorFocus // '#4ADE80'
```

### Cards
```tsx
// Tokens disponibles
tokens.components.card.bg               // '#1B1E24'
tokens.components.card.borderColor      // 'rgba(255,255,255,0.06)'
tokens.components.card.borderWidth      // '1px'
tokens.components.card.padding          // '1.5rem'
tokens.components.card.radius           // '14px'
```

## 🔍 VALIDACIÓN

### En DevTools Console
```javascript
// Verificar que los tokens CSS están cargados
getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary')
// Debe retornar: "#0E0F12"

// Verificar todos los tokens
const root = getComputedStyle(document.documentElement);
console.log('BG Primary:', root.getPropertyValue('--color-bg-primary'));
console.log('Text Primary:', root.getPropertyValue('--color-text-primary'));
console.log('Accent:', root.getPropertyValue('--color-accent-primary'));
```

### En TypeScript
```tsx
import { tokens, isValidColor } from '@/styles/tokens';

// Validar color
console.log(isValidColor('#0E0F12')); // true
console.log(isValidColor('#FF5733')); // false

// Obtener token
import { getToken } from '@/styles/tokens';
console.log(getToken('colors.bg.primary')); // '#0E0F12'
```

## 🚀 PRÓXIMOS PASOS

### FASE 2: Aplicar tokens a componentes existentes
- Reemplazar colores hardcodeados por tokens
- Aplicar border radius consistente
- Normalizar espaciado

### FASE 3: Crear componentes base
- Button component con tokens
- Input component con tokens
- Card component con tokens

### FASE 4: Refactorizar páginas
- Aplicar tokens a todas las páginas
- Eliminar estilos inline hardcodeados
- Usar solo tokens del sistema

## ⚠️ IMPORTANTE

**NO modificar estos archivos sin aprobación:**
- `tokens.css`
- `tokens.ts`

**Cualquier cambio en el sistema de tokens debe:**
1. Ser discutido y aprobado
2. Aplicarse en AMBOS archivos (CSS y TS)
3. Documentarse en este README
4. Validarse en toda la aplicación

## 📝 CHANGELOG

### FASE 1 (Actual)
- ✅ Creado sistema de design tokens
- ✅ Definidos colores, tipografía, espaciado
- ✅ Establecidas reglas estrictas
- ✅ Integrado globalmente en la aplicación
