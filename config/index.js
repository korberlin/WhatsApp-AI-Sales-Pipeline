// Central configuration file that exports all configs
import dotenv from 'dotenv';
import openaiConfig from './openai.js';
import whatsappConfig from './whatsapp.js';
import airtableConfig from './airtable.js';
import cloudinaryConfig from './cloudinary.js';
import twilioConfig from './twilio.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_ID',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'OPENAI_API_KEY',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_FROM_NUMBER',
  'TWILIO_NOTIFICATION_NUMBERS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: Environment variable ${envVar} is not set`);
  }
}

export default {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  openai: openaiConfig,
  whatsapp: whatsappConfig,
  airtable: airtableConfig,
  cloudinary: cloudinaryConfig,
  twilio: twilioConfig
};