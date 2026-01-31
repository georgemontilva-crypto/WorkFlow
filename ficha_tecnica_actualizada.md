# Ficha Técnica y de Funciones: FinWrk

**FinWrk** es una plataforma integral de gestión financiera diseñada para freelancers, startups y pequeñas empresas. Simplifica la administración de clientes, facturas, finanzas y criptomonedas en un entorno seguro, inteligente y fácil de usar.

## Módulos Principales

### 1. **Dashboard (Home)**
El Dashboard es el centro de control de FinWrk. Ofrece una vista panorámica del estado financiero de tu negocio en tiempo real.

- **Métricas Clave**: Visualiza rápidamente:
  - **Cobrado este mes**: Ingresos totales de facturas pagadas en el mes actual.
  - **Pendiente por cobrar**: Suma total de todas las facturas enviadas y pendientes de pago.
  - **Facturas vencidas**: Monto total y cantidad de facturas que han superado su fecha de vencimiento.
  - **Facturado este mes**: Total facturado en el mes actual (excluyendo borradores y canceladas).

- **Análisis de Facturas**: Gráfico interactivo que muestra:
  - **Análisis Semanal**: Gráfico de barras con el total facturado en los últimos 7 días.
  - **Análisis Mensual**: Gráfico de líneas comparando lo **facturado** vs. lo **cobrado** en los últimos 6 meses.

- **Notificaciones Recientes**: Mantente al día con las últimas 5 notificaciones del sistema (facturas pagadas, pagos recibidos, etc.).

- **Movimientos Recientes**: Visualiza las últimas 10 facturas creadas o actualizadas, con su estado y monto.

### 2. **Clientes**
Gestión completa de tu cartera de clientes en un solo lugar.

- **Creación y Edición**: Crea nuevos clientes o edita existentes con información detallada.
- **Listado y Búsqueda**: Filtra clientes por estado y busca por nombre, email o empresa.
- **Acciones Rápidas**: Archiva o elimina clientes con confirmación.

### 3. **Facturas**
El módulo más potente de FinWrk. Crea, gestiona y envía facturas profesionales en segundos.

- **Creación de Facturas**: Con selección de cliente, fechas, items, y cálculos automáticos.
- **Gestión de Estado**: Cambia el estado de una factura con un solo clic.
- **Acciones Avanzadas**: Envía por email, descarga PDF, marca como pagada/pendiente, cancela o elimina.
- **Facturas Recurrentes**: Programa facturas para que se generen y envíen automáticamente.
- **Vista Pública**: Los clientes pueden ver y pagar sus facturas a través de un enlace público y seguro.

### 4. **Finanzas**
Análisis financiero avanzado para tomar decisiones informadas.

- **Resumen Financiero**: Tarjetas con total de ingresos, gastos y balance.
- **Gráficos Interactivos**:
  - **Tendencia Mensual**: Gráfico de líneas que muestra la evolución de tus ingresos a lo largo del tiempo.
  - **Comparativa Mensual**: Gráfico de barras que compara ingresos vs. gastos cada mes.
- **Historial de Transacciones**: Tabla con todas tus transacciones, con opción de exportar a CSV.
- **Registro Manual**: Agrega ingresos o gastos manualmente para tener un control total.

### 5. **Mercados (Criptomonedas)**
Un módulo especializado para entusiastas de las criptomonedas.

- **Listado de Criptomonedas**: Visualiza las 50 criptomonedas más importantes con datos en tiempo real.
- **Calculadora de Conversión**: Convierte entre diferentes criptomonedas y monedas fiat.
- **Simulador de Escenarios**: Proyecta ganancias o pérdidas potenciales.

### 6. **Asistente de IA**
Un asistente inteligente integrado en la plataforma para ayudarte a gestionar tu negocio.

- **Chat Interactivo**: Haz preguntas en lenguaje natural sobre tus finanzas, clientes o facturas.
- **Análisis Avanzado**: Pide a la IA que analice tus datos y te dé recomendaciones. Ej: "¿Cuál fue mi mejor mes de ventas?", "¿Qué cliente me debe más dinero?".
- **Generación de Contenido**: Próximamente, la IA podrá ayudarte a redactar correos de seguimiento para facturas vencidas.

### 7. **Configuración**
Personaliza FinWrk para que se adapte a tus necesidades.

- **Perfil de Empresa**: Configura los datos de tu empresa para las facturas.
- **Seguridad**: Activa la autenticación de dos factores (2FA).
- **Notificaciones**: Gestiona tus preferencias de notificaciones.

## Especificaciones Técnicas

| Característica | Especificación |
| :--- | :--- |
| **Frontend** | React con TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js con tRPC |
| **Base de Datos** | MySQL / TiDB |
| **Inteligencia Artificial** | Modelos de lenguaje grande (LLM) para análisis y chat |
| **APIs Externas** | Binance, CoinGecko |
| **Deployment** | Railway (despliegue continuo desde GitHub) |
| **Seguridad** | JWT, 2FA, rutas protegidas, encriptación |
| **Diseño** | Minimalista, oscuro, 100% responsive |
