# Contenedores Docker utilizados

## MongoDB

Puedes usar este comando para iniciar un contenedor de MongoDB:

```
docker run --name mongodb -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin mongo:latest
```

Esto crea un contenedor llamado `mongodb`, expone el puerto 27017 y define usuario y contraseña de administrador.

Para conectar tu backend a este contenedor, agrega la siguiente variable al archivo `.env` dentro del backend:

`MONGO_URI=mongodb://admin:admin@localhost:27017/`

---