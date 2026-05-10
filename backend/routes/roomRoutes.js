const express = require('express')
const router = express.Router()
const roomController = require('../controllers/roomController')
const { verifyAdminToken } = require('../middlewares/authMiddleware')

// Rutas Administrativas (Protegidas)
router.post('/', verifyAdminToken, roomController.createRoom)
router.get('/', verifyAdminToken, roomController.getAllRooms)
router.delete('/:id', verifyAdminToken, roomController.deleteRoom)

// Rutas Públicas (Para usuarios)
router.get('/:pin/messages', roomController.getRoomMessages)

module.exports = router
