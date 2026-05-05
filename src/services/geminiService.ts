
import { GoogleGenAI, Type } from "@google/genai";
import { Article, ArticleType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function generateArticle(
  prompt: string,
  type: ArticleType,
  details: {
    name: string;
    flagDetails?: string;
    keyEvents?: string;
    capitals?: string;
    leaders?: string;
  }
): Promise<Partial<Article>> {
  const systemInstruction = `
    You are a professional historian and encyclopedia editor for an alternate history website.
    Your task is to generate a comprehensive, neutral, and academic Wikipedia-style article based on user input.
    The tone should be academic, objective, and detailed.
    Use Markdown for the content of sections.
    
    Article Type: ${type}
    
    Structure the response as JSON with:
    - title: String
    - summary: String (Introductory paragraph)
    - infobox: Array of objects {label, value} (Standard Wikipedia summary sidebar data). 
      - To add a section header in the infobox (e.g., "Belligerents" or "Commanders and leaders"), set label to "!HEADER!" and value to the header text.
      - To add a multi-column row (e.g., "Side 1 || Side 2"), set label to "!COLS!" and value to the column contents separated by " || ".
      - Regular rows just use standard label and value (e.g. {label: "Date", value: "2024"}).
    - sections: Array of objects {title, content} (Main content of the article)
    
    Ensure to include sections like "Historicity", "Legacy", and a "See also" list at the end.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      User Details:
      Name: ${details.name}
      Type: ${type}
      Additional Context: ${prompt}
      Specific info to include:
      ${details.flagDetails ? `- Flag/Heraldry details: ${details.flagDetails}` : ''}
      ${details.capitals ? `- Capitals/Locations: ${details.capitals}` : ''}
      ${details.leaders ? `- Leaders/Key Figures: ${details.leaders}` : ''}
      ${details.keyEvents ? `- Key Conflicts/Events: ${details.keyEvents} (Note: START: and END: markers indicate historical lifespan/timeline boundaries)` : ''}
      
      Generate a deep, immersive historical article for this ${type}.
    `,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          infobox: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ["label", "value"]
            }
          },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["title", "summary", "infobox", "sections"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Invalid AI response format");
  }
}

export async function generateArticleImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional, clean, minimalist emblem or flag for an alternate history encyclopedia. High quality, centered, symbolic. Subject: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "4:3",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
