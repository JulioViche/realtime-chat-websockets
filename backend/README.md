# ⚙️ Backend API - Real-Time Chat System

Este es el núcleo del sistema de chat, construido con **Node.js**, **Express** y **Socket.io**. Implementa una arquitectura orientada a la eficiencia y seguridad, utilizando hilos independientes para tareas pesadas y gestión de sesiones en memoria RAM.

## 🚀 Características Técnicas Avanzadas

### 1. Gestión de Concurrencia con Worker Threads
Para asegurar que el bucle de eventos (Event Loop) de Node.js nunca se bloquee, las tareas que requieren iteración o procesamiento se delegan a hilos independientes:
- **`socketWorker.js`**: Maneja la validación de sesiones duplicadas por IP y el filtrado de listas de usuarios.
- **`fileWorker.js`**: Procesa las subidas de archivos (simulación de escaneo y procesamiento) fuera del hilo principal.

### 2. Validaciones de Seguridad en Multer
El sistema de subida de archivos es estricto para prevenir abusos:
- **Límite de tamaño:** 10MB por archivo.
- **Filtro de tipos:** Solo se permiten imágenes (`jpg`, `jpeg`, `png`, `gif`) y documentos `pdf`.
- **Manejo de Errores:** Respuestas claras al cliente cuando se violan las restricciones.

### 3. Sesiones en RAM y Timeout por Inactividad
- **Eficiencia:** Las sesiones activas se mantienen en un `Map` en RAM para validaciones instantáneas sin consultas constantes a la base de datos.
- **Seguridad:** Implementa un **Timeout de 30 minutos**. Si un usuario no interactúa (enviar mensajes o archivos), el servidor lo desconecta automáticamente para liberar recursos.

### 4. Comunicación en Tiempo Real
- Uso de **Socket.io** con soporte para salas (Rooms) privadas.
- Eventos personalizados para desconexión forzada (sesión movida) y timeout por inactividad.

---

## 🛠️ Desarrollo y Pruebas

### Instalación
```bash
npm install
```

### Ejecución
```bash
# Modo desarrollo (requiere configurar .env)
node main.js
```

### Suite de Pruebas (Jest)
Se ha implementado una cobertura exhaustiva que incluye:
- **Unitarias:** Controladores de salas y autenticación.
- **Integración WebSocket:** Pruebas de conexión, unión a salas y mensajería en tiempo real.
- **Workers:** Verificación de la lógica off-loaded en hilos independientes.
- **Uploads:** Validación de las restricciones de Multer.

Para ejecutar todos los tests:
```bash
npm test
```

Para ver la cobertura:
```bash
npm test -- --coverage
```

---

## 📁 Estructura del Proyecto
- `/controllers`: Lógica de negocio para las rutas API.
- `/models`: Esquemas de Mongoose (MongoDB).
- `/routes`: Definición de endpoints REST.
- `/workers`: Scripts diseñados para ejecutarse en `Worker Threads`.
- `/tests`: Suite completa de pruebas unitarias e integración.
- `/uploads`: Directorio local para almacenamiento temporal de archivos.
