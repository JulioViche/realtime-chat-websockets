# Diagramas de secuencia

Diagramas Mermaid para validar los flujos obligatorios del sistema.

## Login del administrador

```mermaid
sequenceDiagram
  actor A as Administrador
  participant F as Frontend React
  participant API as Express API
  participant DB as MongoDB
  participant W as authWorker

  A->>F: Ingresa usuario y contraseña
  F->>API: POST /api/auth/login
  API->>DB: Busca Admin activo por username
  DB-->>API: Admin con password bcrypt
  API->>API: comparePassword(password)
  API->>W: Firmar JWT con expiración
  W-->>API: token
  API-->>F: 200 { token }
  F->>F: Guarda token admin
```

## Creación de sala por el administrador

```mermaid
sequenceDiagram
  actor A as Administrador
  participant F as Panel Admin
  participant API as Express API
  participant MW as authMiddleware
  participant DB as MongoDB

  A->>F: Completa nombre, PIN, tipo y seguridad
  F->>API: POST /api/rooms + Bearer JWT
  API->>MW: Validar token admin
  MW-->>API: Admin autorizado
  API->>DB: Verifica pinFingerprint único
  API->>API: bcrypt(PIN), HMAC fingerprint, AES-GCM opcional
  API->>DB: Guarda Room
  API-->>F: 201 { room }
  F->>API: GET /api/rooms
  API-->>F: Lista actualizada
```

## Acceso de usuario con PIN y nickname

```mermaid
sequenceDiagram
  actor U as Usuario
  participant F as Frontend React
  participant S as Socket.io
  participant W as socketWorker
  participant DB as MongoDB

  U->>F: Ingresa nickname y PIN
  F->>S: joinRoom { pin, user, deviceId }
  S->>DB: Busca salas activas
  S->>DB: comparePin con bcrypt
  S->>W: validateJoin por sala, nickname y dispositivo
  W-->>S: Sin conflicto
  S->>S: socket.join(roomId)
  S-->>F: success, roomId, roomType
  S-->>F: userListUpdate
```

## Envío y recepción de mensaje en tiempo real

```mermaid
sequenceDiagram
  actor U1 as Usuario A
  participant F1 as Cliente A
  participant S as Socket.io
  participant W as socketWorker
  participant DB as MongoDB
  participant F2 as Cliente B

  U1->>F1: Escribe mensaje
  F1->>S: sendMessage { roomId, content }
  S->>S: Verifica sesión y sala correcta
  alt Carga alta
    S->>W: processMessage
    W-->>S: Mensaje procesado
  end
  S->>DB: Guarda Message
  S-->>F1: newMessage
  S-->>F2: newMessage
```

## Subida de archivo en sala multimedia

```mermaid
sequenceDiagram
  actor U as Usuario
  participant F as Frontend React
  participant API as Express Upload
  participant FW as fileWorker
  participant S as Socket.io
  participant DB as MongoDB
  participant R as Resto de usuarios

  U->>F: Selecciona imagen o PDF
  F->>F: Valida tipo y tamaño
  F->>API: POST /api/upload multipart
  API->>API: Multer valida MIME y 10MB
  API->>FW: Procesa archivo sin bloquear
  FW-->>API: Archivo aceptado
  API-->>F: URL y metadatos
  F->>S: sendMessage { roomId, file }
  S->>DB: Guarda Message y File
  S-->>R: newMessage con archivo
```

## Desconexión de usuario

```mermaid
sequenceDiagram
  actor U as Usuario
  participant F as Frontend React
  participant S as Socket.io
  participant W as socketWorker
  participant R as Usuarios de la sala

  alt Cierre manual o pestaña cerrada
    U->>F: Sale o cierra navegador
    F->>S: disconnect
  else Inactividad
    S->>S: Timer de 30 minutos expira
    S-->>F: inactivity_timeout
    S->>S: disconnect(true)
  end
  S->>S: Limpia usuariosConectados e inactivityTimers
  S->>W: filterUsers(roomId)
  W-->>S: Lista actualizada
  S-->>R: userListUpdate
```
