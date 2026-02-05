# Wallet de Direcciones - Documentación

## 📋 Descripción General

El **Wallet de Direcciones** es una funcionalidad que permite a los usuarios gestionar y almacenar direcciones públicas de criptomonedas de forma visual y elegante, inspirada en Apple Wallet.

**IMPORTANTE**: Este NO es un wallet real:
- ❌ NO custodia fondos
- ❌ NO maneja llaves privadas
- ❌ NO firma transacciones
- ❌ NO envía criptomonedas
- ✅ Solo almacena direcciones públicas para referencia

## 🎨 Diseño

### Estética
- **Inspiración**: Apple Wallet
- **Colores**: Paleta de FinWrk (#121212, #C4FF3D, #0A0A0A)
- **Tarjetas**: Diseño apilado vertical con gradientes
- **Bordes**: Redondeados (rounded-2xl, rounded-3xl)
- **Iconos**: Minimalistas de Lucide React

### Componentes Visuales
1. **Modal Full-Screen**
   - Responsive (full-height en móvil, centrado en desktop)
   - Fondo con overlay oscuro
   - Scroll interno

2. **Tarjetas de Direcciones**
   - Gradiente de fondo (from-[#1a1a1a] to-[#0A0A0A])
   - Símbolo de cripto grande y destacado
   - Red/blockchain en texto pequeño
   - Dirección parcialmente oculta (ej: 0xA3f2...9B7E)
   - Iconos de acción: Copiar, Editar, Eliminar

3. **Formulario de Añadir/Editar**
   - Selector de criptomoneda con iconos
   - Selector de red/blockchain
   - Campo de dirección pública (validado)
   - Alias opcional
   - Nota opcional

## 🗄️ Estructura de Base de Datos

### Tabla: `crypto_wallet_addresses`

```sql
CREATE TABLE crypto_wallet_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  crypto_symbol VARCHAR(20) NOT NULL,
  network VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  alias VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_user_crypto (user_id, crypto_symbol)
);
```

### Campos
- **user_id**: ID del usuario propietario
- **crypto_symbol**: Símbolo de la criptomoneda (BTC, ETH, USDT, etc.)
- **network**: Red/blockchain (Bitcoin, ERC20, TRC20, BEP20, etc.)
- **address**: Dirección pública de la wallet
- **alias**: Nombre opcional (ej: "Binance", "Personal")
- **note**: Nota opcional

## 🔧 Implementación Técnica

### Backend (tRPC)

**Archivo**: `server/routers_wallet.ts`

#### Endpoints

1. **listAddresses** (Query)
   - Lista todas las direcciones del usuario
   - Ordenadas por fecha de creación (desc)

2. **getAddressesByCrypto** (Query)
   - Agrupa direcciones por criptomoneda
   - Retorna objeto con arrays por símbolo

3. **addAddress** (Mutation)
   - Valida formato de dirección
   - Verifica duplicados
   - Guarda nueva dirección

4. **updateAddress** (Mutation)
   - Verifica propiedad del usuario
   - Valida formato si se cambia dirección
   - Actualiza campos

5. **deleteAddress** (Mutation)
   - Verifica propiedad del usuario
   - Elimina dirección

#### Validación de Direcciones

Patrones regex implementados:
- **Bitcoin**: `/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/`
- **Ethereum/ERC20**: `/^0x[a-fA-F0-9]{40}$/`
- **Tron/TRC20**: `/^T[a-zA-Z0-9]{33}$/`
- **Binance/BEP20**: `/^0x[a-fA-F0-9]{40}$/`
- **Ripple**: `/^r[a-zA-Z0-9]{24,34}$/`
- **Genérico**: `/^[a-zA-Z0-9]{20,}$/`

### Frontend (React + TypeScript)

**Archivo**: `client/src/components/WalletModal.tsx`

#### Props
```typescript
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

#### Estados
- `showAddForm`: Mostrar/ocultar formulario
- `editingId`: ID de dirección en edición
- `copiedId`: ID de dirección copiada (feedback)
- `deleteConfirmId`: ID de dirección a eliminar (confirmación)
- `formData`: Datos del formulario

#### Funciones Principales
- `handleSubmit`: Guardar/actualizar dirección
- `handleEdit`: Cargar dirección en formulario
- `handleCopy`: Copiar dirección al portapapeles
- `maskAddress`: Ocultar parte de la dirección

#### Criptomonedas Soportadas
```typescript
const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'TRX', name: 'Tron' },
  { symbol: 'USDC', name: 'USD Coin' },
];
```

#### Redes Soportadas
```typescript
const NETWORKS = [
  'Bitcoin',
  'ERC20 (Ethereum)',
  'TRC20 (Tron)',
  'BEP20 (BSC)',
  'Polygon',
  'Solana',
  'Cardano',
  'Ripple',
];
```

### Integración en Markets.tsx

1. **Botón en Header**
   ```tsx
   <button onClick={() => setShowWalletModal(true)}>
     <Wallet2 /> Wallet de direcciones
   </button>
   ```

2. **Modal**
   ```tsx
   <WalletModal
     isOpen={showWalletModal}
     onClose={() => setShowWalletModal(false)}
   />
   ```

## 🔒 Seguridad

### Disclaimer Visible
El modal muestra permanentemente:
> **Aviso:** Finwrk no custodia fondos ni llaves privadas. Estas direcciones son solo informativas.

### Validaciones
- ✅ Formato de dirección según tipo de cripto
- ✅ Verificación de duplicados
- ✅ Verificación de propiedad del usuario
- ✅ Confirmación antes de eliminar

### Limitaciones
- Solo almacena direcciones públicas
- No se conecta a ninguna blockchain
- No muestra balances
- No permite transacciones

## 📱 Responsive Design

### Mobile
- Modal full-screen
- Botón solo con icono (sin texto)
- Tarjetas apiladas verticalmente
- Scroll suave

### Desktop
- Modal centrado (max-w-2xl)
- Botón con icono y texto
- Tarjetas más anchas
- Mejor uso del espacio

## 🚀 Uso

### Añadir Dirección
1. Clic en "Wallet de direcciones"
2. Clic en "+ Añadir Nueva Dirección"
3. Seleccionar criptomoneda
4. Seleccionar red
5. Ingresar dirección pública
6. (Opcional) Añadir alias y nota
7. Clic en "Guardar Dirección"

### Editar Dirección
1. Clic en icono de lápiz en la tarjeta
2. Modificar campos
3. Clic en "Actualizar Dirección"

### Copiar Dirección
1. Clic en icono de copiar
2. Feedback visual (✓ verde por 2 segundos)
3. Dirección copiada al portapapeles

### Eliminar Dirección
1. Clic en icono de papelera
2. Aparecen botones "Confirmar" y "Cancelar"
3. Confirmar eliminación

## 🔮 Integración Futura (Preparada)

Las direcciones están diseñadas para integrarse con:
- ✅ Registro de compras de criptomonedas
- ✅ Registro de pagos recibidos
- ✅ Análisis financieros
- ✅ Reportes de portafolio
- ✅ Integración con IA para recomendaciones

## 📊 Estado de Implementación

### ✅ Completado
- [x] Esquema de base de datos
- [x] Router tRPC con CRUD completo
- [x] Componente WalletModal
- [x] Validación de direcciones
- [x] Diseño Apple Wallet
- [x] Responsive mobile-first
- [x] Sistema de copiar con feedback
- [x] Confirmación de eliminación
- [x] Integración en Markets
- [x] Desplegado en rama `main`

### ⏳ Pendiente
- [ ] Migración de base de datos en producción
- [ ] Testing con usuarios reales
- [ ] Feedback y ajustes
- [ ] Merge a rama `Estable` (después de validación)

## 🎯 Próximos Pasos

1. **Testing en Desarrollo**
   - Probar añadir direcciones
   - Verificar validaciones
   - Probar edición y eliminación
   - Verificar responsive

2. **Validación**
   - Confirmar que todo funciona correctamente
   - Verificar diseño en diferentes dispositivos
   - Revisar UX

3. **Merge a Estable**
   - Si todo funciona bien, hacer merge a `Estable`
   - Desplegar en producción

## 📝 Notas Importantes

- **Solo en rama `main`**: Esta funcionalidad está solo en `main` para testing
- **NO en Estable**: No se ha mergeado a `Estable` todavía
- **Migración DB**: La tabla se creará automáticamente en producción con Drizzle
- **Sin riesgos**: No hay custodia de fondos ni manejo de llaves privadas
- **Legal**: Cumple con regulaciones (no es un wallet real)

## 🐛 Troubleshooting

### Error: "Formato de dirección inválido"
- Verificar que la dirección corresponde a la cripto seleccionada
- Revisar que no tenga espacios al inicio/final
- Verificar longitud mínima (20 caracteres)

### Error: "Esta dirección ya está registrada"
- La dirección ya existe en tu wallet
- Verifica en la lista de direcciones

### No se ve el botón
- Verificar que estás en la página de Mercados
- Verificar que la sesión está activa
- Refrescar la página

---

**Desarrollado para FinWrk**  
**Versión**: 1.0.0  
**Fecha**: Febrero 2026  
**Rama**: main (testing)
