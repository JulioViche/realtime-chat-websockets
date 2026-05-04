const express = require('express')
const router = express.Router()
const roomController = require('../controllers/roomController')

// Crear sala
router.post('/', roomController.createRoom)

// Obtener historial de mensajes de la sala
router.get('/:pin/messages', roomController.getRoomMessages)

module.exports = router
