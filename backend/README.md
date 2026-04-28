
---


**Documentación de contenedores Docker:**
Consulta la guía en [../docs/containers.md](../docs/containers.md)

# Inicio del backend Node.js con Express

1. Abre una terminal en la carpeta `backend`.
2. Ejecuta:

```
npm init -y
npm install express mongoose dotenv
```

3. Crea un archivo `index.js` con el siguiente contenido básico:

```js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.get('/', (req, res) => {
  res.send('API funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
```

4. Crea un archivo `.env` con:

```
MONGO_URI=mongodb://admin:admin@localhost:27017/
PORT=3000
```

¿Quieres que cree estos archivos automáticamente en la carpeta backend?