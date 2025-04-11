import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let systemInstructions = '';
try {
    systemInstructions = fs.readFileSync(path.join(__dirname, '..', 'systemInstructions.txt'), 'utf-8');
} catch (error) {
    systemInstructions = `You are a helpful assistant for a business. 
    Your main goal is to help potential clients learn about our services, 
    answer their questions, and collect contact information when they show interest.`;
    console.warn('systemInstructions.txt not found, using default instructions');
}

export default {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '100000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    systemInstructions: systemInstructions,
    tools: [{
        type: "function",
        function: {
          name: "setUserLanguage",
          description: "Sets the user's language preference based on their selection",
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                enum: ["en", "de"],
                description: "The language code selected by the user (en for English, de for German)"
              }
            },
            required: ["language"]
          }
        }
      },
      {
      type: 'function',
      function: {
        name: 'saveLeadToAirtable',
        description: 'Saves a lead to the Airtable CRM tool using the API.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The full name of the potential client or lead'
            },
            phone: {
              type: 'string',
              description: 'The phone number of the lead'
            },
            email: {
              type: 'string',
              description: 'Email address of the lead (optional)'
            },
            country: {
              type: 'string',
              description: 'The country where the lead resides'
            },
            interest: {
              type: 'string',
              description: 'Service or product the lead is interested in (optional)'
            },
            notes: {
              type: 'string',
              description: 'Additional notes or comments from the conversation'
            },
            mediaPaths: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'An array of file paths (images/videos) that need to be uploaded'
            }
          },
          required: ['name', 'phone']
        }
      }
    }]
  };