# WhatsApp AI Sales Pipeline

A robust Node.js application that creates an automated sales pipeline integrating WhatsApp Business API, OpenAI, and Airtable. This system allows businesses to handle pre-sales inquiries via WhatsApp, use AI to generate intelligent responses, and automatically collect and store lead information.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

## Features

- **Automated WhatsApp Conversations**: Handle incoming WhatsApp messages from potential clients with AI-generated responses
- **Intelligent Response Generation**: Use OpenAI to create contextual and helpful responses to pre-sales questions
- **Lead Information Collection**: Guide conversations to collect qualified lead information naturally
- **CRM Integration**: Automatically store lead data and conversation history in Airtable
- **Media Processing**: Handle and store media files (images, documents) via Cloudinary
- **Multilingual Support**: Built-in support for multiple languages with customizable error messages
- **System Monitoring**: SMS notifications to sales/support team for successful leads or system errors
- **Conversation Management**: Maintain context throughout conversations with efficient token management

## System Architecture

![System Architecture](https://via.placeholder.com/800x400?text=WhatsApp+AI+Sales+Pipeline+Architecture)

The application follows a clean, modular architecture:

- **Routes**: Handle API endpoints for the WhatsApp webhook
- **Controllers**: Process webhook requests and route them to appropriate services
- **Services**: Implement core business logic for message processing, AI interaction, and data storage
- **Configuration**: Centralize all settings and external service credentials
- **Utilities**: Provide helpers for logging, messaging, and notifications

## Prerequisites

- Node.js 16.0.0 or higher
- WhatsApp Business API account
- OpenAI API key
- Airtable account and API key
- Cloudinary account
- Twilio account (for SMS notifications)
- HTTPS endpoint for webhook (use ngrok for local development)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/whatsapp-ai-sales-pipeline.git
   cd whatsapp-ai-sales-pipeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server configuration
   PORT=3000
   NODE_ENV=development

   # WhatsApp Business API configuration
   WHATSAPP_VERIFY_TOKEN=your_verification_token
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

   # OpenAI configuration
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_MAX_TOKENS=100000
   OPENAI_TEMPERATURE=0.3

   # Airtable configuration
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id
   AIRTABLE_TABLE_ID=your_airtable_table_id

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_FOLDER=whatsapp-uploads

   # Twilio configuration (for notifications)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_FROM_NUMBER=your_twilio_phone_number
   TWILIO_NOTIFICATION_NUMBERS=number1,number2,number3
   ```

4. Create a `systemInstructions.txt` file in the root directory with your custom AI instructions. The repository includes a sample file with dummy instructions for testing purposes - you should replace these with your business-specific needs.

5. Start the application:
   ```bash
   npm start
   ```

6. For development with hot reload:
   ```bash
   npm run dev
   ```

## WhatsApp Business API Setup

1. Create a Meta Developer account and set up a WhatsApp Business API application
2. Configure your webhook URL to point to your server's `/webhook/whatsapp` endpoint
3. Use the verification token you specified in your `.env` file
4. Subscribe to the appropriate WhatsApp webhook events (messages, message_status)

## Customizing for Your Business

The system is designed to be easily customizable for different business types:

1. **System Instructions**: Modify the `systemInstructions.txt` file to define how the AI assistant should behave, what questions it should ask, and what information it should collect. The included file contains dummy instructions for a fictional furniture business that you can use as a template for your own business needs.

2. **Lead Information Fields**: Adjust the Airtable integration and lead collection fields in the OpenAI tools configuration to match your business requirements.

3. **Error Messages**: Customize the error messages in `utils/messages.js` to match your brand voice and add additional languages if needed.

4. **Notification Templates**: Update the SMS notification templates in `utils/sms.js` to provide the information your team needs.

## Project Structure

```
whatsapp-ai-sales-pipeline/
├── config/                # Configuration files
│   ├── airtable.js        # Airtable API configuration
│   ├── cloudinary.js      # Cloudinary configuration
│   ├── index.js           # Central configuration export
│   ├── openai.js          # OpenAI configuration
│   ├── twilio.js          # Twilio configuration
│   └── whatsapp.js        # WhatsApp API configuration
├── controllers/
│   └── whatsapp.js        # WhatsApp webhook controller
├── logs/                  # Log files (created at runtime)
├── routes/
│   └── meta.js            # Route definitions
├── services/
│   ├── airtable.js        # Airtable integration
│   ├── cloudinary.js      # Cloudinary media handling
│   ├── openai.js          # OpenAI integration
│   ├── session.js         # User session management
│   ├── twilio.js          # SMS notification service
│   └── whatsapp.js        # WhatsApp messaging service
├── utils/
│   ├── logger.js          # Logging utility
│   ├── messages.js        # Multilingual message templates
│   └── sms.js             # SMS notification templates
├── app.js                 # Express application setup
├── index.js               # Application entry point
├── systemInstructions.txt # AI system instructions
└── .env                   # Environment variables
```

## Airtable Structure

Set up your Airtable base with the following fields:

- `Name` (Single line text)
- `Phone` (Phone number)
- `Email` (Email)
- `Country` (Single line text)
- `Interest` (Single line text)
- `Notes` (Long text)
- `Date Created` (Date)
- `Attachments` (Attachment)

## Development and Testing

### Local Development with ngrok

To test the WhatsApp webhook locally:

1. Install ngrok: https://ngrok.com/download
2. Start your application: `npm run dev`
3. In a separate terminal, run: `ngrok http 3000`
4. Use the HTTPS URL provided by ngrok as your webhook URL in the WhatsApp Business API configuration

### Testing the Webhook

You can test the webhook verification with:

```bash
curl "https://your-ngrok-url.io/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=your_verification_token&hub.challenge=challenge_code"
```

## Deployment

For production deployment:

1. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start index.js --name whatsapp-ai-pipeline
   ```

2. Set up proper HTTPS with a valid SSL certificate

3. Implement monitoring and alerting beyond the basic SMS notifications

4. Consider moving session storage to a database (MongoDB, Redis, etc.) for persistence

## Limitations and Considerations

- The current implementation stores sessions in memory, which means they will be lost if the server restarts
- Processing large volumes of media files may require additional optimization
- Token management for very long conversations may need refinement
- Rate limiting for external APIs should be considered for high-volume deployments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any problems or have questions, please open an issue on GitHub.