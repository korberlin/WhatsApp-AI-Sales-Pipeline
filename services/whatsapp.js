import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * WhatsApp messaging service
 */
export const WhatsAppService = {
  /**
   * Send a text message to a WhatsApp user
   * @param {string} phoneNumber - Recipient's phone number
   * @param {string} message - Message text to send
   * @returns {Promise} API response
   */
  async sendTextMessage(phoneNumber, message) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${config.whatsapp.baseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          text: { body: message }
        }
      });
      
      logger.info(`Message sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending WhatsApp message: ${error.message}`);
      if (error.response) {
        logger.error(`WhatsApp API error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  },
  
  /**
   * Send a media message (image, video, document) to a WhatsApp user
   * @param {string} phoneNumber - Recipient's phone number
   * @param {string} mediaUrl - URL of the media to send
   * @param {string} mediaType - Type of media ('image', 'video', 'document')
   * @param {string} caption - Optional caption for the media
   * @returns {Promise} API response
   */
  async sendMediaMessage(phoneNumber, mediaUrl, mediaType, caption = '') {
    try {
      const response = await axios({
        method: 'POST',
        url: `${config.whatsapp.baseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          [mediaType]: {
            link: mediaUrl,
            caption: caption
          }
        }
      });
      
      logger.info(`Media message (${mediaType}) sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending WhatsApp media message: ${error.message}`);
      if (error.response) {
        logger.error(`WhatsApp API error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  },
  
  /**
   * Parse an incoming WhatsApp webhook message
   * @param {Object} body - Webhook request body
   * @returns {Object|null} Parsed message data or null if not a valid message
   */
  parseWebhookMessage(body) {
    if (body.object !== 'whatsapp_business_account') {
      return null;
    }
    
    const messageData = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contactData = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
    
    if (!messageData || !contactData) {
      return null;
    }
    
    const result = {
      phoneNumber: messageData.from,
      name: contactData.profile.name,
      timestamp: messageData.timestamp,
      type: messageData.type,
      messageId: messageData.id
    };
    // Extract content based on message type
    switch (messageData.type) {
      case 'text':
        result.text = messageData.text.body;
        break;
      case 'image':
        result.mediaId = messageData[messageData.type].id;
        result.mimeType = messageData[messageData.type].mime_type;
        break;
      case 'video':
        result.mediaId = messageData[messageData.type].id;
        result.mimeType = messageData[messageData.type].mime_type;
        break;
      case 'document':
      case 'audio':
        result.mediaId = messageData[messageData.type].id;
        result.mimeType = messageData[messageData.type].mime_type;
        break;
    }
    
    return result;
  },
  
  /**
   * Download media from a WhatsApp message
   * @param {string} mediaId - ID of the media to download
   * @returns {Promise<Buffer>} Media data as buffer
   */
  async downloadMedia(mediaId) {
    try {
      // Get media URL
      const mediaUrlResponse = await axios({
        method: 'GET',
        url: `${config.whatsapp.baseUrl}/${config.whatsapp.apiVersion}/${mediaId}`,
        headers: {
          'Authorization': `Bearer ${config.whatsapp.accessToken}`
        }
      });
      
      // Download media from URL
      const mediaData = await axios({
        method: 'GET',
        url: mediaUrlResponse.data.url,
        headers: {
          'Authorization': `Bearer ${config.whatsapp.accessToken}`
        },
        responseType: 'arraybuffer'
      });
      
      return mediaData.data;
    } catch (error) {
      logger.error(`Error downloading WhatsApp media: ${error.message}`);
      throw error;
    }
  }
};

export default WhatsAppService;