const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
app.use(express.json())

const authRoutes = require('./routes/authRoutes')
const roomRoutes = require('./routes/roomRoutes')
const userSessionRoutes = require('./routes/userSessionRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/sessions', userSessionRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err))

app.get('/', (req, res) => {
  res.send('API funcionando')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
