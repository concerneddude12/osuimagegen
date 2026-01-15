
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData } from "../types";

export const analyzeContent = async (text: string, images: string[]): Promise<StoryboardData> => {
  // Initialize AI client inside the function to ensure the latest environment variables are used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze the following book content (text and/or images) and break it down into 4 distinct, sequential storyboard scenes that illustrate the key moments or big ideas. 
  For each scene, provide:
  1. A short, descriptive title.
  2. A brief educational description of what is happening.
  3. A detailed visual prompt for an image generator. The visual prompts should be vivid, descriptive, and ensure a consistent illustrative style (e.g., "watercolor storybook style" or "clean modern educational illustration") while clearly depicting the unique event of that specific scene.
  
  Ensure the scenes progress logically through the content and characters remain consistent.`;

  const parts: any[] = [{ text: prompt }];
  if (text) parts.push({ text: `Content Text: ${text}` });
  
  images.forEach((imgBase64) => {
    const data = imgBase64.split(',')[1];
    const mimeType = imgBase64.split(';')[0].split(':')[1];
    parts.push({
      inlineData: {
        data,
        mimeType
      }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ["id", "title", "description", "visualPrompt"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result as StoryboardData;
  } catch (e) {
    console.error("Failed to parse analysis result", e);
    throw new Error("Failed to interpret content analysis.");
  }
};

export const generateSceneImage = async (prompt: string, previousImageUrl?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  if (previousImageUrl) {
    const match = previousImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
      parts.push({
        text: `Using the character designs, environment details, and artistic style from the provided image as a strict reference, generate a NEW image for the next scene in the story. Ensure the characters look identical in features and clothing. Scene to generate: ${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }
  } else {
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from generator.");
};
