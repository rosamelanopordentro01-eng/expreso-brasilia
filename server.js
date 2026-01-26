/**
 * Expreso Brasilia - Servidor Node.js
 * Servidor Express para servir el sitio web
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api', apiRoutes);

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🚌 EXPRESO BRASILIA - Servidor iniciado            ║
    ║                                                       ║
    ║   URL: http://localhost:${PORT}                        ║
    ║                                                       ║
    ║   Endpoints API:                                      ║
    ║   - GET  /api/places?q=ciudad                         ║
    ║   - GET  /api/destinations                            ║
    ║   - GET  /api/services                                ║
    ║   - POST /api/search                                  ║
    ║   - POST /api/contact                                 ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
