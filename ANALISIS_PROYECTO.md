# Análisis del Proyecto WorkFlow

## 1. Visión General del Proyecto

El proyecto **WorkFlow** es un sistema de gestión empresarial diseñado para ofrecer una solución completa para la administración de clientes, facturación, finanzas y metas de ahorro. La aplicación está construida como un monorepo, separando claramente el código del cliente (frontend) y del servidor (backend).

### Stack Tecnológico

| Capa | Tecnología | Propósito |
| --- | --- | --- |
| **Frontend** | React 19, Vite, TypeScript | Interfaz de usuario moderna y rápida |
| | TailwindCSS, Radix UI | Estilos y componentes de UI minimalistas |
| | Wouter | Enrutamiento ligero |
| | tRPC | Llamadas a API seguras y tipadas |
| | **Dexie.js (IndexedDB)** | **Base de datos local en el navegador (problema principal)** |
| **Backend** | Node.js, Express | Servidor web y API REST |
| | tRPC | Creación de API segura y tipada |
| | Drizzle ORM | ORM para acceso a base de datos tipado |
| | MySQL | Base de datos relacional |
| | JWT, bcrypt | Autenticación y seguridad de contraseñas |

## 2. Arquitectura

La arquitectura del proyecto se divide en tres componentes principales:

- **`client/`**: La aplicación de frontend construida con React. Se encarga de la interfaz de usuario y la interacción con el usuario.
- **`server/`**: La aplicación de backend construida con Node.js y Express. Expone una API a través de tRPC para que el cliente la consuma.
- **`shared/`**: Contiene código que se comparte entre el cliente y el servidor, como tipos y constantes.

### Flujo de Datos

Actualmente, el flujo de datos es el principal problema del proyecto. El frontend utiliza **Dexie.js** para interactuar con una base de datos **IndexedDB** en el navegador. Esto significa que los datos no se persisten en el backend y se pierden si el usuario borra la caché del navegador. El archivo `CAMBIOS_NECESARIOS.md` describe este problema en detalle.

El flujo de datos ideal debería ser:

1. El cliente (React) realiza una llamada a través del cliente tRPC.
2. El servidor (Express) recibe la llamada en el enrutador tRPC correspondiente.
3. El servidor utiliza las funciones en `server/db.ts` para interactuar con la base de datos MySQL a través de Drizzle ORM.
4. El servidor devuelve una respuesta al cliente.

## 3. Estructura de Archivos Clave

```
WorkFlow/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas de la aplicación (Clients.tsx, Invoices.tsx, etc.)
│   │   ├── components/ # Componentes reutilizables
│   │   ├── lib/
│   │   │   ├── db.ts   # <-- CONFIGURACIÓN DE DEXIE (PROBLEMA)
│   │   │   └── trpc.ts # Configuración del cliente tRPC
│   │   └── main.tsx    # Punto de entrada de la aplicación, configuración de tRPC
│
├── server/              # Backend Express
│   ├── _core/          # Lógica central del servidor (auth, tRPC, etc.)
│   ├── routers.ts      # Definición de los endpoints de la API tRPC
│   └── db.ts           # Funciones de acceso a la base de datos (Drizzle)
│
├── drizzle/             # Schema y migraciones de la base de datos
│   └── schema.ts       # Definición de las tablas de la base de datos
│
├── shared/              # Código compartido entre cliente y servidor
│
├── package.json         # Dependencias y scripts del proyecto
└── CAMBIOS_NECESARIOS.md # Documento que describe el problema y la solución
```

## 4. Problema Principal y Solución Propuesta

**El problema fundamental es que el frontend está desacoplado del backend a nivel de persistencia de datos.**

Como se indica en `CAMBIOS_NECESARIOS.md` y se confirma en el código fuente, varias páginas y componentes de React (`Finances.tsx`, `Home.tsx`, `Reminders.tsx`, `Settings.tsx`, etc.) utilizan `useLiveQuery` de `dexie-react-hooks` y llamadas directas a `db.transactions.add`, `db.clients.toArray`, etc. Esto significa que están leyendo y escribiendo en la base de datos local del navegador (IndexedDB) en lugar de comunicarse con el servidor.

### Solución

La solución, como se describe en `CAMBIOS_NECESARIOS.md`, es refactorizar todos los componentes del frontend que actualmente usan Dexie para que en su lugar utilicen el cliente tRPC para realizar operaciones CRUD en el backend. Esto implica:

1.  **Eliminar Dexie:** Eliminar la dependencia de `dexie` y `dexie-react-hooks` del proyecto.
2.  **Usar tRPC Hooks:** Reemplazar las llamadas a Dexie con los hooks de tRPC correspondientes:
    *   `useLiveQuery(...)` se reemplazará por `trpc.entity.list.useQuery()`.
    *   `db.entity.add(...)` se reemplazará por `trpc.entity.create.useMutation()`.
    *   `db.entity.update(...)` se reemplazará por `trpc.entity.update.useMutation()`.
    *   `db.entity.delete(...)` se reemplazará por `trpc.entity.delete.useMutation()`.
3.  **Ajustar los Datos:** Asegurarse de que los datos enviados al backend coincidan con el esquema de la base de datos MySQL definido en `drizzle/schema.ts`.

## 5. Próximos Pasos

Basado en el análisis, los próximos pasos recomendados son:

1.  **Priorizar la Refactorización:** Comenzar con las páginas más críticas como `Savings.tsx` e `Invoices.tsx`, como se sugiere en `CAMBIOS_NECESARIOS.md`.
2.  **Refactorización Sistemática:** Avanzar a través de todos los archivos que hacen referencia a `useLiveQuery` o `db.` y reemplazarlos con las llamadas a tRPC correspondientes.
3.  **Pruebas Exhaustivas:** Después de cada refactorización, probar la funcionalidad a fondo para garantizar que los datos se lean y escriban correctamente en la base de datos del backend.
4.  **Limpieza de Código:** Una vez que se haya eliminado toda la funcionalidad de Dexie, eliminar los archivos y dependencias innecesarios.

Este análisis proporciona una comprensión clara del estado actual del proyecto y un camino a seguir para abordar su principal problema arquitectónico. Ahora estoy listo para recibir tus instrucciones sobre qué cambios específicos te gustaría que realice.
