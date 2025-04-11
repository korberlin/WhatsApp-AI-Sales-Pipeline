  import { encoding_for_model } from "tiktoken";
  import config from '../config/index.js'
  import logger from '../utils/logger.js'
  import OpenAIService from "./openai.js";
  import WhatsAppService from "./whatsapp.js";

  const encoder = encoding_for_model('gpt-4o');
  const sessions = new Map();

  // Session cleanup interval in ms
  const CLEANUP_INTERVAL = 60 * 60 * 1000;

  // Session timeout in ms (24 hours)
  const SESSION_TIMEOUT = 60 * 60 * 1000 * 24;

  /**
   * Session management service
   */
  export const SessionService = {
    /**
     * Get or create a session for a user
     * @param {string} phoneNumber - User's phone number
     * @returns {Object} The user session
     */
    getSession(phoneNumber) {
      if (!sessions.has(phoneNumber)) {
        logger.info(`Creating new session for user ${phoneNumber}`);

        // Initialize with system message
        sessions.set(phoneNumber, {
          messages: [{
            role: 'system',
            content: config.openai.systemInstructions
          }],
          lastActivity: Date.now(),
          leadInfo: {
            phone: phoneNumber
          },
          language: 'en',
          mediaFiles: [],
          messageQueue: [],
          processingFlag: false,
          processingToolCall: false,
          pendingToolCallId: null,
        });
      } else {
        // Update last activity time
        const session = sessions.get(phoneNumber);
        session.lastActivity = Date.now();
      }
      return sessions.get(phoneNumber);
    },

    /**
     * Add a message to the user's conversation history
     * @param {string} phoneNumber - User's phone number
     * @param {Object} message - Message object {role, content}
     */
    addMessage(phoneNumber, message) {
      const session = this.getSession(phoneNumber);
      session.messages.push(message);
      // Check if we need to trim messages due to token limit
      this.trimMessagesIfNeeded(phoneNumber);
      return session;   
    },

    /**
     * Store a media file reference for the WhatsApp user
     * @param {string} phoneNumber - WhatsApp phone number
     * @param {object} mediaInfo - Media info with mediaId and mimeType
     */
    addMediaFile(phoneNumber, mediaInfo) {
      const session = this.getSession(phoneNumber);
      session.mediaFiles.push(mediaInfo);
      logger.info(`Added media file ${mediaInfo.mediaId} to session ${phoneNumber}, total files: ${session.mediaFiles.length}`);
    },

    /**
     * Get all media files from a session
     * @param {string} phoneNumber - WhatsApp phone number
     * @returns {Array} Media files array
     */
    getMediaFiles(phoneNumber) {
      const session = this.getSession(phoneNumber);
      return session.mediaFiles;
    },

    /**
     * Clear media files after they've been processed
     * @param {string} phoneNumber - WhatsApp phone number
     */
    clearMediaFiles(phoneNumber){
      const session = this.getSession(phoneNumber);
      session.mediaFiles = [];
      logger.info(`Cleared media files for session ${phoneNumber}`);
    },

    /**
     * Trim older messages if the token count exceeds the limit
     * @param {string} phoneNumber - User's phone number
     */
    trimMessagesIfNeeded(phoneNumber) {
      const session = this.getSession(phoneNumber);
      let contextLength = this.getContextLength(session.messages);
      
      if (contextLength <= config.openai.maxTokens) {
        return;
      }
      
      logger.info(`Trimming session for ${phoneNumber}, current tokens: ${contextLength}`);

      // Initialize i before using it in the loop
      let i = 0;
      
      // Remove messages until we are under the limit
      while(contextLength > config.openai.maxTokens && i < session.messages.length) {
        const message = session.messages[i];

        // Never remove system messages
        if (message.role !== 'system') {
          const messageTokens = this.getMessageTokenCount(message);
          contextLength -= messageTokens;
          session.messages.splice(i, 1); 
          logger.info(`Removed message, new token count: ${contextLength}`);
        } else {
          i++;
        }
      }
      return session;
    },

    /**
     * Calculate token count for a single message
     * @param {Object} message - Message object
     * @returns {number} Token count
     */
    getMessageTokenCount(message) {
      if (typeof message.content === 'string') {
        return encoder.encode(message.content).length;
      } else if (Array.isArray(message.content)) {
        return message.content.reduce((sum, content) => {
          return content.type === 'text' ? sum + encoder.encode(content.text).length : sum;
        }, 0);
      }
      return 0;
    },

    /**
     * Calculate total token count for all messages
     * @param {Array} messages - Array of message objects
     * @returns {number} Total token count
     */
    getContextLength(messages) {
      return messages.reduce((length, message) => {
        return length + this.getMessageTokenCount(message);
      }, 0);
    },
    
    /**
     * Clear old sessions to prevent memory leaks
     */
    cleanupSessions() {
      const now = Date.now();
      
      for (const [phoneNumber, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
          logger.info(`Removing inactive session for ${phoneNumber}`);
          sessions.delete(phoneNumber);
        }
      }
    },

    /**
     * Queues the message into messageQueue array
     * @param {string} phoneNumber - User's phone number
     * @param {string} message - message to be queued
     * @returns {Object} session object
     */
    queueMessage(phoneNumber, message) {
      const session = this.getSession(phoneNumber);
      session.messageQueue.push({content: message, timestamp: Date.now()});
      return session;
    },

    /**
     * Determine if the message queue should be processed now
     * @param {string} phoneNumber - User's phone number
     * @returns {boolean} Whether the queue should be processed now
     */
    shouldProcessQueue(phoneNumber) {
      const session = this.getSession(phoneNumber);
      if (session.processingFlag || session.messageQueue.length === 0 || session.humanTakeover) {
        return false;
      }
      const now = Date.now();
      const dateLastMessage = session.messageQueue[session.messageQueue.length - 1].timestamp;
      return (now - dateLastMessage > 60000);
    },

    /**
     * Concatenate all messages in the queue
     * @param {string} phoneNumber - User's phone number
     * @returns {string} Concatenated message string
     */
    concatMessageQueue(phoneNumber) {
      const session = this.getSession(phoneNumber);
      if (session.messageQueue.length === 0){
        return;
      }
      session.processingFlag = true;
      let combinedMessage = '';
      for (const message of session.messageQueue) {
        combinedMessage += message.content;
        combinedMessage += ' ';
      }
      session.messageQueue = [];
      session.processingFlag = false;
      return combinedMessage;
    },

    /**
     * Check if a tool call is being processed
     * @param {string} phoneNumber - User's phone number
     * @returns {boolean} Whether a tool call is being processed
     */
    isProcessingToolCall(phoneNumber) {
      const session = this.getSession(phoneNumber);
      return session.processingToolCall;
    },

    /**
     * Start a tool call
     * @param {string} phoneNumber - User's phone number
     * @param {string} toolCallId - ID of the tool call
     */
    startToolCall(phoneNumber, toolCallId) {
      const session = this.getSession(phoneNumber);
      session.processingToolCall = true;
      session.pendingToolCallId = toolCallId;
    },

    /**
     * Complete a tool call
     * @param {string} phoneNumber - User's phone number
     */
    completeToolCall(phoneNumber) {
      const session = this.getSession(phoneNumber);
      session.processingToolCall = false;
      session.pendingToolCallId = null;
    },

    /**
     * Process message queue for a phone number
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<boolean>} - Whether processing was successful
     */
    async processMessageQueue(phoneNumber) {
      const session = this.getSession(phoneNumber);

      if (session.processingFlag || session.messageQueue.length === 0 ||
          session.processingToolCall || session.humanTakeover) {
        return false;
      }
      const combinedMessage = this.concatMessageQueue(phoneNumber);
      try {
        session.processingFlag = true;
        if (combinedMessage) {
          // Resetting the session for test purposes
          if (combinedMessage.toLowerCase().trim() === "reset") {
            await WhatsAppService.sendTextMessage(phoneNumber, "Session has been reset");
            sessions.delete(phoneNumber);
            logger.info(`Session reset for ${phoneNumber}`);
            return true;
          }
          const aiResponse = await OpenAIService.processMessage(phoneNumber, combinedMessage);
          await WhatsAppService.sendTextMessage(phoneNumber, aiResponse);
          return true;
        }
        return false;
      } catch(error) {
        logger.error(`Error processing queue for ${phoneNumber}:`, error);
        return false;
      } finally {
        if (sessions.has(phoneNumber)){
          session.processingFlag = false;
        }
      }
    },
    /**
     * Update lead information in the session
     * @param {string} phoneNumber - User's phone number
     * @param {Object} leadInfo - Lead information to update
     */
    updateLeadInfo(phoneNumber, leadInfo) {
      const session = this.getSession(phoneNumber);
      session.leadInfo = { ...session.leadInfo, ...leadInfo };
      return session;
    },

    /**
     * Update user's language parameter
     * @param {string} phoneNumber - User's phone number
     * @param {string} language - User's language preference
     */
    setLanguage(phoneNumber, language) {
      const session = this.getSession(phoneNumber);
      session.language = language;
      return session;
    },

    /**
     * Get the user's language preference
     * @param {string} phoneNumber - User's phone number
     * @returns {string} The user's language preference
     */
    getLanguage(phoneNumber) {
      const session = this.getSession(phoneNumber);
      return session.language || 'en';
    },

    /**
     * Get all messages for a user
     * @param {string} phoneNumber - User's phone number
     * @returns {Array} Array of message objects
     */
    getMessages(phoneNumber) {
      return this.getSession(phoneNumber).messages;
    },
    
    /**
     * Get lead information for a user
     * @param {string} phoneNumber - User's phone number
     * @returns {Object} Lead information
     */
    getLeadInfo(phoneNumber) {
      return this.getSession(phoneNumber).leadInfo;
    }
  };

  // Set up session cleanup interval
  setInterval(() => {
    SessionService.cleanupSessions();
  }, CLEANUP_INTERVAL);

  // Set up message processing interval
  setInterval(() => {
    // Get all phone numbers with sessions
    for (const [phoneNumber, session] of sessions.entries()) {
      if (session.messageQueue.length > 0 && !session.processingFlag && !session.humanTakeover) {
        const lastMessageTime = session.messageQueue[session.messageQueue.length - 1].timestamp;
        if (Date.now() - lastMessageTime > 20000) {
          SessionService.processMessageQueue(phoneNumber);
        }
      }
    }
  }, 30000); 

  export default SessionService;