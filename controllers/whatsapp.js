import config from '../config/index.js';
import logger from '../utils/logger.js';
import WhatsAppService from '../services/whatsapp.js';
import SessionService from '../services/session.js';

/**
 * WhatsApp webhook controller
 */
const whatsappController = {
  /**
   * Verify webhook endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  get: (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      logger.info('WhatsApp webhook verified');
      return res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      return res.sendStatus(403);
    }
  },
  
  /**
   * Process incoming webhook messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  post: async (req, res) => {
    try {
      // send 200 status
      res.sendStatus(200);
      
      const body = req.body;
      logger.debug('Received WhatsApp webhook event', body);
      if (body.entry && 
        body.entry[0]?.changes && 
        body.entry[0].changes[0]?.value?.statuses) {
      
      const status = body.entry[0].changes[0].value.statuses[0];
      logger.info(`Status update: "${status.status}" for message to ${status.recipient_id}`);
      return;
      }
      // Parse the webhook message
      const parsedMessage = WhatsAppService.parseWebhookMessage(body);
      if (!parsedMessage) {``
        logger.info('No valid WhatsApp message found in webhook');
        return;
      }
      const { phoneNumber, name, text, type } = parsedMessage;
      logger.info(`New ${type} message from ${name} (${phoneNumber})`);
      if (type !== 'service') {
        let messageToProcess = text;
        // For non-text messages, provide a default text to process
        if (type !== 'text') {
          messageToProcess = `[Received a ${type} message]`;
          SessionService.addMediaFile(phoneNumber, {mediaId: parsedMessage.mediaId, mimeType:parsedMessage.mimeType});
        }
        SessionService.queueMessage(phoneNumber, messageToProcess);  
      }
    } catch (error) {
      logger.error('Error processing WhatsApp webhook:', error);
    }
  }
};

export default whatsappController;