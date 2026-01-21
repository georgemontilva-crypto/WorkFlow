# Guía de Uso: Events Management Design System

## Paleta de Colores

Tu aplicación ahora usa la paleta de colores del diseño Events Management Dashboard:

### Colores Principales

| Color | Valor | Uso |
|-------|-------|-----|
| **Naranja** | #FF8A3D | Acento principal, botones activos, iconos activos |
| **Negro** | #000000 | Fondo principal de la aplicación |
| **Gris Oscuro** | #1C1C1C | Sidebar, fondos secundarios |
| **Gris Medio** | #2A2A2A | Tarjetas, cards, contenedores |
| **Gris Claro** | #A0A0A0 | Texto secundario, items inactivos |
| **Blanco** | #FFFFFF | Texto principal |

### Colores de Estado

| Estado | Color | Uso |
|--------|-------|-----|
| **Completed** | Verde #4CAF50 | Badges, indicadores de completado |
| **On-going** | Amarillo #FFC107 | Badges, indicadores en progreso |
| **Upcoming** | Rojo #E74C3C | Badges, indicadores pendientes |

---

## Estructura del Sidebar

El sidebar ahora sigue el diseño Events Management:

### Características:
- **Fondo**: Gris oscuro sólido (#1C1C1C)
- **Items normales**: Sin fondo sólido, texto gris claro
- **Item activo**: Borde naranja izquierdo (4px) + texto e icono naranja
- **Hover**: Fondo gris más claro (#232323) sin color sólido

### Clases CSS:

```tsx
// Item normal
<a className="sidebar-item">
  <Icon className="w-5 h-5" />
  <span>Dashboard</span>
</a>

// Item activo
<a className="sidebar-item sidebar-item-active">
  <Icon className="w-5 h-5" />
  <span>Events</span>
</a>
```

---

## Tarjetas y Cards

### `.glass-card` (Por defecto)
Tarjeta gris medio con sombras.

```tsx
<Card className="glass-card">
  {/* Contenido */}
</Card>
```

**Características:**
- Background: #2A2A2A
- Border radius: 20px
- Sombras profundas
- Hover: Elevación de 2px

### Tarjetas de Eventos con Color

#### `.event-card-teal`
```tsx
<div className="event-card-teal">
  <h3>Art Exhibition</h3>
  <p>Art Gallery Hall 1, BTM Layout</p>
  <span className="badge-ongoing">On-going</span>
</div>
```

#### `.event-card-green`
```tsx
<div className="event-card-green">
  <h3>Priya & Tharun Wedding</h3>
  <p>Royal Palace JP Nagar</p>
  <span className="badge-ongoing">On-going</span>
</div>
```

#### `.event-card-blue`
```tsx
<div className="event-card-blue">
  <h3>Community Marathon</h3>
  <p>Cubbon Park</p>
  <span className="badge-ongoing">On-going</span>
</div>
```

---

## Tarjetas de Estadísticas (Dashboard)

### `.stat-card-teal`
```tsx
<div className="stat-card-teal">
  <h3 className="text-sm font-medium mb-2">Total Events</h3>
  <div className="stat-number">10</div>
</div>
```

### `.stat-card-blue`
```tsx
<div className="stat-card-blue">
  <h3 className="text-sm font-medium mb-2">Total Revenue</h3>
  <div className="stat-number">₹100000.00</div>
</div>
```

### `.stat-card-purple`
```tsx
<div className="stat-card-purple">
  <h3 className="text-sm font-medium mb-2">Total Attendees</h3>
  <div className="stat-number">200</div>
</div>
```

---

## Tablas y Listas

### `.table-container`
Contenedor para tablas con fondo gris.

```tsx
<div className="table-container">
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/8">
        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
          Event Name
        </th>
        {/* ... más headers */}
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td className="p-4">Wedding</td>
        <td className="p-4">Priya & Tharun</td>
        <td className="p-4">
          <span className="badge-completed">Completed</span>
        </td>
      </tr>
      {/* ... más filas */}
    </tbody>
  </table>
</div>
```

---

## Status Badges

### `.badge-completed` (Verde)
```tsx
<span className="badge-completed">
  <span className="w-2 h-2 rounded-full bg-success"></span>
  Completed
</span>
```

### `.badge-ongoing` (Amarillo)
```tsx
<span className="badge-ongoing">
  <span className="w-2 h-2 rounded-full bg-warning"></span>
  On-going
</span>
```

### `.badge-upcoming` (Rojo)
```tsx
<span className="badge-upcoming">
  <span className="w-2 h-2 rounded-full bg-destructive"></span>
  Upcoming
</span>
```

---

## Números y Estadísticas

### `.stat-number`
Para números grandes en tarjetas de estadísticas.

```tsx
<div className="stat-number">187</div>
```

**Características:**
- Font size: 2.5rem (40px)
- Font weight: 700 (Bold)
- Tabular figures
- Letter spacing: -0.02em

---

## Iconos

### `.icon-circle`
Círculo para iconos con fondo semitransparente.

```tsx
<div className="icon-circle">
  <TrendingUpIcon className="w-5 h-5" />
</div>
```

**Características:**
- Size: 40px × 40px
- Background: White 10% opacity
- Hover: Scale 1.05

---

## Border Radius Consistente

Todos los elementos usan **20px** de border radius:

| Elemento | Border Radius |
|----------|---------------|
| Cards | 20px |
| Buttons | 20px |
| Inputs | 20px |
| Textareas | 20px |
| Selects | 20px |
| Modales | 20px |
| Badges | 16px |

---

## Componentes Actualizados Automáticamente

Estos componentes ya tienen el nuevo diseño aplicado:

✅ **Card** - Gris medio, 20px radius
✅ **Button** - 20px radius, naranja cuando primary
✅ **Input** - 20px radius, height 40px
✅ **Textarea** - 20px radius
✅ **Select** - 20px radius, height 40px
✅ **Dialog** - Gris medio, 20px radius
✅ **Sidebar** - Gris oscuro, items sin fondo sólido

---

## Ejemplos Completos

### Lista de Eventos (On-going Events)
```tsx
<div className="space-y-3">
  <div className="event-card-teal">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold mb-1">Art Exhibition</h3>
        <p className="text-sm opacity-80">Art Gallery Hall 1, BTM Layout, Bengaluru</p>
        <p className="text-xs opacity-70 mt-1">Start Time: 10:30 AM</p>
      </div>
      <span className="badge-ongoing">On-going</span>
    </div>
  </div>
  
  <div className="event-card-green">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold mb-1">Priya & Tharun Wedding</h3>
        <p className="text-sm opacity-80">Royal Palace JP Nagar, Bengaluru</p>
        <p className="text-xs opacity-70 mt-1">Start Time: 09:00 AM</p>
      </div>
      <span className="badge-ongoing">On-going</span>
    </div>
  </div>
</div>
```

### Tabla de Eventos (Events List)
```tsx
<div className="table-container">
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/8">
        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event Name</th>
        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clients Name</th>
        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date & Time</th>
        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event Status</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td className="p-4 font-medium">Wedding</td>
        <td className="p-4">Priya & Tharun</td>
        <td className="p-4">22/12/25 07:00 AM</td>
        <td className="p-4">
          <span className="badge-completed">Completed</span>
        </td>
      </tr>
      <tr className="table-row">
        <td className="p-4 font-medium">Digital Marketing Webinar</td>
        <td className="p-4">Growth Spark Agency</td>
        <td className="p-4">22/12/25 09:00 AM</td>
        <td className="p-4">
          <span className="badge-ongoing">On-going</span>
        </td>
      </tr>
      <tr className="table-row">
        <td className="p-4 font-medium">Arav's Birthday</td>
        <td className="p-4">Mr.&Mrs. Verma</td>
        <td className="p-4">22/12/25 07:00 PM</td>
        <td className="p-4">
          <span className="badge-upcoming">Upcoming</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Dashboard con Estadísticas
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="stat-card-teal">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium">Total Events</h3>
      <div className="icon-circle">
        <CalendarIcon className="w-5 h-5" />
      </div>
    </div>
    <div className="stat-number">10</div>
  </div>
  
  <div className="stat-card-blue">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium">Total Revenue</h3>
      <div className="icon-circle">
        <DollarSignIcon className="w-5 h-5" />
      </div>
    </div>
    <div className="stat-number">₹100000.00</div>
  </div>
  
  <div className="stat-card-purple">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium">Total Attendees</h3>
      <div className="icon-circle">
        <UsersIcon className="w-5 h-5" />
      </div>
    </div>
    <div className="stat-number">200</div>
  </div>
</div>
```

---

## Scrollbars

Los scrollbars ahora usan el color naranja:

- **Color**: Naranja #FF8A3D
- **Width**: 8px
- **Opacity**: 50% normal, 70% hover
- **Border radius**: 4px

---

## Resultado Final

Tu aplicación ahora tiene:

🎨 **Paleta Events Management** - Negro, grises y naranja
📊 **Sidebar gris oscuro** - Con items sin fondo sólido
🔲 **Tarjetas grises** - #2A2A2A con sombras profundas
🟠 **Acento naranja** - Solo en texto e iconos activos
📐 **Border radius 20px** - Consistente en todos los elementos
🏷️ **Status badges** - Verde, amarillo y rojo
📋 **Tablas con hover** - Fondo gris con interacción

**Diseño limpio, profesional y moderno siguiendo exactamente el estilo Events Management Dashboard.**
