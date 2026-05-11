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

*   **Frontend (Cliente):** React.js + Vite + TailwindCSS.
*   **Backend (Servidor):** Node.js + Express.js + Socket.io.
*   **Base de Datos:** MongoDB (Persistencia de mensajes, configuración de salas y almacenamiento de credenciales hasheadas con `bcrypt`).

### 📊 Diagramas y Modelos
Para un detalle exhaustivo del diseño del sistema, consulta los siguientes documentos en la carpeta `/docs`:
1.  📄 **[Modelo de Datos y Reglas de Negocio](./docs/datamodel/datamodel.md)**
2.  🐳 **[Arquitectura de Contenedores (Docker)](./docs/containers.md)**
3.  📋 **[Documento Original de Requisitos](./docs/requisitos.md)**

---

## ⚙️ 3. Requisitos Previos

Para ejecutar este proyecto en un entorno local, necesitas tener instalado:
*   **Node.js** (v18.0 o superior).
*   **MongoDB** (Instalación local como servicio de Windows o mediante contenedor Docker en el puerto `27017`).
*   **Git** (Para clonar el repositorio).

---

## 🚀 4. Instalación y Despliegue Local

Sigue estos pasos cuidadosamente para levantar ambos entornos (Backend y Frontend).

### Paso 4.1: Configuración del Backend (Servidor)
1. Abre una terminal y dirígete a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz de la carpeta `backend` con la siguiente configuración:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/realtime-chat
   JWT_SECRET=tu_clave_secreta_aqui
   ADMIN_USER=admin
   ADMIN_PASS=admin123
   PIN_PEPPER=clave_secreta_para_huellas
   ```
4. Inicia el servidor:
   ```bash
   node main.js
   ```
   *(Deberías ver los mensajes: "Servidor corriendo en puerto 3000" y "MongoDB connected").*

### Paso 4.2: Configuración del Frontend (Cliente)
1. Abre **otra** pestaña de terminal y dirígete a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador web en la dirección indicada (usualmente `http://localhost:5173`).

---

## 📖 5. Guía de Uso

### Para el Administrador (Creación de Salas)
1. Ve a `http://localhost:5173/admin` en tu navegador.
2. Inicia sesión con las credenciales definidas en tu `.env` (Ej. Usuario: `admin`, Clave: `admin123`).
3. En el **Panel de Control**, haz clic en **"Nueva Sala"**.
4. Define un nombre, escribe un **PIN numérico (Mínimo 4 dígitos)**, y elige el tipo de sala (Texto o Multimedia).
5. **¡Importante!** Comparte el PIN que acabas de escribir con los usuarios. Por seguridad criptográfica, el sistema no guardará el PIN en texto plano para mostrarlo después.

### Para el Usuario Final (Chatear)
1. Ve a la página principal `http://localhost:5173/`.
2. Ingresa el **PIN** que te proporcionó el administrador.
3. Elige un **Nickname** (debe ser único en esa sala).
4. Haz clic en "Unirse a la sala".
5. Si la sala es **Multimedia**, verás un icono de "Clip" para adjuntar imágenes o PDFs (Límite: 10MB).
6. Al cerrar la pestaña, tu sesión se liberará automáticamente.

---

## 🧪 6. Pruebas Unitarias (Testing)
El backend cuenta con una suite de pruebas automatizadas (Jest) que verifican la lógica de negocio, concurrencia de WebSockets y manejo de errores.

Para ejecutarlas:
```bash
cd backend
npm test
```
Para ver el porcentaje de cobertura de código (Coverage > 70%):
```bash
npm test -- --coverage
```

---
*Desarrollado para la materia de Aplicaciones Distribuidas - 2026*