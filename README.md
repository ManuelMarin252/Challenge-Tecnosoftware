# Challenge Tecnosoftware - E-commerce Dashboard & Inventory

Este proyecto es una plataforma de gestión de inventario y dashboard analítico para un E-commerce, construida con una arquitectura profesional orientada a eventos, segura y escalable.

## 🚀 Arquitectura
- **Backend**: NestJS con TypeORM y PostgreSQL. Utiliza `EventEmitter2` para desacoplar la lógica de negocio (Ventas/Compras) de los efectos secundarios (Auditoría/SSE).
- **Frontend**: React 18 con Vite, Tailwind CSS y TanStack Query.
- **Real-time**: Implementación de Server-Sent Events (SSE) para actualizaciones instantáneas del dashboard.
- **Seguridad**: Autenticación JWT y Control de Acceso basado en Roles (RBAC).

## 🛠️ Requisitos Previos
- [Docker](https://www.docker.com/) y Docker Compose.
- [Node.js](https://nodejs.org/) (v18+) o [Bun](https://bun.sh/).

## 📦 Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ManuelMarin252/Challenge-Tecnosoftware.git
   cd Challenge-Tecnosoftware
   ```

2. **Configurar Variables de Entorno:**
   - **Backend**: 
     ```bash
     cd backend
     cp .env.example .env
     ```
   - **Frontend**: 
     ```bash
     cd frontend
     cp .env.example .env
     ```

3. **Levantar el Backend (Totalmente Automatizado):**
   ```bash
   cd backend
   docker-compose up --build -d
   ```
   *Este comando levantará la base de datos, ejecutará las migraciones e insertará los datos de prueba (seeds) automáticamente.*

4. **Levantar el Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | admin@admin.com | `12345678` |
| **Comerciante (Merchant)** | merchant@merchant.com | `12345678` |
| **Cliente (Customer)** | customer@customer.com | `12345678` |

## ☁️ Guía de Despliegue (Producción)

### 1. Base de Datos (AWS RDS)
Se recomienda utilizar **AWS RDS for PostgreSQL**. 
- Configurar Multi-AZ para alta disponibilidad.
- Habilitar backups automáticos y storage autoscaling.
- El backend debe conectarse usando las credenciales seguras proporcionadas por RDS.

### 2. Backend (AWS EC2 / App Runner)
El backend está dockerizado (archivo `Dockerfile` incluido).
- **Opción A (EC2)**: Desplegar usando Docker Compose en una instancia EC2 con un balanceador de carga (ALB).
- **Opción B (App Runner)**: Enfoque serverless conectando directamente el repositorio o una imagen de ECR.
- **Importante**: Configurar las variables de entorno de producción (`DATABASE_HOST`, `JWT_SECRET`, etc.) en el servicio de AWS.

### 3. Frontend (Vercel)
El frontend está optimizado para **Vercel**.
- Conectar el repo de GitHub al dashboard de Vercel.
- Configurar la variable `VITE_API_URL` apuntando al dominio configurado para el backend en AWS.
- Vercel gestionará automáticamente el despliegue continuo (CD) y la terminación SSL.

---
*Desarrollado para el Challenge Técnico de Tecnosoftware.*
