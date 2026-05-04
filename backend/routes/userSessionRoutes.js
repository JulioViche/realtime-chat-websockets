const express = require('express');
const router = express.Router();
const userSessionController = require('../controllers/userSessionController');

// Obtener usuarios activos en una sala específica
router.get('/room/:roomId', userSessionController.getActiveSessionsInRoom);

// Actualizar el timestamp de última actividad (heartbeat)
router.put('/:sessionId/activity', userSessionController.updateActivity);

// Desconectar/Marcar inactivo a un usuario (salir de la sala)
router.put('/:sessionId/leave', userSessionController.leaveRoom);

module.exports = router;
