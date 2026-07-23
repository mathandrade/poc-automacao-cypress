// backend/server.js
const express = require('express');
const cors    = require('cors');

const config       = require('./config');
const statusRoutes = require('./routes/status');
const reportRoutes = require('./routes/report');
const uploadRoutes = require('./routes/upload');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', statusRoutes);
app.use('/api', reportRoutes);
app.use('/api', uploadRoutes);

// Boot
app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em http://localhost:${config.PORT}`);
});
