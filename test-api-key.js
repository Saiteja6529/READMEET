import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ No API key found in environment variables');
  process.exit(1);
}

console.log('🔑 Testing API key:', apiKey);

// Test the API key by trying to initialize the Gemini service
try {
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log('✅ API key format is valid');
  
// Test the API key by making a simple request
  genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    systemInstruction: 'Test connection'
  }).then((model) => {
    console.log('✅ Successfully connected to Gemini AI service');
  }).catch((error) => {
    console.error('❌ Failed to connect to Gemini AI service:', error.message);
    if (error.message.includes('API key')) {
      console.error('⚠️ The API key may be invalid or expired');
    } else if (error.message.includes('quota')) {
      console.error('⚠️ API quota may be exceeded');
    } else if (error.message.includes('network')) {
      console.error('⚠️ Network connectivity issue');
    }
  });
  
} catch (error) {
  console.error('❌ Error initializing Gemini service:', error.message);
  if (error.message.includes('API key')) {
    console.error('⚠️ The API key may be invalid or expired');
  }
}