import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. Ensure the 'API_KEY' environment variable is set in your deployment settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeContent = async (text: string, images: string[]): Promise<StoryboardData> => {
  const ai = getAIClient();
  
  const prompt = `Analyze the following book content (text and/or images) and break it down into 4 distinct, sequential storyboard scenes that illustrate the key moments or big ideas. 
  For each scene, provide:
  1. A short, descriptive title.
  2. A brief educational description of what is happening.
  3. A detailed visual prompt for an image generator. The visual prompts should be vivid, descriptive, and ensure a consistent illustrative style (e.g., "colorful digital storybook illustration style, clean lines, educational and child-friendly") while clearly depicting the unique event of that specific scene.
  
  Ensure the scenes progress logically through the content and characters remain consistent.`;

  const parts: any[] = [{ text: prompt }];
  if (text) parts.push({ text: `Content Text: ${text}` });
  
  images.forEach((imgBase64) => {
    const split = imgBase64.split(',');
    if (split.length < 2) return;
    const data = split[1];
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
    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from analysis model.");
    return JSON.parse(responseText.trim()) as StoryboardData;
  } catch (e) {
    console.error("Failed to parse analysis result:", e);
    throw new Error("Failed to interpret content analysis. The model might have returned an invalid format.");
  }
};

export const generateSceneImage = async (prompt: string, previousImageUrl?: string): Promise<string> => {
  const ai = getAIClient();
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
        text: `Reference the characters and art style from the provided image. Now generate a NEW image for this specific scene: ${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }
  } else {
    parts.push({ text: prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("The image generation model returned no content.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    // Handle cases where the model returns text instead (e.g., safety block)
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Model returned a text response instead of an image: ${textPart.text}`);
    }

    throw new Error("No image data found in the AI response.");
  } catch (err: any) {
    console.error("Image generation failed:", err);
    throw err;
  }
};