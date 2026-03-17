import { GoogleGenAI, Type } from '@google/genai';
import { Category, SubCategory, MannequinProfile, WardrobeItem, WARDROBE_CATEGORIES } from '../types';

let aiClient: GoogleGenAI | null = null;

async function getAiClient(): Promise<GoogleGenAI> {
  if (aiClient) return aiClient;

  // In development, Vite provides process.env.GEMINI_API_KEY via define.
  // In production (Cloud Run), Vite defines process.env.GEMINI_API_KEY as undefined
  // if it wasn't present at build time.
  const buildTimeKey = process.env.GEMINI_API_KEY;

  if (buildTimeKey) {
    aiClient = new GoogleGenAI({ apiKey: buildTimeKey });
    return aiClient;
  }

  // Fetch from the backend at runtime
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    if (data.geminiApiKey) {
      aiClient = new GoogleGenAI({ apiKey: data.geminiApiKey });
      return aiClient;
    }
  } catch (error) {
    console.error("Failed to fetch API key from backend:", error);
  }

  throw new Error("GEMINI_API_KEY is missing. It must be provided either at build time or via the /api/config endpoint.");
}
export async function analyzeClothingItem(base64Image: string, mimeType: string) {
  const ai = await getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Analyze this clothing item. Provide its category, subCategory, a short description, its primary color, and its style. 
          Valid categories and their subcategories are:
          ${JSON.stringify(WARDROBE_CATEGORIES, null, 2)}
          `,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: Object.keys(WARDROBE_CATEGORIES),
            description: 'The main category of the clothing item.',
          },
          subCategory: {
            type: Type.STRING,
            description: 'The sub-category of the clothing item. Must be a valid subcategory for the chosen main category.',
          },
          description: {
            type: Type.STRING,
            description: 'A short, concise description of the item in Turkish (e.g., "Siyah deri ceket").',
          },
          color: {
            type: Type.STRING,
            description: 'The primary color of the item in Turkish.',
          },
          style: {
            type: Type.STRING,
            description: 'The style of the item (e.g., Sportif, Klasik, Günlük, Şık) in Turkish.',
          },
        },
        required: ['category', 'subCategory', 'description', 'color', 'style'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to analyze image');

  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleanedText) as {
    category: Category;
    subCategory: SubCategory;
    description: string;
    color: string;
    style: string;
  };
}

export async function generateOutfitRecommendation(
  wardrobe: WardrobeItem[],
  profile: MannequinProfile,
  occasion: string
) {
  // Step 1: Select items and generate a prompt for the image model
  const wardrobeJson = JSON.stringify(
    wardrobe.map((item) => ({
      id: item.id,
      category: item.category,
      subCategory: item.subCategory,
      description: item.description,
      color: item.color,
      style: item.style,
    }))
  );

  const ai = await getAiClient();
  const selectionResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      You are an expert fashion stylist.
      Here is the user's wardrobe (JSON format):
      ${wardrobeJson}

      The user wants an outfit recommendation for the following occasion: "${occasion}".
      The user's profile is: ${profile.age} years old ${profile.gender}, ${profile.height}cm tall, ${profile.weight}kg, with ${profile.skinTone} skin tone.

      CRITICAL INSTRUCTION: You MUST ONLY select items that are explicitly listed in the user's wardrobe above. Do NOT suggest, add, or hallucinate any clothing items, shoes, or accessories that are not in the provided JSON list. If the wardrobe is missing shoes or pants, do not add them. ONLY use what is provided.

      Select the best combination of items from the wardrobe for this occasion.
      Then, write a highly detailed visual description (in English) of the user wearing this exact outfit. This description will be used as a prompt for an AI image generator.
      The prompt should describe a full-body shot of a fashion model matching the user's profile, wearing ONLY the selected clothes. Be extremely specific about the colors, fit, and style of the clothes based exactly on the wardrobe descriptions.
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          selectedItemIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The IDs of the selected wardrobe items.',
          },
          reasoning: {
            type: Type.STRING,
            description: 'A short explanation in Turkish of why this outfit was chosen from the user\'s wardrobe.',
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'The detailed English prompt for the image generator.',
          },
        },
        required: ['selectedItemIds', 'reasoning', 'imagePrompt'],
      },
    },
  });

  const selectionText = selectionResponse.text;
  if (!selectionText) throw new Error('Failed to generate outfit recommendation');

  const cleanedText = selectionText.replace(/```json/g, '').replace(/```/g, '').trim();

  const selection = JSON.parse(cleanedText) as {
    selectedItemIds: string[];
    reasoning: string;
    imagePrompt: string;
  };

  // Step 2: Generate the image using gemini-2.5-flash-image
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A highly realistic, full-body fashion photography shot. A ${profile.age}-year-old ${profile.gender === 'Kadın' ? 'woman' : profile.gender === 'Erkek' ? 'man' : 'person'} with ${profile.skinTone === 'Açık' ? 'light/fair' : profile.skinTone === 'Buğday' ? 'olive/medium' : profile.skinTone === 'Esmer' ? 'brown/dark' : 'dark/black'} skin tone, ${profile.height}cm tall, ${profile.weight}kg. They are wearing EXACTLY AND ONLY: ${selection.imagePrompt}. Do not add any extra clothing items, jackets, hats, or accessories unless explicitly mentioned. Professional studio lighting, clean background, 8k resolution, photorealistic.`,
        },
      ],
    },
  });

  let imageUrl = '';
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error('Failed to generate outfit image');

  return {
    itemIds: selection.selectedItemIds,
    description: selection.reasoning,
    imageUrl,
  };
}
