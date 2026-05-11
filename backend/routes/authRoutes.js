const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { verifyAdminToken } = require('../middlewares/authMiddleware')

// POST /api/auth/login
router.post('/login', authController.login)
router.post('/logout', verifyAdminToken, authController.logout)

module.exports = router
