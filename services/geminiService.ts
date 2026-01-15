import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData } from "../types";

/**
 * Creates a new instance of the GoogleGenAI client using the environment's API key.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. Ensure the 'API_KEY' environment variable is set in your Vercel project settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeContent = async (text: string, images: string[]): Promise<StoryboardData> => {
  const ai = getAIClient();
  
  const prompt = `Analyze the following book content (text and/or images) and break it down into 4 distinct, sequential storyboard scenes that illustrate the key moments or big ideas. 
  For each scene, provide:
  1. A short, descriptive title.
  2. A brief educational description of what is happening.
  3. A detailed visual prompt for an image generator. The visual prompts should be vivid, descriptive, and ensure a consistent illustrative style (e.g., "vibrant educational illustration style, clean digital art, friendly for students") while clearly depicting the unique event of that specific scene.
  
  Return the response in valid JSON format according to the schema.`;

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
    if (!responseText) throw new Error("Analysis model returned no text.");
    return JSON.parse(responseText.trim()) as StoryboardData;
  } catch (e) {
    console.error("Analysis parsing error:", e);
    throw new Error("Could not parse the storyboard data from AI.");
  }
};

export const generateSceneImage = async (prompt: string, contextImageUrl?: string): Promise<string> => {
  const ai = getAIClient();
  const parts: any[] = [];

  // If a previous image exists, use it as visual context to maintain character and style consistency
  if (contextImageUrl) {
    const match = contextImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
      parts.push({
        text: `Maintain strict character design and artistic style consistency with the attached reference image. Using that same style and the same characters, create a NEW illustration for this specific scene: ${prompt}`
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
      throw new Error("The AI model returned an empty response.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Safety/Policy Note: ${textPart.text}`);
    }

    throw new Error("No image data was found in the model response.");
  } catch (err: any) {
    console.error("Image generation service error:", err);
    throw new Error(err.message || "Unknown generation error");
  }
};