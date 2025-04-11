import express from 'express';
import bodyParser from 'body-parser';
import metaRoutes from './routes/meta.js';
import logger from './utils/logger.js';
import config from './config/index.js';


/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    next();
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.environment === 'development' ? err.mesage: undefined
    });
};

//Init express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(requestLogger);

// routes
app.use(metaRoutes);

// Error Handling
app.use(errorHandler);
export default app;