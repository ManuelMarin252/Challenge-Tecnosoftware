# Diagnostico inicial
1. Error en el docker-compose.yml
Tuve que corregir la ruta de volume para cumplir con el estandar de docker-compose

```
volumes:
  /var/lib/postgresql/data
```
antes
```despues
volumes:
  ./database-data:/var/lib/postgresql/
```
2. Encontre un error al ejecutar los tests.

```
  Resultados de la prueba:
    Test Suites: 1 failed, 7 passed, 8 total
    Tests:       1 failed, 34 passed, 35 total
    Snapshots:   0 total
    Time:        54.772 s
```
error del test en especifico:

```
 ● ProductService › activateProduct: activate Product if its info is fulfilled › should success

    ConflictException: not all product info is fulfilled

      71 |   async activateProduct(productId: number, merchantId: number) {
      72 |     if (!(await this.validate(productId)))
    > 73 |       throw new ConflictException(errorMessages.product.notFulfilled);    
         |             ^
      74 |
      75 |     const result = await this.entityManager
      76 |       .createQueryBuilder()

      at ProductService.activateProduct (api/product/services/product.service.ts:73:13)
      at Object.<anonymous> (api/product/services/product.service.spec.ts:227:22)  
```
Resolución del error:

El problema se debía a que el objeto mock `fulfilledProduct` utilizado en el test `activateProduct › should success` no cumplía con las validaciones de la entidad `Product` definidas con `class-validator`.
Específicamente, faltaban las propiedades `code` y `variationType`, las cuales están marcadas como `@IsDefined()` en la entidad `Product`.
Al ejecutar el método `validate(productId)`, `class-validator` retornaba errores debido a la ausencia de estos campos, lo que hacía que el método `validate` retornara `false` y consecuentemente el servicio lanzara la `ConflictException`.

Para corregirlo, se agregaron las propiedades faltantes al objeto `fulfilledProduct` en `api/product/services/product.service.spec.ts`:

```typescript
  const fulfilledProduct = {
    // ... propiedades existentes
    code: 'test-code',
    variationType: 'NONE', // O VariationTypes.NONE
    // ...
  };
```

Además, para que la validación funcionara correctamente con `class-validator` en el entorno de pruebas, fue necesario instanciar explícitamente las clases `Product` y `ComputerDetails` en el objeto mock, en lugar de usar objetos literales simples. Esto asegura que los decoradores de validación se apliquen correctamente.

```typescript
  const fulfilledProduct = Object.assign(new Product(), {
    // ...
    details: Object.assign(new ComputerDetails(), {
        // ...
    }),
    // ...
  });
```

3. Errores en `RoleController` (Timeouts y ReferenceError)

Al correr los tests, `src/api/role/controllers/role.controller.spec.ts` fallaba con timeouts y errores de referencia (`ReferenceError: You are trying to import a file after the Jest environment has been torn down`).

**Causa:**
El test estaba configurado para importar `TypeOrmModule`, `ConfigModule` y `AuthModule`. Esto intentaba establecer una conexión real a la base de datos durante los tests unitarios, lo cual es incorrecto, lento y propenso a errores de entorno. Además, los guards (`AuthGuard`, `RolesGuard`) intentaban ejecutar lógica de autenticación real.

**Solución:**
- Se eliminaron las importaciones de `TypeOrmModule`, `ConfigModule` y `AuthModule` del módulo de testing.
- Se utilizaron mocks para los servicios (`RoleService`, `UserService`).
- Se anularon los guards (`overrideGuard`) para devolver `true` siempre, aislando el test de la lógica de autenticación y base de datos.

```typescript
    const module: TestingModule = await Test.createTestingModule({
      // ... providers mockeados
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
```

4. Errores de TypeScript en el IDE (Linting)

El IDE mostraba errores como `Cannot find name 'describe'`, `it`, `expect`, etc., en los archivos de test.

**Causa:**
La configuración de TypeScript (`tsconfig.json`) no incluía explícitamente los tipos de `jest` de manera global, y `tsconfig.spec.json` no existía o no estaba correctamente configurado para extender la configuración base e incluir estos tipos. Además, había un warning de deprecación por el uso de `baseUrl`.

**Solución:**
- Se actualizó `backend/tsconfig.json` para incluir `"types": ["jest", "node"]` en `compilerOptions`.
- Se configuró `"ignoreDeprecations": "6.0"` en `tsconfig.json` para silenciar el warning de `baseUrl`.
- Se eliminaron importaciones manuales incorrectas de `jest` y `node:test` en los archivos `.spec.ts` que entraban en conflicto con los tipos globales.

5. Error de activación de producto

El usuario reportó un error "not all product info is fulfilled" al intentar activar el producto, a pesar de que los datos parecían correctos.

**Causa:**
El servicio `ProductService` utilizaba `class-validator` para validar la entidad `Product` antes de activarla. Sin embargo, el objeto `Product` recuperado por TypeORM contenía la propiedad `details` como un objeto plano JSON. `class-validator` no validaba correctamente las reglas anidadas de `details` (que dependen del tipo de producto, ej: `ComputerDetails`) porque el objeto no era una instancia de la clase, sino un objeto plano.
Además, el error devuelto era genérico y no mostraba qué campos específicos fallaban la validación.

**Solución:**
- Se modificó el método `validate` en `backend/src/api/product/services/product.service.ts` para transformar el objeto plano en una instancia de la clase `Product` utilizando `plainToInstance` de `class-transformer`. Esto asegura que las validaciones anidadas (`@ValidateNested`, `@Type`) funcionen correctamente.
- Se mejoró el manejo de errores en `activateProduct` para capturar los errores de validación devueltos por `validate` y lanzarlos dentro de la `ConflictException`, permitiendo al cliente ver exactamente qué campos son inválidos o faltantes.

```typescript
// Antes
if (!(await this.validate(productId)))
  throw new ConflictException(errorMessages.product.notFulfilled);

// Después
const errors = await this.validate(productId);
if (errors.length > 0) {
  throw new ConflictException({
    message: errorMessages.product.notFulfilled.message,
    errors: errors,
  });
}
```
6. Analisis Actual del sistema
    Se realizo un analisis completo del backend actual para entender su funcionamiento y poder hacer un plan de mejora. el analisis se puede encontrar en la carpeta backend/documentation bajo el nombre backend_analysis.md
7. Eliminar Deuda Tecnica

## Refactorización Preliminar: Deuda Técnica en Controladores

### Diagnóstico de Capa de Controladores
**Problema Detectado:**
Se realizó una auditoría de los controladores `ProductController`, `UserController` y `AuthController` para detectar lógica de negocio, validaciones complejas o acceso directo a datos que violen el principio de responsabilidad única (SRP).

**Solución Aplicada:**
No se encontraron violaciones en la lógica auditada.
Los controladores ya delegan correctamente la lógica de negocio a los servicios (`ProductService`, `UserService`, `AuthService`) y utilizan DTOs para la validación de entrada. Por tanto, no fue necesario realizar cambios en el código (refactor).

**Justificación:**
Asegurar que los controladores sean "thin" (delgados) es un requisito previo para la arquitectura orientada a eventos. Al confirmar que la lógica ya reside en los servicios, garantizamos que future Event Listeners puedan reutilizar estos métodos sin duplicidad ni acoplamiento indebido.

8. Plan de acción
Con la deuda técnica saneada, la siguiente fase se centra en desacoplar los módulos principales y reactivar el sistema mediante eventos de dominio, cumpliendo con los requerimientos de escalabilidad y mantenibilidad.

### Fase 1: Arquitectura de Backend (NestJS)
1.  **Infraestructura de Eventos**:
    - Integración de `@nestjs/event-emitter` como bus de eventos interno para gestionar la asincronía.
    
2.  **Segregación de Responsabilidades (Nuevo Módulo de Inventario)**:
    - Creación del `InventoryModule` para aislar la gestión de stock.
    - Eliminación de dependencias directas entre `ProductService` y la lógica de inventario.

3.  **Implementación de Eventos de Dominio**:
    - **Evento Productor**: `ProductActivatedEvent`. Se emitirá cuando un producto sea validado y activado administrativamente.
    - **Consumidor (Listener)**: `InventoryService` escuchará este evento para inicializar el stock (Pattern: *Event-Carried State Transfer* o simplemente *Side Effect* desacoplado).
    - **Evento Secundario**: `StockLowEvent` (opcional/plus) para notificaciones o logs cuando el inventario es crítico.

### Fase 2: Consumo en Frontend (React)
1.  **Cliente SPA**: Desarrollo de una interfaz limpia para visualizar el catálogo y el estado del inventario.
2.  **Integración Asíncrona**: Implementación de *polling* inteligente (o WebSockets) para reflejar en la UI los cambios de stock generados por los eventos del backend, demostrando la naturaleza "viva" del sistema.

### Fase 3: Infraestructura Final
1.  **Dockerización**: Creación de `Dockerfile` para frontend y backend.
2.  **Orquestación**: Actualización de `docker-compose.yml` para levantar todo el ecosistema (App + DB + UI) con un solo comando.

# Alcance Backend

## Fase 1: Infraestructura de Eventos

Se ha instalado y configurado la librería **@nestjs/event-emitter**.

**Propósito:**
Esta librería permite implementar una arquitectura orientada a eventos dentro de NestJS. Facilita el desacoplamiento entre componentes al permitir que un emisor (Publisher) envíe eventos sin conocer quién los escucha (Subscriber).

- **Manejo de Asincronía:** Permite procesar tareas en segundo plano sin bloquear el hilo principal de la petición HTTP.
- **Desacoplamiento:** Los servicios no necesitan llamarse directamente entre sí, sino que se comunican a través de eventos, lo que mejora la mantenibilidad y escalabilidad del sistema.

## Fase 1 (Continuación): Módulo de Inventario

Se ha creado el módulo `InventoryModule` para segregar la responsabilidad del manejo de stock, desacoplándolo del módulo de productos.

**Componentes creados:**
- **Entidad `Inventory`:** Define la estructura de datos del inventario (stock, stock mínimo) y su relación 1:1 con `Product`.
- **Servicio `InventoryService`:** Contiene la lógica de negocio para crear y consultar inventarios.
- **Controlador `InventoryController`:** Expone endpoints para consultar el stock de un producto.
- **Módulo `InventoryModule`:** Encapsula y exporta los componentes de inventario.

**Registro Global:**
El módulo ha sido importado en `AppModule` para estar disponible en toda la aplicación.

**Base de Datos:**
- Se generó la migración `CreateInventoryTable` para crear la tabla `inventory` y establecer la relación con `product`.
- Se ejecutó la migración exitosamente (`npm run migration:run`), transformando el esquema existente (si lo hubiera) al nuevo modelo de inventario.

## Fase 2: Diseño Orientado a Eventos

Se han implementado dos eventos de dominio clave para desacoplar los módulos y preparar el sistema para reactividad.

### 1. Evento: `ProductCreatedEvent`
- **Emisor:** `ProductService` (al crear correctamente un producto).
- **Consumidor:** `InventoryService`.
- **Justificación:** Elimina la dependencia directa de `ProductService` hacia `InventoryService`. El servicio de productos solo se preocupa por crear productos; el servicio de inventario reacciona a este hecho inicializando el stock, manteniendo el principio de **Single Responsibility** y **Separation of Concerns**.

### 2. Evento: `StockUpdatedEvent`
- **Emisor:** `InventoryService` (cuando se actualiza el stock).
- **Consumidor:** `StockListener` (nuevo componente).
- **Justificación:** Permite que múltiples partes del sistema (Notificaciones, Logs, WebSocket Gateways) reaccionen a cambios en el inventario sin modificar el código del servicio de inventario (**Open/Closed Principle**). Por ahora, un `StockListener` registra los cambios en la consola, simulando una notificación.

### 3. Funcionalidad: Alerta de Stock Bajo
- **Evento:** `StockLowEvent`.
- **Lógica:** El `InventoryService` verifica si el nuevo stock es menor o igual al `minStock` definido (default 5) cada vez que se actualiza el inventario.
- **Handler:** `StockListener` escucha este evento y emite un log de nivel `WARN`.
- **Propósito:** Notificar proactivamente cuando un producto necesita reabastecimiento.

### 4. Funcionalidad: Listado de Inventario
- **Endpoint:** `GET /inventory`
- **Descripción:** Retorna el listado completo del inventario incluyendo la información del producto asociado.
- **Uso:** Ideal para pantallas de administración o dashboards donde se requiere una vista general del stock y sus productos.

### 5. Funcionalidad: Ajuste de Stock (Event-Driven)
- **Endpoint:** `PATCH /inventory/:productId`
- **DTO:** `UpdateStockDto` (recibe `change` tipo entero).
- **Lógica:**
    1.  Calcula el nuevo stock sumando el cambio al stock actual.
    2.  Valida que el stock resultante no sea negativo (lanza `BadRequestException` si ocurre).
    3.  Persiste el nuevo stock en la base de datos.
    4.  **Emite Evento:** `StockChangedEvent` con `{ productId, newStock, oldStock }`.
- **Justificación:** Este enfoque permite que el sistema reaccione a *cambios* de stock (delta) en lugar de solo actualizaciones absolutas, facilitando la auditoría y la integridad de datos. Además, al emitir un evento, desacoplamos la lógica de actualización de stock de cualquier efecto secundario (notificaciones, logs, integraciones externas).

### 6. Funcionalidad: Gestión de Categorías (Admin)
- **Endpoint:** `POST /category`
- **DTO:** `CreateCategoryDto` (requiere `id` y `name`).
- **Lógica:** Permite a los administradores crear nuevas categorías en el sistema.
- **Seguridad:** Endpoint protegido para usuarios con rol de Administrador.

- **Endpoint:** `GET /category`
- **Lógica:** Retorna el listado de todas las categorías disponibles.
- **Uso:** Público (o autenticado según configuración) para poblar selectores en el frontend.

### 7. Funcionalidad: Actualización de Productos
- **Endpoint:** `PATCH /product/:id`
- **DTO:** `UpdateProductDto` (versión parcial de `CreateProductDto`).
- **Lógica:** Permite actualizar campos específicos de un producto (título, descripción, categoría, estado activo/inactivo) sin necesidad de enviar toda la información.
- **Uso:** Ideal para correcciones rápidas o cambios de estado por parte de administradores o comerciantes.

### 8. Correcciones en Documentación (Postman)
- Se restauró el endpoint de `Update Stock` que se había perdido.
- Se agregaron los nuevos endpoints de `Category` y `Product`.
- Se corrigió un error de sintaxis JSON en la colección de Postman que impedía su importación.
- Se agregó el endpoint `GET /category`.

# Frontend Setup

## Inicialización del Proyecto
Se ha inicializado el proyecto frontend utilizando **Vite** con el template de **React + TypeScript**. Se utilizó **Bun** como gestor de paquetes para mayor velocidad.

### Stack Tecnológico
- **Framework:** React 19
- **Build Tool:** Vite
- **Lenguaje:** TypeScript
- **Estilos:** TailwindCSS v3 (con PostCSS y Autoprefixer)
- **Estado/Data Fetching:** @tanstack/react-query
- **Cliente HTTP:** Axios
- **Iconos:** Lucide React
- **Utilidades CSS:** clsx, tailwind-merge

### Configuración de Estilos
- Se configuró **TailwindCSS** para soportar modo oscuro mediante la estrategia `'class'`.
- Se definieron variables CSS globales en `src/index.css` siguiendo un sistema de diseño moderno (similar a Shadcn/UI) para manejar colores semánticos (`--primary`, `--secondary`, `--background`, etc.).

### Estructura de Directorios
Se estableció la siguiente estructura base en `src/`:
- `/components`: Componentes de UI reutilizables.
- `/hooks`: Custom hooks para lógica compartida.
- `/services`: Funciones para interactuar con la API del backend.
- `/pages`: Vistas principales de la aplicación (Rutas).
- `/context`: Contextos globales de React (ej. ThemeContext).

# Frontend Data Layer

## Objetivo
Establecer una capa de datos robusta y tipada en el frontend que refleje fielmente los contratos de la API del backend, además de implementar la lógica core de autenticación y navegación.

## Implementación

### Interfaces TypeScript (`src/types/api.ts`)
Se definieron interfaces estrictas para todas las entidades clave:
- `User`, `Role`, `AuthResponse`
- `Product`, `ProductDetails`, `Category`
- `InventoryItem`

### Contextos de React
1.  **ThemeContext:** Gestión del tema (oscuro/claro/sistema) con persistencia en `localStorage`.
2.  **AuthContext:** Gestión completa de la sesión del usuario.
    - Persistencia del token y usuario en `localStorage`.
    - Métodos `login` y `logout` expuestos via hook `useAuth`.
    - **Test Unitario:** Se implementó `AuthContext.spec.tsx` logrando 100% de cobertura en los flujos principales.

### Layout Dinámico (`src/Layout.tsx`)
Se implementó un componente `Layout` que actúa como shell de la aplicación.
- **Role-Based Access Control (RBAC):** El Sidebar renderiza opciones condicionalmente basado en los roles del usuario (`User.roles`).
    - *Admin:* Ve todo (Dashboard, Products, Categories, Inventory).
    - *Merchant:* Ve Dashboard, Products, Inventory.
    - *Customer:* (Solo Dashboard por defecto).

### Ajustes en Backend
Para soportar el RBAC en el frontend, se modificó el servicio de autenticación (`AuthService`) de la API:
- El endpoint de `login` ahora devuelve el objeto `User` completo (incluyendo array de `roles`) junto con el `accessToken`.
- **Tests Backend:** Se actualizaron los tests de `AuthService` y se resolvieron problemas de dependencias circulares en las entidades `User` y `Product`.

# Mejoras DevOps

## Solución al bloqueo de puertos en desarrollo

Se detectó un problema recurrente donde el puerto 3000 quedaba bloqueado (`EADDRINUSE`) al reiniciar el servidor en modo desarrollo, obligando a matar el proceso manualmente.

### Acciones Realizadas:

    - **Beneficio:** Garantiza que, antes de intentar levantar el servidor, cualquier proceso que esté ocupando el puerto 3000 sea eliminado forzosamente. Esto elimina el error `EADDRINUSE` y mejora la experiencia de desarrollo (DX).

# Fase 3: Administración y Frontend Completo

## Gestión de Usuarios y Roles (RBAC)

Se ha implementado un sistema completo de gestión de usuarios y roles que permite a los administradores controlar el acceso a la plataforma.

### Backend

1.  **Endpoints Administrativos:**
    - `POST /user/create`: Permite a un administrador crear nuevos usuarios asignándoles roles específicos desde el inicio.
    - `PATCH /user/:id/reset-password`: Facilita la recuperación de cuentas permitiendo al administrador establecer una nueva contraseña para cualquier usuario.
    - `PATCH /user/:id/roles`: (Ya implementado fase anterior) Modificación de roles de un usuario existente.
    - **Protección:** Todos estos endpoints están protegidos por `Auth(RoleIds.Admin)`, asegurando que solo usuarios con el rol adecuado puedan ejecutarlos.
    - **Seguridad:** Se implementó una lógica de negocio crítica en `UserService` para impedir que un administrador se quite a sí mismo el rol de Admin, evitando bloqueos accidentales de la cuenta.

2.  **Autogestión de Seguridad:**
    - `PATCH /user/profile/change-password`: Endpoint que permite a cualquier usuario autenticado cambiar su propia contraseña. Requiere verificar la contraseña anterior antes de aplicar el cambio, fortaleciendo la seguridad de la cuenta.

3.  **Gestión de Categorías:**
    - Se completó el CRUD de categorías implementando `Update` (PATCH) y `Delete` (DELETE) en `CategoryController`, protegidos para uso exclusivo de administradores.

### Frontend

1.  **Módulo de Usuarios (`/users`):**
    - **Tabla Interactiva:** Listado de usuarios con visualización clara de sus roles mediante etiquetas codificadas por color.
    - **Acciones Rápidas:** Botones integrados en la tabla para "Gestionar Roles" y "Restablecer Contraseña".
    - **Creación de Usuarios:** Nuevo diálogo modal que simplifica el onboarding de nuevos miembros del staff.

2.  **Módulo de Categorías (`/categories`):**
    - Interfaz dedicada para la gestión del catálogo. Permite crear, editar y eliminar categorías.
    - Visualización limpia con buscador integrado.

3.  **Perfil de Usuario (`/profile`):**
    - Nueva página donde los usuarios pueden ver el resumen de su cuenta (roles asignados) y cambiar su contraseña de manera segura.

4.  **Experiencia de Usuario (UX):**
    - **Feedback Inmediato:** Uso de `react-query` para actualizaciones optimistas y re-fetching automático de datos tras cada acción (crear, editar, borrar).
    - **Navegación Intuitiva:** El Sidebar se adapta dinámicamente mostrando solo las opciones relevantes para el rol del usuario logueado.
    - **Manejo de Errores:** Mensajes claros en los diálogos cuando ocurren errores de validación o conflictos.

# Fase 4: Lógica de Negocio Core (Event Sourcing Light)

## Infraestructura de Auditoría
Se ha implementado un sistema robusto para rastrear cada movimiento de inventario, asegurando trazabilidad total.

### 1. Entidad `InventoryMovement`
- **Propósito:** Registro inmutable de entradas y salidas de stock.
- **Campos:** `productId`, `quantity`, `type` (IN/OUT), `reason`, `userId`, `createdAt`.
- **Migración:** Se generó y ejecutó `CreateInventoryMovementTable` para persistir esta estructura.

### 2. Eventos de Dominio
Se definieron eventos semánticos para desacoplar la acción de negocio de sus efectos secundarios (auditoría, notificaciones).
- **`StockReplenishedEvent`:** Emitido cuando un admin/merchant repone stock.
- **`ProductSoldEvent`:** Emitido cuando un cliente realiza una compra.

### 3. Servicios y Listeners
- **`InventoryService`:**
    - `replenishStock`: Aumenta stock y emite `StockReplenishedEvent`.
    - `reduceStock`: Valida disponibilidad, descuenta stock y emite `ProductSoldEvent`.
- **`AuditListener`:**
    - Escucha ambos eventos y crea automáticamente un registro en `InventoryMovement`.
    - Esto mantiene al `InventoryService` limpio de lógica de auditoría (**Single Responsibility Principle**).

### 4. Módulo de Tienda (`ShopModule`)
- **`ShopService`:** Maneja la lógica de compra (`purchaseProducts`). Itera sobre los items y llama a `InventoryService.reduceStock`.
- **`ShopController`:** Expone `POST /shop/purchase` para que los clientes realicen pedidos.

### 5. Endpoints de Inventario
- **`PATCH /inventory/:id/replenish`:** Endpoint protegido (Admin/Merchant) para reponer stock.
- **`GET /inventory/:id/history`:** Endpoint para consultar el historial de movimientos de un producto.

# Fase 4: Refinamientos y Feedback de Usuario

## Visibilidad y Permisos de Comerciante (Merchant)

Se han ajustado los permisos y la visibilidad en `ProductController` y el frontend para permitir a los comerciantes gestionar mejor su catálogo sin depender de un administrador para todo.

1.  **Consulta de Productos Inactivos:**
    - Se habilitó a los usuarios con rol `Merchant` para consultar productos inactivos (deletedAt = null, isActive = false).
    - El frontend ahora muestra el toggle "Mostrar eliminados" (que incluye inactivos) también para comerciantes, aunque la etiqueta dice "Mostrar eliminados", técnicamente filtra por estado.
2.  **Gestión de Estado (Activar/Desactivar):**
    - Los comerciantes ahora pueden alternar el estado de un producto entre Activo e Inactivo utilizando el switch en la tabla de productos.
    - Se mantiene la restricción de que solo los Administradores pueden "Restaurar" un producto que ha sido eliminado (Soft Delete).
    - Se ocultaron visualmente los botones de "Restaurar" y "Eliminar Permanentemente" para los comerciantes en el frontend.

## Mejoras en la Tienda (Shop)

Se ha mejorado la experiencia de compra en el frontend (`Shop.tsx`) y se verificó la lógica del backend.

1.  **Selector de Cantidad:**
    - Se implementó un componente `ShopItem` que incluye controles de incremento (+) y decremento (-) para seleccionar la cantidad deseada antes de comprar.
    - El input de cantidad valida que no se exceda el stock disponible ni se ingresen valores negativos.
2.  **Lógica de Compra:**
    - El frontend ahora envía la cantidad seleccionada al endpoint `POST /shop/purchase`.
# Fase 5: Dashboards Dinámicos y Actualizaciones en Tiempo Real

## Infraestructura de Eventos (SSE)

Se ha implementado una arquitectura de **Server-Sent Events (SSE)** para permitir que el servidor notifique al cliente sobre cambios importantes en tiempo real (ej: ventas, reabastecimiento).

### Backend
1.  **`EventsModule` & `EventsController`:**
    - Endpoint `GET /events/stream`: Utiliza el decorador `@Sse()` de NestJS para abrir un canal unidireccional persistente.
    - Se suscribe a los eventos internos `product.sold` y `stock.replenished` del `EventEmitter2`.
    - Transforma estos eventos en mensajes SSE (`MessageEvent`) que el frontend puede consumir.

### Frontend
- **Integración en `Dashboard.tsx`:**
    - Se utiliza la API nativa `EventSource` para conectarse a `/api/events/stream`.
    - Al recibir un evento (`product.sold` o `stock.replenished`):
        1.  Muestra una notificación "Toast" al usuario.
        2.  Invalida las queries de `react-query` (`dashboard-stats`, `dashboard-history`, `dashboard-low-stock`) para forzar una actualización automática de los datos sin recargar la página.

## Dashboards por Rol

Se han creado vistas especializadas para cada tipo de usuario, maximizando la relevancia de la información mostrada.

### 1. Backend (`DashboardController`)
- **Endpoints:**
    - `GET /dashboard/stats`: Retorna métricas clave (conteo de productos, movimientos totales).
    - `GET /dashboard/low-stock`: Retorna productos con stock crítico (<= minStock).
    - `GET /dashboard/history`: Retorna el historial de movimientos de inventario.
- **Lógica de Roles (`DashboardService`):**
    - **Admin:** Ve estadísticas globales de toda la plataforma.
    - **Merchant:** Ve estadísticas filtradas solo para sus productos y ventas.
    - **Customer:** Ve estadísticas de sus propias compras y productos disponibles.

### 2. Frontend (`/dashboard`)
Se implementaron 3 componentes principales que se renderizan condicionalmente según el rol del usuario:

- **`AdminDashboard`:**
    - Gráfico de Barras (`recharts`) comparando productos vs movimientos globales.
    - Tabla de "Alertas de Stock" para reabastecimiento urgente.
    - Historial global de movimientos.

- **`MerchantDashboard`:**
    - Gráfico de Barras focalizado en *sus* productos y ventas.
    - Tabla de alertas de stock solo para su inventario.
    - Historial de movimientos filtrado por su `merchantId`.

- **`CustomerDashboard`:**
    - Resumen de productos disponibles en la tienda.
    - Historial personal de compras.

## Testing
- **Backend:** Se crearon tests unitarios para `DashboardController` y `EventsController` utilizando mocks de `DashboardService` y `EventEmitter2` respectivamente, asegurando que la lógica de ruteo y respuesta sea correcta.
- **Frontend:** La arquitectura de componentes separados permite testear cada dashboard de manera aislada.
    - `Dashboard.test.tsx`: Verifica que el contenedor principal renderice el componente correcto (`AdminDashboard`, `MerchantDashboard`, `CustomerDashboard`) basado en el rol del usuario autenticado, utilizando mocks para los servicios y el contexto de autenticación.
    - `AdminDashboard.test.tsx`: Verifica que se rendericen correctamente los elementos visuales clave como las tarjetas de estadísticas, la tabla de stock bajo y el historial, mockeando la librería de gráficos `recharts` para simplificar el test.

## Fase 5 (Refinamiento): Métricas Avanzadas y Segregación de Datos

Se han refinado los Dashboards para cumplir estrictamente con los requerimientos de visualización por rol y datos históricos reales.

### 1. Backend: Métricas y Agregación
- **`DashboardService.getStats`:**
    - Se implementó lógica para calcular `totalVentas` (suma de unidades vendidas) y `totalOrders` (conteo de transacciones `OUT`).
    - **Datos Históricos (7 Días):** Se utiliza `DATE_TRUNC('day', createdAt)` para agrupar ventas diarias de la última semana, permitiendo la visualización de tendencias.
- **Segregación RBAC:**
    - **Admin:** Acceso total a estadísticas globales e historial con identificación de usuario.
    - **Merchant:** Datos filtrados por sus productos; puede ver quién compró sus productos (email del cliente).
    - **Customer:** Resumen simplificado de sus compras y gastos totales.

### 2. Frontend: Visualización y Reactividad
- **Gráficos Dinámicos:** Los componentes `AdminDashboard` y `MerchantDashboard` ahora grafican los datos reales de los últimos 7 días provenientes del backend usando `recharts`.
- **Tablas Enriquecidas:** Se agregó la columna "Usuario" en el historial de movimientos para administradores y comerciantes, permitiendo una trazabilidad completa del cliente o sistema que generó el cambio.
- **Resumen del Cliente:** El `CustomerDashboard` incluye tarjetas destacadas de "Total Gastado" y "Ordenes Realizadas".
- **Reactividad SSE:** El listener de eventos en el frontend invalida de forma proactiva `dashboard-stats`, `dashboard-history` y `dashboard-low-stock`, garantizando que todas las visualizaciones (incluyendo gráficos) se mantengan sincronizadas sin refrescar la página.

### 3. Calidad de Código
- Se corrigieron errores de tipo en los mocks de tests y en el componente `ProductFormDialog` para cumplir con las reglas estrictas de TypeScript y ESLint.
- Se optimizó el flujo de respuesta de los servicios frontend para manejar correctamente el wrapper `ApiResponse` de NestJS.

## Fase 6: Refinamiento de Gráficos e Historial Scoping

Se profundizaron las visualizaciones y la precisión de los datos según el rol del usuario.

### 1. Backend: Enriquecimiento de Datos
- **Métricas de Abastecimiento:** `DashboardService.getStats` ahora calcula `purchaseData` (movimientos `IN`) de los últimos 7 días.
- **Scoping de Historial:**
    - Los **Merchants** ahora ven movimientos de sus propios productos o movimientos que ellos mismos ejecutaron como usuarios (ej. repo de stock).
- **Corrección RBAC:** Se unificó el chequeo de roles a `toLowerCase()` para evitar discrepancias con la base de datos.
- **Alertas de Stock:** Se validó que el filtro `stock <= minStock` sea reactivo a los cambios del inventario.

### 2. Frontend: Nuevas Visualizaciones
- **Gráfico de Compras/Abastecimiento:** Tanto Administradores como Comerciantes ahora tienen un segundo gráfico de barras que muestra las unidades que ingresaron al sistema (Restock).
- **Unificación de Consultas:** Se aseguró que `Dashboard.tsx` use la lógica de roles unificada para habilitar/deshabilitar consultas de stock bajo.
- **Trazabilidad:** Se mejoró la visualización de fechas en las tablas incluyendo hora para mayor precisión en el seguimiento de movimientos.

## Fase Final: Pulido y Estabilidad de Tiempo Real

Se realizaron los ajustes finales para garantizar una experiencia de usuario fluida y reactiva.

### 1. Reactividad SSE Robusta
- **Fix "Double Wrap":** Se corrigió la extracción de datos en el cliente SSE para manejar payloads anidados (`parsedData.data`), asegurando que las actualizaciones se disparen siempre.
- **Eventos Expandidos:** Se agregaron `stock.changed` y `product.created` al stream de SSE para que el dashboard sea un reflejo vivo de todo el sistema.
- **Filtro de Productos Activos:** Se refinó la consulta de "Stock Bajo" para ignorar productos inactivos, mejorando la relevancia de las alertas.

### 2. Dashboard del Merchant Correcto
- **Scoping Global:** Se ajustó la consulta de movimientos para Merchants para incluir cualquier acción realizada por el usuario, permitiendo que sus gráficos de abastecimiento reflejen sus propias reposiciones aunque no posean el producto.
- **UX Refined:** Se cambió la etiqueta "Mis Productos Activos" por "Productos Activos" en la vista de Merchant para mayor claridad terminológica.

### 3. Entregables de Calidad
- **Documentación Completa:** Se generó un `challenge_change_summary.md` detallando la evolución del proyecto desde el análisis inicial.
- **Postman Finalizado:** La colección de Postman fue actualizada con todos los nuevos módulos (Inventory v2, Dashboard, Events, Shop).
- **Estabilidad Verificada:** Se realizaron pasadas de tests para confirmar que la lógica de negocio se mantiene sólida tras las refactorizaciones.

## Fase Final: Seeding y Preparación para Producción

En esta etapa se transformó el proyecto de un entorno puramente de desarrollo a uno listo para despliegue profesional.

### 1. Database Seeding (Poblamiento Inicial)
- **Script Robustos:** Se implementó `src/database/seeds/initial-seed.ts` para automatizar la creación de roles (Admin, Merchant, Customer) y usuarios de prueba.
- **Seguridad:** Las contraseñas de los usuarios semilla se hashean con `bcrypt` siguiendo estándares de seguridad.
- **Automatización:** Se agregó el comando `npm run seed` en el backend para facilitar el despliegue rápido.

### 2. Infraestructura de Producción (DevOps)
- **Backend Dockerizado:** Se creó un `Dockerfile` multi-stage optimizado para producción, minimizando el tamaño de la imagen y mejorando la seguridad.
- **Frontend Dinámico:** Se migró la configuración de la API a variables de entorno (`VITE_API_URL`), permitiendo que la App apunte dinámicamente al backend en AWS sin cambios de código.
- **README Profesional:** Se generó el archivo `README.md` en la raíz del monorepo con guías de instalación local, credenciales de prueba y una estrategia teórica de despliegue en la nube (AWS + Vercel).

### Conclusión del Challenge
El proyecto finaliza con una arquitectura sólida, orientada a eventos, con actualizaciones en tiempo real y una suite de herramientas (Postman, Seeds, Docker) que garantizan su escalabilidad y facilidad de revisión para el equipo de Tecnosoftware.
