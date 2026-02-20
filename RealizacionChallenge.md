# Documento de Arquitectura y Realización Técnica

**Proyecto:** Challenge Tecnosoftware - E-commerce Event-Driven
**Autor:** Manuel Marín

---

## 1. Diagnóstico Inicial y Resolución de Deuda Técnica

Antes de implementar nuevas funcionalidades, se realizó una auditoría completa del código base provisto (Legacy Code) para asegurar una base sólida y escalable.

### 1.1. Corrección de Infraestructura y Entorno

* **Problema:** El archivo `docker-compose.yml` presentaba un error de sintaxis en la declaración de volúmenes que impedía levantar la base de datos.
* **Solución:** Se estandarizó la ruta del volumen (`./database-data:/var/lib/postgresql/data`) asegurando la persistencia de datos en el entorno local.

### 1.2. Estabilización de la Suite de Tests

* **Problema:** Múltiples tests fallaban debido a validaciones estrictas no cumplidas por los *mocks*, intentos de conexión a bases de datos reales en tests unitarios y errores de tipado de TypeScript (Jest).
* **Solución y Justificación:**
* **Mocks Tipados:** Se instanciaron explícitamente las clases (`new Product()`) en los tests en lugar de usar objetos literales. *Justificación:* `class-validator` requiere instancias reales para ejecutar decoradores anidados como `@ValidateNested`.
* **Aislamiento (Mocking):** Se eliminaron las importaciones de `TypeOrmModule` en los tests de controladores (`RoleController`), inyectando dependencias falsas (Mocks) y sobreescribiendo los Guards de autenticación. *Justificación:* Un test unitario debe evaluar la lógica de la función aislada, sin depender de I/O externo o infraestructura, garantizando rapidez y determinismo.
* **Configuración TS:** Se corrigió `tsconfig.json` para incluir globalmente los tipos de Jest.



### 1.3. Refactorización de Controladores (SRP)

* **Auditoría:** Se verificó que los controladores fueran "thin" (delgados).
* **Resultado:** La arquitectura existente ya delegaba correctamente la lógica a los servicios y usaba DTOs.
* **Justificación:** Validar el Principio de Responsabilidad Única (SRP) en los controladores era un paso pre-requisito obligatorio antes de implementar el bus de eventos, para evitar refactorizaciones masivas posteriores.

---

## 2. Fase 1: Arquitectura Orientada a Eventos (Event-Driven)

Para cumplir con el requerimiento principal de escalabilidad y bajo acoplamiento, se rediseñó la comunicación interna del backend.

### 2.1. Implementación del Bus de Eventos

* **Tecnología:** Se integró `@nestjs/event-emitter`.
* **Justificación:** Permite el procesamiento asíncrono (Fire-and-Forget). Un servicio puede notificar que "algo ocurrió" sin importarle qué otros módulos reaccionan a ello, eliminando las dependencias circulares y mejorando los tiempos de respuesta del endpoint principal.

### 2.2. Segregación del Módulo de Inventario

* **Acción:** Se extrajo toda la lógica de stock del `ProductModule` hacia un nuevo y dedicado `InventoryModule`.
* **Justificación:** Principio de Segregación de Interfaces y SRP. El catálogo de productos y el control de existencias son dominios de negocio distintos que mutan a diferentes velocidades.

### 2.3. Eventos de Dominio Clave

1. **`ProductCreatedEvent`:**
* *Flujo:* `ProductService` crea el producto  Emite Evento  `InventoryService` escucha y crea el registro de stock en 0.
* *Justificación:* Elimina la dependencia fuerte de Producto hacia Inventario.


2. **`StockUpdatedEvent` & `StockLowEvent`:**
* *Flujo:* Al modificar el stock, se emite el cambio. Si el nuevo stock  `minStock`, se dispara una alerta.
* *Justificación:* Prepara el terreno para la reactividad en el frontend y permite agregar notificaciones (ej. emails a compras) a futuro sin tocar la lógica core del inventario.



---

## 3. Fase 2: Desarrollo Frontend (Capa de Presentación)

Se construyó una Single Page Application (SPA) moderna, enfocada en la experiencia de usuario (UX) y el tipado estricto.

### 3.1. Stack Tecnológico y Configuración

* **Core:** React 19 + Vite + TypeScript. *Justificación:* Vite ofrece tiempos de build casi instantáneos, y TypeScript garantiza que los contratos de la API se respeten en el cliente.
* **Estado:** `@tanstack/react-query`. *Justificación:* Maneja el estado del servidor de forma óptima (caching, re-fetching, deduplicación de requests) eliminando la necesidad de Redux para datos remotos.
* **UI/UX:** TailwindCSS + Shadcn/UI. *Justificación:* Permite construir interfaces accesibles y modernas rápidamente, utilizando variables CSS para soportar **Modo Oscuro/Claro** nativo basado en el sistema operativo del usuario.

### 3.2. Integridad de Datos (Type Safety)

* Antes de codificar vistas, se mapearon las respuestas de la API (basadas en Postman) a interfaces TypeScript estrictas (`src/types/api.ts`).
* *Justificación:* Previene errores en tiempo de ejecución (ej. intentar acceder a `user.role` cuando la API devuelve un array `user.roles[]`).

---

## 4. Fase 3: Seguridad y Control de Acceso Basado en Roles (RBAC)

Se implementó un sistema robusto para que diferentes actores interactúen con la plataforma de forma segura.

### 4.1. Lógica de Backend

* **Protección de Endpoints:** Uso de Guards (`AuthGuard`, `RolesGuard`) para restringir el CRUD de Usuarios y Categorías exclusivamente al rol `Admin`.
* **Gestión Dinámica de Roles (`PATCH /user/:userId/roles`):**
* *Acción:* Permite asignar/remover roles masivamente.
* *Seguridad Core:* Se implementó validación para impedir que un Admin se quite a sí mismo el rol, evitando el bloqueo total del sistema (Self-Lockout).



### 4.2. UI Condicional en Frontend

* El componente `Layout` lee el JWT desencriptado y renderiza el **Sidebar** condicionalmente. Un `Customer` no tiene conocimiento visual de las rutas administrativas, reduciendo la superficie de ataque.

---

## 5. Fase 4: Lógica Core de Negocio y Auditoría (Event Sourcing Light)

Para garantizar la trazabilidad del inventario, se implementó un historial inmutable basado en eventos.

### 5.1. Implementación del Historial

* Se creó la entidad `InventoryMovement` (IN/OUT) y el endpoint de Tienda (`/shop/purchase`).
* **Flujo Arquitectónico:**
1. El Admin repone stock o el Cliente compra.
2. `InventoryService` actualiza el número en BD.
3. Se emite `StockReplenishedEvent` o `ProductSoldEvent`.
4. El `AuditListener` intercepta el evento y escribe asíncronamente en `InventoryMovement`.


* **Justificación (Crucial):** Separar la escritura del historial de la transacción principal mediante eventos aumenta la resiliencia. Si el log falla, la venta del cliente no se bloquea. Además, proporciona un registro de auditoría perfecto ("¿Quién modificó el stock y por qué?").

### 5.2. Soft Delete de Productos

* Se reemplazó el borrado físico (`DELETE` SQL) por un borrado lógico (`isActive = false`).
* **Justificación:** Borrar un producto físicamente rompería la integridad referencial de la base de datos (órdenes de compra pasadas apuntarían a un producto inexistente). El Soft Delete preserva la data histórica para analítica.

---

## 6. Fase 5: Dashboards y Reactividad en Tiempo Real (SSE)

Para demostrar las capacidades fullstack avanzadas, se conectó el backend y frontend en tiempo real.

### 6.1. Server-Sent Events (SSE)

* **Backend:** Se expuso el endpoint `@Sse() /events/stream` que empuja (pushea) los eventos del `EventEmitter2` directamente al cliente HTTP.
* **Frontend:** El Dashboard utiliza la API nativa `EventSource` para escuchar estos eventos. Al recibir uno (ej. venta realizada), React Query invalida la caché y actualiza los gráficos automáticamente sin recargar la página.
* **Justificación:** SSE es más ligero y nativo para HTTP que WebSockets cuando la comunicación es unidireccional (Servidor  Cliente), ideal para notificaciones de stock.

### 6.2. Segregación de Datos por Rol

* Los endpoints estadísticos (`/dashboard/stats`, `/history`) calculan dinámicamente el *scope* de los datos según quién pregunte:
* **Admin:** Ve la salud total del negocio.
* **Merchant:** Ve gráficos (Recharts) filtrados estrictamente por sus productos creados.
* **Customer:** Ve un resumen de sus gastos personales.



---

## 7. Preparación para Producción (DevOps & Deploy)

### 7.1. Database Seeding

* Se creó `initial-seed.ts` (ejecutable vía `npm run seed`) que pre-pobla la base de datos con los roles obligatorios y 3 usuarios de prueba (Admin, Merchant, Customer) con contraseñas encriptadas mediante `bcrypt`.
* *Justificación:* Permite al evaluador levantar el proyecto y testearlo inmediatamente sin tener que inyectar datos manualmente en la base de datos.

### 7.2. Configuración de Despliegue (Deploy Links)

* **Backend & DB:** Desplegado en [Nombre de la plataforma, ej: AWS / Render]
* *URL API:* `[Pegar aquí URL del Backend]`


* **Frontend:** Desplegado en Vercel, consumiendo la API mediante variables de entorno (`VITE_API_URL`).
* *URL App:* `[Pegar aquí URL de Vercel]`


* **Credenciales de Acceso Rápido:**
* Admin: `admin@admin.com` | Pass: `12345678`
* Merchant: `merchant@merchant.com` | Pass: `12345678`
* Customer: `customer@customer.com` | Pass: `12345678`