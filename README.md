# 💬 Sistema de Chat en Tiempo Real con Salas Seguras

![Estado](https://img.shields.io/badge/Estado-Completado-success)
![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.0-blue)
![Stack](https://img.shields.io/badge/Stack-MERN-orange)

## 📌 1. Descripción del Proyecto

Este proyecto es un aplicativo web de chat en tiempo real diseñado bajo un enfoque de **sistemas distribuidos y concurrentes**. Permite la creación y gestión de salas de conversación seguras por parte de un administrador, con acceso controlado para los usuarios finales mediante PINs únicos. 

El sistema garantiza una **comunicación bidireccional instantánea** (baja latencia) mediante WebSockets, empleando **Worker Threads** (Hilos) en el servidor para evitar bloqueos durante tareas pesadas como la autenticación o el procesamiento masivo de mensajes.

### Características Principales:
*   **Gestión Centralizada:** Un administrador autenticado puede crear salas de tipo **Texto** o **Multimedia**.
*   **Acceso Anónimo pero Seguro:** Los usuarios ingresan con un PIN y un Nickname (sin registro previo).
*   **Prevención de Suplantación:** Mecanismo estricto de sesión única por IP/Dispositivo.
*   **Soporte Multimedia:** Transferencia de imágenes y documentos PDF con visualización y barra de progreso.
*   **Concurrencia:** Uso intensivo de hilos (`piscina`, `worker_threads`) para garantizar escalabilidad.

---

## 🏗️ 2. Arquitectura del Sistema

El proyecto sigue una arquitectura **Cliente-Servidor** separada en dos capas principales, comunicadas a través de una API RESTful y un túnel WebSocket persistente.

### 🎨 Frontend (UI)
Construido con **React y Vite**, proporcionando una interfaz moderna y responsiva.
- **Tailwind CSS:** Estilado rápido y consistente.
- **Socket.io Client:** Conexión bidireccional persistente.
- **Atomic Design:** Estructura modular (`atoms`, `molecules`, `organisms`).

### ⚙️ Backend (API)
Núcleo del sistema construido con **Node.js**, **Express** y **Socket.io**.
- **Worker Threads:** Delegación de tareas pesadas (`socketWorker.js`, `fileWorker.js`) para evitar bloqueos del Event Loop.
- **Sesiones en RAM:** Gestión eficiente de usuarios conectados y timeout por inactividad (30 min).
- **Seguridad:** Hasheo de PINs con `bcrypt` y validación estricta de archivos con `multer`.

### 📊 Base de Datos
- **MongoDB:** Almacenamiento de mensajes, configuración de salas y credenciales de administrador.

Para un detalle exhaustivo, consulta la carpeta `/docs`:
1.  📄 **[Modelo de Datos y Reglas de Negocio](./docs/datamodel/datamodel.md)**
2.  🐳 **[Arquitectura de Contenedores (Docker)](./docs/containers.md)**

---

## 🚀 3. Instalación y Configuración

### Paso 1: Requisitos Previos
*   **Node.js** (v18.0+)
*   **MongoDB** corriendo en el puerto `27017`

### Paso 2: Configuración del Backend
1. Entra a `backend/` e instala dependencias: `npm install`.
2. Crea un archivo `backend/.env`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/realtime-chat
   JWT_SECRET=tu_clave_secreta
   ADMIN_USER=admin
   ADMIN_PASS=admin123
   PIN_PEPPER=secreto_para_pins
   ```
3. Inicia: `node main.js`.

### Paso 3: Configuración del Frontend
1. Entra a `frontend/` e instala dependencias: `npm install`.
2. Crea un archivo `frontend/.env`:
   ```env
   VITE_SOCKET_URL=http://localhost:3000
   ```
3. Inicia: `npm run dev`.

---

## 📱 4. Acceso Externo (Mobile Hotspot)

Para conectar dispositivos externos (como un celular) usando la zona de cobertura de tu laptop:

1. **IP de la Red:** Identifica tu IP de Hotspot (ej. `192.168.137.1`).
2. **Frontend .env:** Cambia `VITE_SOCKET_URL` en `frontend/.env` a la IP de tu laptop:
   ```env
   VITE_SOCKET_URL=http://192.168.137.1:3000
   ```
3. **Ejecutar Frontend:** Usa el flag `--host` para que sea visible en la red:
   ```bash
   npm run dev -- --host
   ```
4. **Acceso:** En el celular, entra a `http://192.168.137.1:5173`.

---

## 🧪 5. Pruebas (Testing)
El backend incluye pruebas automatizadas con **Jest**:
```bash
cd backend
npm test                # Ejecutar tests
npm test -- --coverage  # Ver cobertura de código
```

---
*Desarrollado para la materia de Aplicaciones Distribuidas - 2026*
