
import { GoogleGenAI } from "@google/genai";
import { NanoBananaModel } from "../types";

export class GeminiService {
  // Fix: Ensure fresh GoogleGenAI instance per call using process.env.API_KEY directly as per guidelines

  async generateLogo(): Promise<string | null> {
    try {
      // Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) right before calling
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image',
        contents: {
          parts: [{
            text: "Create a professional, minimalist, high-tech app logo for a photo editor called 'ZEditor PRO'. The logo should feature a sleek, modern 'Z' combined with a camera lens element. Style: Samsung OneUI 7 aesthetic, premium purple and silver gradients, clean vector look, high contrast, centered on a neutral background."
          }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      // Fix: Iterate through parts to find image as per guidelines
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Logo generation error:", error);
      return null;
    }
  }

  async processImage(base64Image: string, prompt: string, modelType: NanoBananaModel = NanoBananaModel.PRO): Promise<string | null> {
    try {
      // Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) right before calling
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      // Mapping Nanobanana to Gemini models
      let modelId = 'gemini-3-pro-preview'; // Default PRO (Branded as Gemini 3.0 Pro)
      if (modelType === NanoBananaModel.FAST) modelId = 'gemini-3-flash-preview';
      if (modelType === NanoBananaModel.FAST_3) modelId = 'gemini-3-flash-preview';
      if (modelType === NanoBananaModel.ULTRA) modelId = 'gemini-2.0-flash-exp';

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: 'image/png',
              },
            },
            {
              text: `You are the high-end Nanobanana ${modelType.toUpperCase()} Engine (Powered by Gemini ${modelType === NanoBananaModel.PRO ? '3.0 Pro' : modelType === NanoBananaModel.FAST_3 ? '3.0 Fast' : 'Neural'}) inside ZEditor PRO. 
              TASK: Modify the provided image based on this request: "${prompt}".
              
              QUALITY GUIDELINES:
              - Maintain the original resolution and artistic integrity where possible.
              - If the user asks to remove background, replace it with a clean alpha channel or professional studio background.
              - If the user asks to add elements, integrate them with perfect lighting and shadows.
              - Apply professional color grading if requested.
              - Return ONLY the modified image data (inlineData).
              
              IDENTITY: Professional, precise, and visually stunning. Mode: ${modelType}. Engine: ${modelType === NanoBananaModel.PRO ? 'Gemini 3.0 Pro' : modelType === NanoBananaModel.FAST_3 ? 'Gemini 3.0 Fast' : 'GenAI Neural'}.`,
            },
          ],
        },
      });

      // Fix: Iterate through parts to find image as per guidelines
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Nanobanana processing error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
