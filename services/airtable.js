import axios from 'axios';
import SessionService from './session.js';
import config from '../config/index.js';
import WhatsAppService from './whatsapp.js';
import logger from '../utils/logger.js';
import { sendMessage } from './twilio.js';
import sms from '../utils/sms.js';
import { uploadBufferToCloudinary } from './cloudinary.js';

/**
 * Save a lead to Airtable
 * @param {Object} leadData - Lead information
 * @param {string} leadData.name - Lead's full name
 * @param {string} leadData.phone - Lead's phone number
 * @param {string} [leadData.email=''] - Lead's email (optional)
 * @param {string} [leadData.country=''] - Lead's country (optional)
 * @param {string} [leadData.interest=''] - Service/product interest (optional)
 * @param {string} [leadData.notes=''] - Additional notes (optional)
 * @param {string} [leadData.whatsappNumber] - WhatsApp number for media lookup
 * @returns {Promise<Object>} Result of the Airtable operation
 */
export async function saveLeadToAirtable({
  name,
  phone,
  email = "",
  country = "",
  interest = "",
  notes = "",
  whatsappNumber
}) {
  try {
    // Validate required fields
    if (!name || !phone) {
      logger.error('Missing required fields for Airtable lead');
      try {
        await sendMessage(`${sms.error} Missing required fields: name or phone`, phone);
      } catch (smsError) {
        logger.error(`Failed to send SMS notification: ${smsError.message}`);
      }
      return { 
        success: false, 
        error: "Lead Name and Phone are required fields." 
      };
    }
    
    const mediaLookUpNumber = whatsappNumber || phone;
    logger.info(`Saving lead to Airtable: ${name} (${phone}), media from WhatsApp number: ${mediaLookUpNumber}`);
    
    // Upload media files to Cloudinary if provided
    const mediaFiles = SessionService.getMediaFiles(mediaLookUpNumber);
    logger.info(`Found ${mediaFiles.length} media files for WhatsApp number ${mediaLookUpNumber}`);
    
    const uploadPromises = mediaFiles.map(async (media) => {
      try {
        const mediaBuffer = await WhatsAppService.downloadMedia(media.mediaId);
        const result = await uploadBufferToCloudinary(mediaBuffer, media.mimeType);
        return result.url;
      } catch (error) {
        logger.error(`Failed to process media ${media.mediaId}: ${error.message}`);
        try {
          await sendMessage(`${sms.apiFailure}: Media upload failed for lead ${name}`, phone);
        } catch (smsError) {
          logger.error(`Failed to send SMS notification: ${smsError.message}`);
        }
        return null;
      }
    });
    
    const uploadedMediaUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedMediaUrls.filter(url => url !== null);
    const attachments = validUrls.map(url => ({
      url: url
    }));
    
    logger.info(`Successfully uploaded ${validUrls.length} media files`);
    
    // Prepare data for Airtable
    const leadRecord = {
      records: [{
        fields: {
          "Name": name,
          "Phone": phone,
          "Email": email,
          "Country": country,
          "Interest": interest,
          "Notes": notes,
          "Date Created": new Date().toISOString().split("T")[0],
          "Attachments": attachments.length > 0 ? attachments : undefined
        }
      }]
    };
    
    // Send data to Airtable
    const response = await axios.post(
      `${config.airtable.baseUrl}/${config.airtable.baseId}/${config.airtable.tableId}`,
      leadRecord,
      {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logger.info(`Lead saved successfully with ID: ${response.data.records[0].id}`);
    SessionService.clearMediaFiles(mediaLookUpNumber);
    try {
      await sendMessage(`${sms.success} for  ${name} (${phone})`, phone);
    } catch (smsError) {
      logger.error(`Failed to send success SMS notification: ${smsError.message}`);
    }
    return {
      success: true,
      message: "Lead saved successfully",
      airtableResponse: response.data
    };
  } catch (error) {
    logger.error('Error saving lead to Airtable:', error);
        // Send detailed error notification
    try {
      await sendMessage(`Airtable error for lead ${name}: ${error.message}`, phone);
    } catch (smsError) {
      logger.error(`Failed to send error SMS notification: ${smsError.message}`);
    }
    return {
      success: false,
      error: error.response ? error.response.data : error.message
    };
  }
}

export default { saveLeadToAirtable };