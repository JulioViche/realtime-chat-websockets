# 🎨 Frontend UI - Real-Time Chat System

Aplicación SPA (Single Page Application) construida con **React y Vite**. Este cliente proporciona una interfaz de usuario moderna, fluida y altamente responsiva para conectarse al backend de mensajería en tiempo real.

## 🌟 Características

- **Diseño Moderno:** UI atractiva y responsiva construida con **Tailwind CSS**.
- **Chat en Tiempo Real:** Integración nativa con `socket.io-client` para recibir y enviar mensajes sin recargar la página.
- **Rutas Dinámicas:** Uso de `react-router-dom` para manejar salas de chat privadas (`/room/:pin`), paneles administrativos y pantallas de inicio de sesión.
- **Archivos Multimedia con Progreso:** Subida asíncrona de archivos usando `axios` con la capacidad de renderizar una barra de carga en la UI.
- **Validación Cero Fricciones:** El acceso a las salas se delega al socket, recordando el `nickname` del usuario a través de `localStorage`.
- **Panel de Administración:** Interfaz gráfica para administradores, que permite la autenticación mediante JWT y la gestión de la base de datos de salas.

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Vite** | Empaquetador y servidor de desarrollo ultra-rápido. |
| **React** | Librería principal para la creación de componentes UI interactivos. |
| **Tailwind CSS** | Framework de CSS utilitario para estilado rápido y consistente. |
| **Socket.io Client** | Para establecer la conexión bidireccional y persistente con el túnel del backend. |
| **Axios** | Para peticiones HTTP asíncronas (subida de archivos e inicio de sesión admin). |
| **React Router DOM** | Manejo del enrutamiento en el navegador (Client-side routing). |
| **Lucide React** | Biblioteca de iconos vectoriales ligeros y limpios. |

---

## 🏗️ Estructura del Proyecto (Atomic Design)

El código fuente en `src/` sigue un enfoque simplificado de *Atomic Design* para mantener los componentes modulares y escalables:

- `/atoms`: Componentes UI básicos e indivisibles (ej. Botones, Inputs, Badges).
- `/molecules`: Combinación de átomos (ej. Burbujas de mensajes, Formularios completos, Header de la sala).
- `/organisms`: Vistas o secciones grandes formadas por moléculas (ej. Vista `Room.jsx`, `JoinRoom.jsx`, `AdminDashboard.jsx`).

---

## 🚀 Cómo Ejecutar en Desarrollo

1. Asegúrate de tener instalado Node.js.
2. Posiciónate en este directorio (`/frontend`).
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Levanta el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   *El servidor usualmente iniciará en `http://localhost:5173` o similar.*

> **Importante:** Para que el chat funcione y puedas unirte a una sala, el servidor del [Backend](../backend) también debe estar ejecutándose en el puerto 3000 de manera simultánea.
