
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateImage = async (prompt: string, imageBase64?: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const parts: any[] = [];
    
    if (imageBase64) {
      const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";
      const base64Data = imageBase64.split(',')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const generateRecipe = async (dish: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Give me a detailed recipe for: ${dish}. Include ingredients, step-by-step instructions, and pro-tips.`,
    config: {
      systemInstruction: "You are a master chef. Provide clear, appetizing, and accurate recipes.",
    }
  });
  return response.text || "I couldn't find a recipe for that.";
};

export const askGeneralQuestion = async (
  question: string,
  imageBase64?: string,
  history: Array<{ role: string; parts: any[] }> = []
): Promise<string> => {
  const ai = getAI();
  const parts: any[] = [{ text: question }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(',')[1]
      }
    });
  }

  const contents = [...history, { role: "user", parts }];

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents,
    config: {
      systemInstruction: "You are MAZIC, a highly intelligent, helpful, and friendly AI assistant. Provide detailed, accurate, and well-formatted answers. Structure your responses logically and use markdown for readability."
    }
  });
  return response.text || "I don't have an answer for that right now.";
};

export const generateStory = async (topic: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: topic,
    config: {
      systemInstruction: "You are a creative storyteller. Write a compelling, immersive story based on the user's prompt. Use markdown for formatting.",
    }
  });
  return response.text || "I couldn't write a story this time.";
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following text to ${targetLanguage}: "${text}"`,
  });
  return response.text || "Translation failed.";
};

export const writeSummary = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the following text:\n\n${text}`,
    config: {
      systemInstruction: "You are an expert summarizer. Provide a concise, clear, and well-structured summary of the provided text. Highlight the main points and key takeaways.",
    }
  });
  return response.text || "I couldn't summarize that.";
};

export const makeCode = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an expert software engineer. Write clean, efficient, and well-documented code based on the user's request. Include explanations if necessary.",
    }
  });
  return response.text || "I couldn't generate the code.";
};
