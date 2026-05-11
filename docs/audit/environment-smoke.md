# Prueba de ambiente local

Fecha: 2026-05-11T15:41:51.698Z

Resultado: **14/14 verificaciones aprobadas**

| Verificación | Estado | Evidencia |
|---|---|---|
| Node.js 18 o superior | OK | v24.14.1 |
| npm disponible | OK | 11.11.0 |
| README en la raíz | OK | README.md |
| Backend separado | OK | backend/package.json, backend/main.js |
| Frontend separado | OK | frontend/package.json, frontend/src/App.jsx |
| Plantilla de entorno backend | OK | backend/.env.example |
| Plantilla de entorno frontend | OK | frontend/.env.example |
| backend/.env está ignorado por Git | OK | backend/.env |
| frontend/.env está ignorado por Git | OK | frontend/.env |
| Dependencias backend instaladas | OK | backend/node_modules, backend/package-lock.json |
| Dependencias frontend instaladas | OK | frontend/node_modules, frontend/package-lock.json |
| Build frontend generado | OK | frontend/dist/index.html |
| Reporte HTML de cobertura disponible | OK | Statements 82.86%, Lines 83.64% |
| Backend responde health check | OK | 200 API funcionando |

## Comando

```bash
node scripts/environmentCheck.js
```
