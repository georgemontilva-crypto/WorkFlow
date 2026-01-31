# Ficha Técnica y de Funciones: FinWrk

**FinWrk** es una plataforma integral de gestión financiera diseñada para freelancers, startups y pequeñas empresas. Simplifica la administración de clientes, facturas, finanzas y criptomonedas en un entorno seguro y fácil de usar.

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

- **Creación y Edición**: Crea nuevos clientes o edita existentes con información detallada:
  - Nombre, email, teléfono, empresa.
  - Estado (activo/inactivo).
  - Notas internas.

- **Listado y Búsqueda**: 
  - Filtra clientes por estado (activos/inactivos).
  - Búsqueda inteligente por nombre, email o empresa.
  - Diseño responsive con tarjetas expandibles para ver detalles.

- **Acciones Rápidas**: Archiva o elimina clientes con diálogos de confirmación para evitar errores.

### 3. **Facturas**
El módulo más potente de FinWrk. Crea, gestiona y envía facturas profesionales en segundos.

- **Creación de Facturas**:
  - **Selección de Cliente**: Busca y selecciona clientes existentes.
  - **Fechas**: Asigna fecha de emisión y vencimiento.
  - **Items**: Agrega múltiples productos o servicios con descripción, cantidad y precio unitario.
  - **Cálculos Automáticos**: Subtotal y total se calculan en tiempo real.
  - **Notas y Términos**: Agrega notas para el cliente o términos y condiciones.

- **Gestión de Estado**: Cambia el estado de una factura con un solo clic:
  - Borrador, Enviada, Pagada, Parcial, Cancelada.

- **Acciones Avanzadas**:
  - **Enviar por Email**: Envía la factura en formato PDF directamente al cliente.
  - **Descargar PDF**: Genera y descarga una copia en PDF de la factura.
  - **Marcar como Pagada/Pendiente**: Actualiza el estado de la factura.
  - **Cancelar/Eliminar**: Cancela facturas enviadas o elimina borradores.

- **Facturas Recurrentes**: Programa facturas para que se generen y envíen automáticamente (semanal, mensual, etc.).

- **Vista Pública**: Los clientes pueden ver y pagar sus facturas a través de un enlace público y seguro.

### 4. **Finanzas**
(Módulo en desarrollo) - Próximamente podrás conectar tus cuentas bancarias y tarjetas para tener una visión 360 de tus finanzas.

### 5. **Ahorros**
(Módulo en desarrollo) - Define metas de ahorro y haz seguimiento de tu progreso.

### 6. **Mercados (Criptomonedas)**
Un módulo especializado para entusiastas de las criptomonedas.

- **Listado de Criptomonedas**: Visualiza las 50 criptomonedas más importantes del mercado con datos en tiempo real de Binance y CoinGecko:
  - Precio actual, cambio en 24h, capitalización de mercado, volumen.

- **Calculadora de Conversión**: Convierte fácilmente entre diferentes criptomonedas y monedas fiat.

- **Simulador de Escenarios**: Proyecta ganancias o pérdidas potenciales basadas en diferentes escenarios de mercado.

### 7. **Configuración**
Personaliza FinWrk para que se adapte a tus necesidades.

- **Perfil de Empresa**: Configura los datos de tu empresa (nombre, logo, dirección, etc.) que aparecerán en las facturas.
- **Seguridad**: Activa la autenticación de dos factores (2FA) para una capa extra de seguridad.
- **Notificaciones**: Gestiona tus preferencias de notificaciones.

## Especificaciones Técnicas

| Característica | Especificación |
| :--- | :--- |
| **Frontend** | React con TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js con tRPC |
| **Base de Datos** | MySQL / TiDB |
| **Cache** | Redis |
| **Autenticación** | JWT (JSON Web Tokens) con 2FA opcional |
| **APIs Externas** | Binance (precios cripto), CoinGecko (iconos cripto) |
| **Deployment** | Railway (despliegue continuo desde GitHub) |
| **Seguridad** | Rutas protegidas, validación de datos, encriptación de contraseñas |
| **Diseño** | Minimalista, oscuro por defecto, 100% responsive (mobile-first) |
