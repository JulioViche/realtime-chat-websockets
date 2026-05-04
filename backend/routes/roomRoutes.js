const express = require('express')
const router = express.Router()
const roomController = require('../controllers/roomController')

// Crear sala
router.post('/', roomController.createRoom)

// Unirse a la sala
router.post('/join', roomController.joinRoom)

module.exports = router
