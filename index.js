import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const PORT = config.port;

app.listen(PORT, () => {
	logger.info(`Server started on port ${PORT}`);
	logger.info(`Environment: ${config.environment}`);
});


