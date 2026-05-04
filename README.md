# 💬 Real-Time Chat System

![Estado: En proceso](https://img.shields.io/badge/Estado-En%20proceso-yellow)
![Versión: 1.0](https://img.shields.io/badge/Versi%C3%B3n-1.0-blue)
![Stack: MERN](https://img.shields.io/badge/Stack-MERN-orange)

Un sistema de mensajería en tiempo real simple, eficiente y ultraligero construido con la pila **MERN** (MongoDB, Express, React, Node.js) y WebSockets. Este proyecto permite la comunicación inmediata a través de salas interactivas, con soporte para transferencia de archivos multimedia y validación de usuarios en memoria RAM, lo que garantiza baja latencia.

## 🚀 Características Principales

- **Comunicación en Tiempo Real:** Intercambio de mensajes bidireccional casi instantáneo a través de Socket.io.
- **Salas Aisladas:** Sistema de salas (Rooms) con control de acceso por medio de un PIN único.
- **Validación en Memoria (RAM):** Control estricto de usuarios conectados en cada sala sin recargar la base de datos, garantizando identidades únicas por sala.
- **Soporte Multimedia:** Transferencia de imágenes y archivos a través de un sistema unificado usando Axios (con barras de carga) y servido estáticamente.
- **Auditoría Persistente:** Historial de mensajes y archivos permanentemente guardados en MongoDB.

---

## 🛠️ Configuración e Instalación del Proyecto

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proy-1
```

### 2. Configuración de Variables de Entorno

En el directorio `backend/`, crea o localiza el archivo `.env`. Las siguientes variables son requeridas por el sistema:

| Variable     | Descripción                                                   |
| ------------ | ------------------------------------------------------------- |
| `PORT`       | El puerto donde se ejecutará el backend (ej. 3000)            |
| `MONGO_URI`  | Cadena de conexión hacia tu instancia de MongoDB              |
| `JWT_SECRET` | Llave secreta para firmar los JSON Web Tokens administrativos |
| `ADMIN_USER` | Nombre de usuario para acceder al panel de administración     |
| `ADMIN_PASS` | Contraseña para el usuario administrador                      |

> **Nota de Seguridad:** No expongas los valores de este archivo en el código fuente. Usa un archivo `.env` o gestor de secretos en tu entorno de producción.

### 3. Instalación de Dependencias

Para el **Backend**:

```bash
cd backend
npm install
```

Para el **Frontend**:

```bash
cd frontend
npm install
```

### 4. Semilla de Datos (Opcional)

Puedes popular tu base de datos rápidamente con salas y mensajes de prueba ejecutando la semilla en el backend:

```bash
cd backend
node seed.js
```

_(Esto limpiará tus datos actuales y preparará las salas `123456` y `MEMES1`)_.

---

## 📚 Documentación Técnica y Arquitectura

El diseño arquitectónico y de despliegue del sistema está documentado en detalle en la carpeta `/docs`. Te recomendamos consultar los siguientes archivos para un profundo entendimiento de la lógica del negocio:

- 📊 **[Modelo de Datos (Data Model)](./docs/datamodel/datamodel.md):** Contiene las reglas del negocio, el esquema de colecciones en MongoDB y el Diagrama Entidad-Relación (ER) centrado en el almacenamiento eficiente sin tablas de sesiones rígidas.
- 🐳 **[Arquitectura de Contenedores](./docs/containers/containers.md):** Documentación sobre la orquestación, red interna, Docker, Docker Compose y el ciclo de vida del despliegue en entornos de producción.

---

## 💻 Módulos del Sistema

Este es un monorepositorio que divide el sistema en dos capas especializadas. Cada capa cuenta con su propia documentación detallada y comandos específicos de desarrollo:

### ⚙️ [Backend API (Servidor Node.js)](./backend/README.md)

Responsable de servir la API RESTful administrativa, gestionar el túnel bidireccional de Socket.io, manejar el almacenamiento de archivos (Multer) y comunicarse con el clúster MongoDB.

### 🎨 [Frontend UI (Cliente React/Vite)](./frontend/README.md)

Aplicación SPA moderna que consume el backend. Cuenta con diseño responsivo, enrutamiento dinámico, progreso de subida de archivos y renderizado reactivo del historial de chat.

---

<div align="center">
  <p>Construido con dedicación para el curso de <b>Aplicaciones Distribuidas</b>.</p>
</div>
