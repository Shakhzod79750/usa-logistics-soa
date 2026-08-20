require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const trackingRoutes = require('./routes/trackingRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const logger = require('./logger');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'tracking-service' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/tracking', trackingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => logger.info(`Tracking Service listening on port ${PORT}`));
