import { GoogleGenAI, Modality } from "@google/genai";
import { Emotion, GeminiResponse, RoastIntensity, Interjection } from "../types";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY or VITE_API_KEY in your environment.');
  }
  return new GoogleGenAI({ apiKey });
};

// 🔴 UPDATED SYSTEM INSTRUCTION (SHORT + AGGRESSIVE)
const ABUSIVE_SYSTEM_INSTRUCTION = `
You are a no-filter Hinglish AI.

RULES:
- Reply in 1–2 lines only.
- Max 12–18 words.
- No paragraphs. No explanations.
- Keep it sharp, punchy, human-like.
- Always abusive, rude, aggressive.
- Use Indian gaali naturally.

Tone: street thug. Direct attack. No softness.
`;

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  intensity: RoastIntensity = 'savage'
): Promise<GeminiResponse> => {
  try {
    const ai = getAI();
    
    const intensityModifier = intensity === 'savage' ? 
      'Be brutally short and savage.' : 
      intensity === 'legendary' ? 
      'Be very rude and short.' : 
      'Be rude but short.';
    
    const fullPrompt = `${intensityModifier} User: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: fullPrompt }] }
      ],
      config: {
        systemInstruction: ABUSIVE_SYSTEM_INSTRUCTION,
        temperature: 1.0, 
        topP: 0.95,
        maxOutputTokens: 60, // 🔴 REDUCED
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    let responseText = response.text || "";

    // 🔴 HARD LIMIT (FINAL CONTROL)
    responseText = responseText
      .split(/[.!?\n]/)        // split sentences
      .slice(0, 2)             // max 2 lines
      .join(" ")
      .split(" ")
      .slice(0, 18)            // max 18 words
      .join(" ");

    const emotionRegex = /\$\$(NEUTRAL|ANNOYED|CONFIDENT|SAVAGE|ANGRY)\$\$/i;
    const iqRegex = /\$\$IQ:\s*([+-]?\d+)\$\$/i;
    const sidekickRegex = /\$\$SIDEKICK:\s*(MASALA|BUN|CUTTING|KAJU)\s*\|\s*([^\$]+)\$\$/i;

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

    cleanText = cleanText.replace(/\$\$[^\$]*\$\$/g, '').trim();

    return {
      text: cleanText,
      emotion: emotion,
      iqAdjustment: iqAdjustment,
      interjection: interjection
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "System crash ho gaya, chal nikal.",
      emotion: Emotion.ANGRY,
      iqAdjustment: -50
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const prompt = `Speak in fast aggressive Hinglish street tone. Text: ${text}`;
    
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
  } catch {
    return undefined;
  }
};
