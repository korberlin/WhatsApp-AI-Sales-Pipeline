import twilio from 'twilio';
import logger from '../utils/logger.js'
import config from '../config/index.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send SMS notification to configured numbers
 * @param {string} message - Message content
 * @param {string} number - Lead's phone number to include in the message
 * @returns {Promise<Object>} Result of the SMS operation
 */
export async function sendMessage(message, number) {
    const results = [];
    let hasError = false;
    
    try {
        for (const to of config.twilio.numbers) {
            try {
                const response = await client.messages.create({
                    body: `${message}, Lead phone number: ${number}`,
                    from: config.twilio.from,
                    to: to
                });
                logger.info(`SMS successfully sent to ${to} (SID: ${response.sid})`);
                results.push({to, success: true, sid: response.sid});
            } catch (individualError) {
                hasError = true;
                logger.error(`Failed to send SMS to ${to}: ${individualError.message}`);
                results.push({to, success: false, error: individualError.message });
            }
            
            // Add delay between messages to avoid rate limits, but only if not the last message
            if (config.twilio.numbers.indexOf(to) < config.twilio.numbers.length - 1) {
                await delay(2000);
            }
        }
        
        return {
            success: !hasError,
            results: results
        };
    } catch(error) {
        logger.error(`SMS sending process failed: ${error.message}`);
        return {success: false, error: error.message };
    }
}

export default { sendMessage };