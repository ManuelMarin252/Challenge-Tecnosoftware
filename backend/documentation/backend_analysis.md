# Análisis Técnico del Backend

## 1. Infraestructura y Configuración

El proyecto es una aplicación backend construida con **NestJS**, utilizando una arquitectura modular y escalable.

- **Runtime**: Node.js
- **Framework**: NestJS (v9.x)
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM (v0.3.x)
- **Contenerización**: Docker y Docker Compose para la base de datos PostgreSQL.

### Configuración Global
- `app.module.ts`: Módulo raíz que importa `ConfigModule` (variables de entorno), `TypeOrmModule` (conexión a DB) y `ApiModule` (rutas de la aplicación).
- `main.ts`: Punto de entrada que configura `ValidationPipe` global para la validación de DTOs.

## 2. Arquitectura de Base de Datos (Entidades Principales)

El esquema de base de datos utiliza **TypeORM** con las siguientes entidades clave:

### **User**
- Tabla: `user`
- Relaciones:
    - **ManyToMany** con `Role` (tabla pivote `user_roles`).
    - **OneToMany** con `Product` (un usuario/merchant puede tener muchos productos).
- Seguridad: Almacena contraseña (debe estar hasheada, gestionado por `AuthService`).

### **Product**
- Tabla: `product`
- Características Notables:
    - **Herencia/Polimorfismo**: Utiliza una columna `details` de tipo **JSONB** para almacenar detalles específicos del producto (ej. `ComputerDetails`). Esto permite flexibilidad para diferentes tipos de productos sin múltiples tablas.
    - **Validación Anidada**: Utiliza `class-validator` y `class-transformer` (`@Type(ProductDetailsTypeFn)`) para validar el contenido del JSONB basado en la categoría.
- Relaciones:
    - **ManyToOne** con `User` (Merchant).
    - **ManyToOne** con `Category`.

### **Role**
- Tabla: `role`
- Enum: `RoleIds` (Admin, Merchant, Customer).

## 3. Seguridad y Autenticación

- **Autenticación**: Basada en JWT (JSON Web Tokens).
- **Guards**:
    - `AuthGuard`: Verifica la validez del token JWT.
    - `RolesGuard`: Verifica si el usuario tiene los roles requeridos.
- **Decorador `@Auth`**: Un decorador personalizado que compone `UseGuards(AuthGuard, RolesGuard)` y `SetMetadata` para simplificar la protección de rutas.

## 4. Análisis de Rutas (API Endpoints)

### **Auth Module** (`/auth`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | Iniciar sesión | Pública |
| POST | `/auth/register` | Registrar nuevo usuario | Pública |

### **Product Module** (`/product`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| GET | `/product/:id` | Obtener producto por ID | Pública |
| POST | `/product/create` | Crear producto inicial | **Admin, Merchant** |
| POST | `/product/:id/details` | Agregar detalles al producto | **Admin, Merchant** |
| POST | `/product/:id/activate` | Activar producto si está completo | **Admin, Merchant** |
| DELETE | `/product/:id` | Eliminar producto | **Admin, Merchant** |

### **Role Module** (`/role`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| POST | `/role/assign` | Asignar rol a usuario | **Admin** |

### **User Module** (`/user`)
| Método | Ruta | Descripción | Seguridad |
| :--- | :--- | :--- | :--- |
| GET | `/user/profile` | Obtener perfil del usuario actual | **Autenticado** |

## 5. Observaciones Técnicas

1.  **Manejo de Productos**: El flujo de creación de productos parece ser de múltiples pasos:
    1.  `create`: Crea el producto base (inactivo).
    2.  `details`: Agrega los detalles técnicos (JSONB).
    3.  `activate`: Valida que todo esté completo y activa el producto.
    *Este patrón es robusto para formularios complejos.*

2.  **Validación**: Uso extensivo de DTOs con `class-validator` asegura la integridad de los datos antes de llegar a la lógica de negocio.

3.  **Testing**:
    - Se utilizan pruebas unitarias con **Jest**.
    - Recientemente se corrigieron problemas de configuración en `tsconfig.json` y dependencias de base de datos en los tests de controladores.

## 6. Estructura del Proyecto

A continuación se detalla la estructura principal de carpetas y archivos en `src`:

```
src
├── api
│   ├── auth
│   │   ├── controllers
│   │   ├── guards
│   │   ├── services
│   │   └── auth.module.ts
│   ├── product
│   │   ├── controllers
│   │   ├── dto
│   │   ├── services
│   │   └── product.module.ts
│   ├── role
│   │   ├── controllers
│   │   ├── dto
│   │   ├── enum
│   │   ├── services
│   │   └── role.module.ts
│   ├── user
│   │   ├── controllers
│   │   ├── dto
│   │   ├── services
│   │   └── user.module.ts
│   └── api.module.ts
├── common
│   └── helper
├── config
│   └── index.ts
├── database
│   ├── entities
│   ├── migration
│   ├── seed
│   ├── typeorm
│   └── database.module.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```
