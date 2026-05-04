const express = require('express')
const multer = require('multer')
const path = require('path')

const router = express.Router()

// Configuración de Multer para guardar en la carpeta "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage })

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' })
  }

  // Devolvemos la URL accesible (asumiendo que express.static expone /uploads)
  res.status(200).json({
    message: 'Archivo subido correctamente',
    url: `/uploads/${req.file.filename}`,
    file: req.file,
  })
})

module.exports = router
