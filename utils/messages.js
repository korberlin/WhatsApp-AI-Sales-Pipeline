/**
 * Error message templates in case of an error
 */

const messages = {
  en: {
    errors: {
      general: "Sorry about that! I'm having some connection issues on my end. Could you please try again in a moment?",
      savingLead: "I couldn't save your information properly - our system seems to be having a temporary issue. Let me try again later.",
      mediaProcessing: "I'm having trouble viewing the photo you sent. Could you please try sending it again? Sometimes our connection can be a bit slow."
    },
    success: {
      leadSaved: "Perfect! I've saved all your details and our team will be reaching out to you soon. Is there anything else you'd like to know in the meantime?",
      nontext: "Thank you for your media, I will check it out as soon as possible.",
    }
  },
  de: {
    errors: {
      general: "Entschuldigung, ich habe gerade Verbindungsprobleme. Könnten Sie es bitte in einem Moment noch einmal versuchen?",
      savingLead: "Ich konnte Ihre Informationen nicht speichern - unser System scheint ein vorübergehendes Problem zu haben. Ich werde es später erneut versuchen.",
      mediaProcessing: "Ich habe Probleme, das von Ihnen gesendete Foto anzuzeigen. Könnten Sie es bitte erneut senden? Manchmal kann unsere Verbindung etwas langsam sein."
    },
    success: {
      leadSaved: "Perfekt! Ich habe alle Ihre Daten gespeichert und unser Team wird sich in Kürze bei Ihnen melden. Gibt es in der Zwischenzeit noch etwas, das Sie wissen möchten?",
      nontext: "Vielen Dank für Ihre Nachricht. Ich werde sie so schnell wie möglich überprüfen und mich bei Ihnen melden.",
    }
  }
};

// Helper function to get a message
export const getMessage = (language, category, key) => {
  if (!messages[language])
    language = 'en';
  return messages[language]?.[category]?.[key] || messages['en'][category][key];
}

export default messages;