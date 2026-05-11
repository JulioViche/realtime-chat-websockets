# Contenedores Docker utilizados

El repositorio incluye:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`

## Levantar sistema completo

```bash
docker compose up --build
```

Servicios expuestos:

| Servicio | URL/Puerto | Descripcion |
|---|---|---|
| Frontend | `http://localhost:5173` | React + Vite |
| Backend | `http://localhost:3000` | Express + Socket.io |
| MongoDB | `localhost:27017` | Base de datos |

## Persistencia

El `docker-compose.yml` define volumenes para:

- `mongo-data`: datos de MongoDB.
- `backend-uploads`: archivos subidos al chat.

## Variables inyectadas

El backend recibe las variables necesarias por `environment`:

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/realtime-chat
JWT_SECRET=cambia_esta_clave_larga_para_jwt
ADMIN_USER=admin
ADMIN_PASS=admin123
PIN_PEPPER=cambia_esta_clave_larga_para_huellas_y_cifrado
```

El frontend recibe:

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_PROXY_TARGET=http://backend:3000
```

## MongoDB individual

Si solo necesitas MongoDB local por contenedor:

```bash
docker run --name realtime-chat-mongo -d -p 27017:27017 mongo:7
```
