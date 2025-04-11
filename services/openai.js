import OpenAI from "openai";
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { getMessage } from '../utils/messages.js';
import SessionService from './session.js';
import { saveLeadToAirtable } from './airtable.js';
import { sendMessage } from './twilio.js';
import sms from '../utils/sms.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * OpenAI service for processing messages
 */
export const OpenAIService = {
  /**
   * Process a user message and generate a response
   * @param {string} phoneNumber - User's phone number
   * @param {string} userMessage - User's message content
   * @returns {string} Assistant's response message
   */
  async processMessage(phoneNumber, userMessage) {
    try {
      // Add user message to session
      SessionService.addMessage(phoneNumber, {
        role: 'user',
        content: userMessage
      });
      
      // Get all messages for this user
      const messages = SessionService.getMessages(phoneNumber);
    
      logger.info(`Sending ${messages.length} messages to OpenAI for user ${phoneNumber}`);
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        tools: config.openai.tools,
        tool_choice: 'auto',
        temperature: config.openai.temperature
      });
      
      // Get the assistant's response
      const finishReason = response.choices[0].finish_reason;
      const responseMessage = response.choices[0].message;
      
      // Check if the model called a function
      if (finishReason === 'tool_calls' && responseMessage.tool_calls) {
        const toolCall = responseMessage.tool_calls[0];
        const toolName = toolCall.function.name;
        
        // Add the assistant message with tool_calls to history
        SessionService.addMessage(phoneNumber, responseMessage);
        
        SessionService.startToolCall(phoneNumber, toolCall.id);
        
        if (toolName === 'setUserLanguage') {
          const args = JSON.parse(toolCall.function.arguments);
          SessionService.setLanguage(phoneNumber, args.language);
          
          SessionService.addMessage(phoneNumber, {
            role: 'tool',
            name: 'setUserLanguage',
            content: JSON.stringify({ success: true, language: args.language }),
            tool_call_id: toolCall.id  
          });
          
          logger.info(`Language preference set to ${args.language}`);
          
          // Process the original message again with updated language setting
          SessionService.completeToolCall(phoneNumber);
          return this.processMessage(phoneNumber, userMessage);
        }
        
        if (toolName === 'saveLeadToAirtable') {
          const userLanguage = SessionService.getLanguage(phoneNumber);
          try {
            // Parse function arguments from the model
            const args = JSON.parse(toolCall.function.arguments);
            
            // Add phone number from the session
            args.phone = args.phone || phoneNumber;
            // Add the original WhatsApp number to look up media files
            args.whatsappNumber = phoneNumber;
            // Update lead info in session
            SessionService.updateLeadInfo(phoneNumber, args);
            
            // Call Airtable service to save the lead
            const result = await saveLeadToAirtable(args);
            
            SessionService.addMessage(phoneNumber, {
              role: 'tool',
              name: 'saveLeadToAirtable',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            });
            
            logger.info(`Lead saved for ${phoneNumber}: ${JSON.stringify(result)}`);
            SessionService.completeToolCall(phoneNumber);
            if (result.success){
              return responseMessage.content || getMessage(userLanguage, 'success', 'leadSaved');
            }
            else {
              // Already handled in airtable.js with SMS notification
              return responseMessage.content || getMessage(userLanguage, 'errors', 'savingLead');
            }
          } catch (error) {
            // Even on error, provide a tool response
            SessionService.addMessage(phoneNumber, {
              role: 'tool',
              name: 'saveLeadToAirtable',
              content: JSON.stringify({ success: false, error: error.message }),
              tool_call_id: toolCall.id
            });
            
            logger.error(`Error saving lead to Airtable: ${error}`);
            
            // Send SMS notification about the saveLeadToAirtable function error
            try {
              const leadInfo = SessionService.getLeadInfo(phoneNumber);
              const leadName = leadInfo.name || "Unknown";
              await sendMessage(`${sms.error}: Failed to save lead for ${leadName} (${phoneNumber}) - ${error.message}`, phoneNumber);
            } catch (smsError) {
              logger.error(`Failed to send SMS notification: ${smsError.message}`);
            }
            
            SessionService.completeToolCall(phoneNumber);
            return getMessage(userLanguage, 'errors', 'savingLead');
          }
        }
      } else {
        // Normal text response, add to session
        SessionService.addMessage(phoneNumber, {
          role: 'assistant',
          content: responseMessage.content
        });
        
        return responseMessage.content;
      }
    } catch (error) {
      logger.error(`Error processing message with OpenAI: ${error}`);
      
      // Send SMS notification about OpenAI API error
      try {
        await sendMessage(`${sms.systemError.replace('{errorDetails}', 'OpenAI API')}: Error processing message for ${phoneNumber} - ${error.message}`, phoneNumber);
      } catch (smsError) {
        logger.error(`Failed to send SMS notification: ${smsError.message}`);
      }
      
      const userLanguage = SessionService.getLanguage(phoneNumber);
      return getMessage(userLanguage, 'errors', 'general');
    }
  },
};

export default OpenAIService;