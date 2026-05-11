# Prueba de carga WebSocket - 50 usuarios

Estado: **APROBADA**

| Métrica | Valor |
|---|---:|
| Fecha | 2026-05-11T15:41:34.378Z |
| Herramienta | Node.js + socket.io-client |
| URL probada | http://127.0.0.1:3101 |
| Usuarios virtuales | 50 |
| Usuarios conectados | 50 |
| Mensajes enviados | 50 |
| Broadcasts esperados | 2500 |
| Broadcasts recibidos | 2500 |
| Latencia p95 de ingreso | 5614 ms |
| Latencia máxima de ingreso | 5705 ms |
| Latencia p95 de mensajes | 265 ms |
| Latencia máxima de mensajes | 271 ms |
| Duración total | 6430 ms |

## Criterios

- 50 usuarios simultáneos conectados a una sala: Cumple
- Entrega de mensajes en menos de 1 segundo p95: Cumple
- Sin errores de conexión o ingreso: Cumple

## Errores

Sin errores registrados.

## Comando

```bash
cd backend
npm run load:test
```
