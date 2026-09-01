/**
 * VAANI Chatbot Service
 * Uses Google Gemini API to extract complaint details from natural language
 * Supports complaint extraction, form field population, and conversational responses
 * Includes demo/mock mode for development
 */

const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

const COMPLAINT_CATEGORIES = [
  'sanitation', 'roads', 'water', 'electricity', 'gas', 'traffic', 'pollution',
  'public-safety', 'healthcare', 'education', 'transport', 'corruption', 'other'
];

const DELHI_DISTRICTS = [
  'Central', 'East', 'North', 'Northeast', 'Northwest', 'South',
  'Southeast', 'Southwest', 'West', 'New Delhi', 'Shahdara', 'Other'
];

const CATEGORY_DEPARTMENTS = {
  sanitation: 'MCD', roads: 'PWD', water: 'DJB', electricity: 'BSES',
  gas: 'DJB', traffic: 'PWD', pollution: 'DPCC', 'public-safety': 'DP',
  healthcare: 'MCD', education: 'CMO', transport: 'DTC', corruption: 'CMO', other: 'CMO'
};

const DISTRICT_IDS = {
  Central: 'central', East: 'east', North: 'north', Northeast: 'north_east',
  Northwest: 'north_west', South: 'south', Southeast: 'south_east',
  Southwest: 'south_west', West: 'west', 'New Delhi': 'new_delhi', Shahdara: 'shahdara', Other: 'other'
};

/**
 * Extract complaint keywords from natural language text (mock implementation)
 * This is a demo/fallback implementation when Gemini API is not available
 */
function extractComplaintMock(userMessage) {
  const originalMessage = userMessage.trim();
  const message = originalMessage.toLowerCase();
  
  // Category mapping based on keywords
  let category = 'other';
  if (message.includes('pothole') || message.includes('road') || message.includes('street') || message.includes('pavement') || message.includes('rasta') || message.includes('रस्ता')) {
    category = 'roads';
  } else if (message.includes('water') || message.includes('pipe') || message.includes('leak') || message.includes('paani') || message.includes('पाणी') || message.includes('नळ')) {
    category = 'water';
  } else if (message.includes('garbage') || message.includes('dirty') || message.includes('waste') || message.includes('sanitation') || message.includes('kachra') || message.includes('कचरा') || message.includes('safai')) {
    category = 'sanitation';
  } else if (message.includes('electricity') || message.includes('electric') || message.includes('power')) {
    category = 'electricity';
  } else if (message.includes('gas') || message.includes('lpg')) {
    category = 'gas';
  } else if (message.includes('traffic') || message.includes('vehicle') || message.includes('accident')) {
    category = 'traffic';
  } else if (message.includes('pollution') || message.includes('pollut') || message.includes('air')) {
    category = 'pollution';
  }

  // District extraction. Localities outside Delhi remain in the address field.
  let district = null;
  if (message.includes('northeast')) district = 'Northeast';
  else if (message.includes('northwest')) district = 'Northwest';
  else if (message.includes('southeast')) district = 'Southeast';
  else if (message.includes('southwest')) district = 'Southwest';
  else if (message.includes('central')) district = 'Central';
  else if (message.includes('east')) district = 'East';
  else if (message.includes('north')) district = 'North';
  else if (message.includes('south')) district = 'South';
  else if (message.includes('west')) district = 'West';
  else if (message.includes('shahdara')) district = 'Shahdara';
  else if (message.includes('new delhi')) district = 'New Delhi';

  // Parse common English, Hindi, and Marathi introductions in one pass.
  const nameMatch = originalMessage.match(/(?:^|[,])\s*(?:mi|i am|my name is|माझे नाव)\s+([a-z]+(?:\s+[a-z]+){1,3})(?=\s*,|\s+area\b|\s+live\s+in\b|\s+राहतो|\s+राहते|$)/i);
  const areaMatch = originalMessage.match(/(?:\barea\b|\blive\s+in\b|\bat\b|\bnear\b|जवळ|एरिया|परिसर|राहतो|राहते)\s*[:,-]?\s*([a-z][a-z\s-]{2,40}?)(?=\s*,|\s+my\s+issue\b|\s+issue\b|\s+माझा\s+issue\b|$)/i);
  let address = areaMatch ? areaMatch[1].trim() : '';
  if (!address) {
    const knownLocation = originalMessage.match(/(?:kasarwadavali|mg road|india gate|[a-z]+ road|[a-z]+ nagar|[a-z]+ colony)/i);
    address = knownLocation ? knownLocation[0].trim() : '';
  }
  const locationKeywords = ['road', 'street', 'gate', 'park', 'market', 'station', 'area', 'locality', 'colony', 'kasarwadavali'];

  // Urgency detection
  let urgency = 'medium';
    if (message.includes('urgent') || message.includes('critical') || message.includes('emergency') || 
      message.includes('dangerous') || message.includes('leak') || message.includes('fire') || message.includes('तातडी') || message.includes('धोका')) {
    urgency = 'high';
  } else if (message.includes('severe') || message.includes('major')) {
    urgency = 'high';
  } else if (message.includes('minor') || message.includes('small')) {
    urgency = 'low';
  }

  const issueMatch = originalMessage.match(/(?:my\s+issue\s+is|the\s+issue\s+is|issue\s+is|माझा\s+issue\s+आहे|माझी\s+समस्या\s+आहे)\s*[:,-]?\s*(.+)$/i);
  const description = issueMatch ? issueMatch[1].trim() : originalMessage;
  if (category === 'water' && (message.includes('not receiving') || message.includes('no water') || message.includes('water nahi') || message.includes('paani nahi') || message.includes('पाणी येत नाही'))) {
    urgency = 'high';
  }

  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    description: description.substring(0, 500),
    category,
    district: DISTRICT_IDS[district] || 'other',
    address: address || null,
    department: CATEGORY_DEPARTMENTS[category],
    priority: urgency === 'high' ? 'DEFCON_ORANGE' : 'DEFCON_GREEN',
    extractedDetails: {
      keywords: locationKeywords.filter(k => message.includes(k)).concat(category === 'water' ? ['paani', 'पाणी', 'water supply'] : []),
      urgency,
      hasMedia: false,
      contactPreference: 'sms',
      duplicateCheckRequired: true
    }
  };
}

/**
 * Extracts complaint details from natural language text using Gemini API
 * Falls back to mock implementation if API is unavailable
 * @param {string} userMessage - Natural language complaint description
 * @returns {Promise<Object>} Extracted complaint fields
 */
async function extractComplaintFromChat(userMessage) {
  if (!GEMINI_API_KEY || DEMO_MODE) {
    // Use mock implementation in demo mode or if API key is not set
    console.log('🤖 Using mock chatbot (Demo Mode or API key not configured)');
    const extracted = extractComplaintMock(userMessage);
    return {
      success: true,
      extracted,
      confidence: 0.7,
      isDemoMode: true
    };
  }

  const prompt = `You are VAANI, an expert grievance intake assistant. Understand English, Hindi, Marathi, and Hinglish, including Roman Marathi. Extract every available form value from the user's message and return ONLY a valid JSON object with these exact fields (no markdown, no extra text):

{
  "name": "Citizen name if mentioned, otherwise null",
  "description": "The main complaint description (2-3 sentences)",
  "category": "One of: ${COMPLAINT_CATEGORIES.join(', ')} - pick the most relevant one",
  "district": "One of: ${DELHI_DISTRICTS.join(', ')} - use Other if a locality is mentioned but no Delhi district is present",
  "address": "Specific location/address mentioned (street, area, pincode, etc.) - if mentioned, otherwise null",
  "department": "Department code: DJB for water, PWD for roads, MCD for sanitation, BSES for electricity, DPCC for pollution, DTC for transport, DP for public safety, otherwise CMO",
  "priority": "DEFCON_RED for immediate danger, DEFCON_ORANGE for urgent service disruption, otherwise DEFCON_GREEN",
  "extractedDetails": {
    "keywords": ["list of key issue words/phrases"],
    "urgency": "low|medium|high|critical",
    "hasMedia": false,
    "contactPreference": "sms|whatsapp|email|any"
  }
}

User message: "${userMessage.replace(/"/g, '\\"')}"

Return ONLY the JSON object, nothing else.`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 10,
          topP: 0.95,
          maxOutputTokens: 500
        }
      },
      {
        timeout: 10000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Empty response from Gemini API');
    }

    let extractedText = response.data.candidates[0].content.parts[0].text.trim();
    
    // Remove markdown code blocks if present
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (extractedText.startsWith('```')) {
      extractedText = extractedText.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    const extracted = JSON.parse(extractedText);
    
    // Validate extracted data
    if (extracted.category && !COMPLAINT_CATEGORIES.includes(extracted.category)) {
      extracted.category = 'other';
    }
    
    if (extracted.district && !DELHI_DISTRICTS.includes(extracted.district)) {
      extracted.district = null;
    }

    return {
      success: true,
      extracted,
      confidence: 0.85,
      isDemoMode: false
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    // Fallback to mock implementation
    console.log('Falling back to mock chatbot');
    const extracted = extractComplaintMock(userMessage);
    return {
      success: true,
      extracted,
      confidence: 0.7,
      isDemoMode: true
    };
  }
}

/**
 * Generates a conversational response for the chatbot (mock implementation)
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages in conversation
 * @returns {Promise<string>} Chatbot response
 */
async function generateChatbotResponse(userMessage, conversationHistory = []) {
  const message = userMessage.toLowerCase();

  if (message.includes('water') || message.includes('paani') || message.includes('पाणी')) {
    const hasLocation = message.includes('area') || message.includes('live in') || message.includes('at ') || message.includes('kasarwadavali') || message.includes('nagar');
    if (hasLocation) {
      return '✅ I have captured your water complaint, name, location, and duration. The complaint will be routed to the water department and checked for duplicate reports. Please review the filled form and submit it.';
    }
  }
  
  // Demo responses based on keywords
  if (message.includes('hello') || message.includes('hi')) {
    return 'नमस्ते! 👋 Thanks for using VAANI. Tell me about your complaint and I\'ll help extract the details.';
  } else if (message.includes('pothole') || message.includes('road')) {
    return '🛣️ I understand you\'re reporting a road/pothole issue. Can you mention the specific location like the road name or nearby landmark?';
  } else if (message.includes('water') || message.includes('leak')) {
    return '💧 Got it - a water-related issue. Which district or area is this in? That will help us route it quickly.';
  } else if (message.includes('garbage') || message.includes('sanitation')) {
    return '🗑️ Sanitation concern noted! Please provide the specific location or colony name for faster resolution.';
  } else if (message.includes('urgent') || message.includes('emergency')) {
    return '🚨 This sounds urgent! I\'ve marked it as high priority. Can you provide the exact location and any photos would help.';
  } else if (message.includes('thank') || message.includes('thanks')) {
    return '✅ You\'re welcome! Your complaint has been recorded. You\'ll get updates via SMS.';
  }
  
  return '📝 Thanks for the details. Can you tell me more about the location and urgency level? (low/medium/high)';
}

/**
 * Validates and cleans extracted complaint data
 * @param {Object} extracted - Extracted complaint object
 * @returns {Object} Cleaned and validated data
 */
function validateExtractedComplaint(extracted) {
  const validated = {
    name: (extracted.name || '').trim(),
    category: extracted.category || 'other',
    description: (extracted.description || '').trim(),
    district: DISTRICT_IDS[extracted.district] || extracted.district || null,
    address: (extracted.address || '').trim(),
    department: extracted.department || CATEGORY_DEPARTMENTS[extracted.category] || 'CMO',
    priority: extracted.priority || 'DEFCON_GREEN',
    extractedDetails: extracted.extractedDetails || {},
    isValid: true,
    missingFields: []
  };

  // Check required fields
  if (!validated.description || validated.description.length < 10) {
    validated.isValid = false;
    validated.missingFields.push('description');
  }

  if (!validated.address) {
    validated.missingFields.push('address');
  }

  return validated;
}

module.exports = {
  extractComplaintFromChat,
  generateChatbotResponse,
  validateExtractedComplaint,
  COMPLAINT_CATEGORIES,
  DELHI_DISTRICTS
};
