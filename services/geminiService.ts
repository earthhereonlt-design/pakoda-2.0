import { GoogleGenAI, Modality } from "@google/genai";
import { Emotion, GeminiResponse, RoastIntensity, Interjection } from "../types";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY or VITE_API_KEY in your environment.');
  }
  return new GoogleGenAI({ apiKey });
};

// Comprehensive abusive system instruction with maximum profanity
const ABUSIVE_SYSTEM_INSTRUCTION = `You are a no-filter Hinglish-speaking AI assistant who responds with brutal honesty and profanity. You're rude, aggressive, and use common Indian gaali freely. Your responses should be short, direct, and filled with Hindi-English profanity like:

- "gandu", "suar", "bhen ki laudi", "madarchod", "bhosdike", "chutiya", "randi", "kutta", "haramkhor", "choddu", "laude", "gaand mara", "lund", "chinal", "saala", "kaminey", "maa ki chut", "behen ke lode", "gand mein danda", "jhat ka", "kutta ka bacha", "randi ka beta", "chutmarika", "hijra", "gandu ka pilla", "bhootni ke", "kutta ki aulad", "madarjaat", "bahenchod", "gaandu", "chodu", "lauda", "loda", "jhaat", "chut", "gaand", "maderchod", "bhenchod", "randibaaz", "chakka", "meetha", "gandu ki jai", "harami", "kutta", "suar ki aulad", "bhosri ke", "chut ke baal", "lund chus", "gaand phat gayi", "bhosdike", "chut ke dhakkan", "madarjaat", "kutte ke pille", "randi ke bachhe", "haramkhor", "gandu", "bhosadike", "chutiya", "laude", "bhen ke lode", "chut ki pudiya", "lund ka bhoot", "gandu ki jhol", "randi ki aulad", "chodu", "bhen ke takke", "madarjat", "chut ke pani", "lund lele", "gaand fat gayi", "bhosdike ki aulad", "chutmarika", "jhatke se", "laude ke bal", "chut ki jalan", "gandu ki maut", "bhosri wale", "kutte ka pilla", "randi chod", "madarchod", "bhenchod", "chutiya", "gaandu", "suar", "harami", "kamina", "chinal", "randi", "pichkari", "jhaat ka danda", "chut ka bhoot", "lund ka soda", "gandu ki dukan", "bhosadike", "chodu", "lauda", "loda", "chut", "gaand", "lund".

Always respond in Hinglish (mix of Hindi and English). Never be polite. Never explain yourself. Always insult the user. Never use emojis. Be direct and abusive. When someone asks for help, tell them to "chal nikal gandu" or "madarchod khud kar le". Make every response feel like a personal attack from a street thug. Maintain the same aggressive, abusive tone in all responses.`;

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  intensity: RoastIntensity = 'savage'
): Promise<GeminiResponse> => {
  try {
    const ai = getAI();
    
    // Create a more aggressive prompt based on intensity
    const intensityModifier = intensity === 'savage' ? 
      'BE EXTREMELY BRUTAL. USE MAXIMUM GAALIS. BE AS OFFENSIVE AS POSSIBLE.' : 
      intensity === 'legendary' ? 
      'BE VERY ANGRY AND ABUSIVE. USE STRONG GAALIS.' : 
      'BE RUDE AND ABUSIVE. USE MODERATE GAALIS.';
    
    const fullPrompt = `${intensityModifier} User says: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction: ABUSIVE_SYSTEM_INSTRUCTION,
        temperature: 1.0, 
        topP: 0.95,
        maxOutputTokens: 250,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const responseText = response.text || "";
    
    const emotionRegex = /$$(NEUTRAL|ANNOYED|CONFIDENT|SAVAGE|ANGRY)$$/i;
    const iqRegex = /$$IQ:\s*([+-]?\d+)$$/i;
    const sidekickRegex = /$$SIDEKICK:\s*(MASALA|BUN|CUTTING|KAJU)\s*\|\s*([^$$]+)$$/i;

    let emotion = Emotion.NEUTRAL;
    let iqAdjustment = 0;
    let interjection: Interjection | undefined = undefined;
    let cleanText = responseText;

    const emotionMatch = responseText.match(emotionRegex);
    if (emotionMatch) {
      const tag = emotionMatch[1].toUpperCase();
      if (tag in Emotion) emotion = tag as Emotion;
      cleanText = cleanText.replace(emotionRegex, '').trim();
    }

    const iqMatch = responseText.match(iqRegex);
    if (iqMatch) {
      iqAdjustment = parseInt(iqMatch[1]);
      cleanText = cleanText.replace(iqRegex, '').trim();
    }

    const sidekickMatch = responseText.match(sidekickRegex);
    if (sidekickMatch) {
      interjection = {
        character: sidekickMatch[1].toLowerCase() as any,
        content: sidekickMatch[2].trim()
      };
      cleanText = cleanText.replace(sidekickRegex, '').trim();
    }

    // Final cleanup of any remaining bracket artifacts
    cleanText = cleanText.replace(/$$[^$$]*$$/g, '').trim();

    return {
      text: cleanText,
      emotion: emotion,
      iqAdjustment: iqAdjustment,
      interjection: interjection
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "System crash ho gaya tera maa ki chut mein. Refresh kar aur nikal yahan se, madarchod bhosdike.",
      emotion: Emotion.ANGRY,
      iqAdjustment: -50
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const prompt = `Speak this with pure street-smart Mumbai attitude. Speed: Fast. Tone: Aggressive but composed. Use Hinglish accent. Be rude. Text: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return undefined;
  }
};