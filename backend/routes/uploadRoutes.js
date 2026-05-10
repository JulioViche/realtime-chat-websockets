const express = require('express')
const multer = require('multer')
const path = require('path')
const { Worker } = require('worker_threads')

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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png, gif) y archivos PDF.'))
  },
})

router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer (ej. archivo muy grande)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo es demasiado grande. El límite es 10MB.' })
      }
      return res.status(400).json({ error: err.message })
    } else if (err) {
      // Otros errores (ej. tipo de archivo no permitido)
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' })
    }

    // Delegar el "procesamiento pesado" a un Worker Thread
    const worker = new Worker(path.join(__dirname, '../workers/fileWorker.js'))
    
    worker.postMessage({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path
    })

    worker.on('message', (result) => {
      if (result.success) {
        res.status(200).json({
          message: 'Archivo subido y procesado en hilo independiente',
          url: `/uploads/${req.file.filename}`,
          file: req.file,
          workerInfo: result
        })
      } else {
        res.status(500).json({ error: 'Error procesando el archivo' })
      }
      worker.terminate()
    })

    worker.on('error', (err) => {
      console.error('Worker error:', err)
      res.status(500).json({ error: 'Error interno en el worker de archivos' })
      worker.terminate()
    })
  })
})

module.exports = router
