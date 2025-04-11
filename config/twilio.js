    // Configuration for Twilio SMS service
    export default {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        numbers: process.env.TWILIO_NOTIFICATION_NUMBERS 
            ? process.env.TWILIO_NOTIFICATION_NUMBERS.split(',') 
            : [],
        from: process.env.TWILIO_FROM_NUMBER
    };