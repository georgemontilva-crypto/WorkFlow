# Guía de Uso: Smart Finance Design System

## Nuevas Clases CSS Disponibles

Tu aplicación ahora tiene un sistema de diseño completo inspirado en Smart Finance Dashboard. Aquí está cómo usar cada clase:

---

## 1. Tarjetas

### `.glass-card` (Por defecto en Card component)
Tarjeta con glassmorphism avanzado.

```tsx
<Card className="glass-card">
  {/* Contenido */}
</Card>
```

**Características:**
- Background: Dark con 70% opacity
- Backdrop blur: 24px
- Border: White 6% opacity
- Hover: Elevación de 4px
- Transición: 400ms

### `.dark-card`
Tarjeta oscura sólida sin glassmorphism.

```tsx
<div className="dark-card p-6">
  {/* Contenido */}
</div>
```

**Características:**
- Background: #1A1A1A sólido
- Border radius: 32px
- Sombras profundas
- Hover: Elevación de 4px

### `.balance-card`
Tarjeta con gradiente Cyan-Coral para mostrar balances.

```tsx
<div className="balance-card p-8">
  <p className="text-sm opacity-80">Total Balance</p>
  <h2 className="balance-number">$32,568.00</h2>
</div>
```

**Características:**
- Gradiente: Cyan → Coral (135deg)
- Glow effect: Cyan y Coral
- Hover: Scale 1.02 + elevación 6px
- Border radius: 32px

---

## 2. Tipografía para Números

### `.stat-number`
Para números de estadísticas.

```tsx
<div className="stat-number">187K</div>
```

**Características:**
- Font size: 2.5rem (40px)
- Font weight: 700 (Bold)
- Tabular figures activadas
- Letter spacing: -0.02em

### `.balance-number`
Para números de balance (más grande).

```tsx
<div className="balance-number">$32,568.00</div>
```

**Características:**
- Font size: 3rem (48px)
- Font weight: 700 (Bold)
- Text shadow para profundidad
- Letter spacing: -0.03em

---

## 3. Progress Bars

### `.progress-bar-cyan`
Barra de progreso con gradiente cyan.

```tsx
<div className="w-full bg-white/10 rounded-full h-2">
  <div className="progress-bar-cyan" style={{ width: '65%' }}></div>
</div>
```

**Características:**
- Gradiente: Cyan bright → Cyan medium
- Height: 8px
- Border radius: 12px
- Glow effect cyan

---

## 4. Modales y Popups

### `.glass-modal` (Aplicado automáticamente a Dialog)
Modal con glassmorphism pronunciado.

```tsx
<Dialog>
  <DialogContent className="glass-modal">
    {/* Contenido del modal */}
  </DialogContent>
</Dialog>
```

**Características:**
- Background: Dark 95% opacity
- Backdrop blur: 32px
- Border radius: 32px
- Padding: 32px (2rem)
- Sombras muy profundas

---

## 5. Elementos Interactivos

### `.icon-circle`
Círculo para iconos con backdrop.

```tsx
<div className="icon-circle">
  <IconComponent className="w-5 h-5" />
</div>
```

**Características:**
- Size: 40px × 40px
- Background: White 8% opacity
- Backdrop blur: 8px
- Hover: Scale 1.1

### `.transaction-item`
Item de lista para transacciones.

```tsx
<div className="transaction-item">
  <div className="icon-circle">
    <DollarIcon />
  </div>
  <div className="flex-1">
    <p className="font-medium">Payment received</p>
    <p className="text-sm text-muted-foreground">Today, 2:30 PM</p>
  </div>
  <div className="text-success">+$514.00</div>
</div>
```

**Características:**
- Padding: 20px
- Background: Dark 60% opacity
- Hover: translateX(6px)
- Border radius: 24px

---

## 6. Efectos de Glow

### `.glow-cyan`
Efecto de brillo cyan.

```tsx
<div className="balance-card glow-cyan">
  {/* Contenido */}
</div>
```

### `.glow-coral`
Efecto de brillo coral.

```tsx
<Button className="glow-coral">
  {/* Contenido */}
</Button>
```

---

## 7. Gradientes Utilitarios

### `.gradient-cyan-coral`
Gradiente completo Cyan → Coral.

```tsx
<div className="gradient-cyan-coral p-8 rounded-[32px]">
  {/* Contenido */}
</div>
```

### `.gradient-cyan`
Gradiente solo cyan (bright → medium).

```tsx
<div className="gradient-cyan p-6 rounded-[32px]">
  {/* Contenido */}
</div>
```

---

## 8. Border Radius

Todos los componentes ahora usan bordes más redondeados:

| Clase | Radius | Uso |
|-------|--------|-----|
| `.rounded-sm` | 20px | Elementos pequeños |
| `.rounded-md` | 24px | Elementos medianos |
| `.rounded-lg` | 32px | Cards principales |
| `.rounded-xl` | 40px | Elementos destacados |

---

## 9. Text Shadows

Para agregar profundidad a textos:

```tsx
<h1 className="text-shadow-lg">Título con sombra</h1>
```

| Clase | Shadow |
|-------|--------|
| `.text-shadow-sm` | 0 1px 3px |
| `.text-shadow` | 0 2px 6px |
| `.text-shadow-lg` | 0 4px 12px |

---

## 10. Colores del Sistema

### Cyan (Primary)
```tsx
<div className="text-primary">Cyan text</div>
<div className="bg-primary">Cyan background</div>
```

### Coral (Accent)
```tsx
<div className="text-accent">Coral text</div>
<div className="bg-accent">Coral background</div>
```

### Success (Cyan)
```tsx
<div className="text-success">+$514.00</div>
```

### Destructive (Red)
```tsx
<div className="text-destructive">-$100.26</div>
```

---

## Ejemplos Completos

### Tarjeta de Balance
```tsx
<div className="balance-card p-8">
  <div className="flex justify-between items-start mb-4">
    <div>
      <p className="text-sm opacity-80 mb-2">Total Balance</p>
      <h2 className="balance-number">$32,568.00</h2>
    </div>
    <div className="icon-circle">
      <TrendingUpIcon className="w-5 h-5" />
    </div>
  </div>
  <p className="text-xs opacity-70">
    Last Month: $4,400.00 
    <span className="text-success ml-2">↗</span>
  </p>
</div>
```

### Tarjeta de Estadística
```tsx
<div className="dark-card p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-sm font-medium">User Growth</h3>
    <div className="icon-circle">
      <ArrowUpRightIcon className="w-4 h-4" />
    </div>
  </div>
  
  <div className="stat-number mb-2">187K</div>
  
  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
    <div className="progress-bar-cyan" style={{ width: '65%' }}></div>
  </div>
  
  <p className="text-xs text-muted-foreground">
    Checking Details <span className="text-primary">+24 Today</span>
  </p>
</div>
```

### Lista de Transacciones
```tsx
<div className="space-y-3">
  <div className="transaction-item">
    <div className="icon-circle">
      <DollarIcon className="w-5 h-5 text-success" />
    </div>
    <div className="flex-1">
      <p className="font-medium">Payment received</p>
      <p className="text-sm text-muted-foreground">Today, 2:30 PM</p>
    </div>
    <div className="text-success font-semibold">+$514.00</div>
  </div>
  
  <div className="transaction-item">
    <div className="icon-circle">
      <ShoppingBagIcon className="w-5 h-5 text-destructive" />
    </div>
    <div className="flex-1">
      <p className="font-medium">ADOBE - Adobe Creative</p>
      <p className="text-sm text-muted-foreground">Yesterday, 9:00 AM</p>
    </div>
    <div className="text-destructive font-semibold">-$100.26</div>
  </div>
</div>
```

---

## Transiciones y Animaciones

Todos los componentes ahora usan:
- **Duración**: 400ms (más fluido que antes)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover effects**: Elevación + shadow increase
- **Active states**: Scale 0.97 en botones

---

## Componentes Actualizados Automáticamente

Estos componentes ya tienen el nuevo diseño aplicado:

✅ **Card** - 32px border radius, glass-card por defecto
✅ **Button** - 32px border radius, shadow-lg en hover
✅ **Input** - 32px border radius, height 44px
✅ **Textarea** - 32px border radius, padding aumentado
✅ **Select** - 32px border radius, height 44px
✅ **Dialog** - glass-modal, 32px border radius, padding 32px

No necesitas modificar código existente, solo se verá mejor automáticamente.
