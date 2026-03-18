import { GoogleGenAI, Type } from '@google/genai';
import { Category, SubCategory, MannequinProfile, WardrobeItem, WARDROBE_CATEGORIES } from '../types';

let aiClient: GoogleGenAI | null = null;

async function getAiClient(): Promise<GoogleGenAI> {
  if (aiClient) return aiClient;

  // In development, Vite provides process.env.GEMINI_API_KEY via define.
  // In production (Cloud Run), Vite defines process.env.GEMINI_API_KEY as undefined
  // if it wasn't present at build time.
  const buildTimeKey = process.env.GEMINI_API_KEY;

  if (buildTimeKey && buildTimeKey.length > 5 && !buildTimeKey.includes("BURAYA")) {
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
export async function analyzeClothingItem(base64Image: string | null, mimeType: string | null, wardrobe?: WardrobeItem[], itemUrl?: string) {
  const ai = await getAiClient();

  let wardrobeContext = '';
  if (wardrobe && wardrobe.length > 0) {
    const wardrobeJson = JSON.stringify(
      wardrobe.slice(0, 30).map((item) => ({
        id: item.id,
        description: item.description,
        category: item.category,
        subCategory: item.subCategory,
        color: item.color,
        style: item.style,
      }))
    );
    wardrobeContext = `
    Ayrıca kullanıcının mevcut dolabı aşağıdadır:
    ${wardrobeJson}
    
    Lütfen yeni ürünün kullanıcının dolabındaki diğer ürünlerle nasıl kombinlenebileceğine dair 2-3 adet çok kısa, vurucu ve moda odaklı kombin fikri (Instant Matches) öner.
    Önerilen kombinler "quickMatches" adlı bir dizide döndürülmelidir (her biri itemIds ve explanation içerir).
    KURALLAR:
    1. Sadece kullanıcının dolabında (yukarıdaki wardrobeJson içindeki id'ler) olan ürünleri kullan.
    2. Dil Türkçe olsun.
    3. Her kombin önerisi için seçtiğin parçaların ID'lerini ve neden uyumlu olduklarına dair tek cümlelik bir açıklama yaz.
    `;
  }

  const parts: any[] = [];
  
  if (base64Image && mimeType) {
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    });
  }

  parts.push({
    text: `Analyze the clothing item.
    ${itemUrl ? `The user provided the following product URL: ${itemUrl}` : ''}

    CRITICAL INSTRUCTION: If an image is provided, analyze the clothing in the image. 
    However, if the image is clearly an ERROR PAGE, a 404 message, a cookie consent banner, just text, or a brand logo, YOU MUST IGNORE THE IMAGE. 
    Instead, rely on the itemUrl (if provided) and extract the clothing details (name, color, category) from the URL text itself (e.g., 'mavi-jean-pantolon' -> blue jeans).
    If no image is provided, also deduce the details from the URL.

    Provide its category, subCategory, a short description, its primary color, and its style in Turkish. 
    Also, write "stylingAdvice" - a detailed Turkish styling suggestion describing what other items from a wardrobe 
    (like which colors, patterns, or types of pants/shirts/shoes) would pair beautifully with this item.

    You must also return:
    - isFallback (boolean): Set to true if you had to guess the item from the URL or if the image was broken/invalid.
    - imagePrompt (string): A highly detailed English prompt to generate a photorealistic studio photo of this EXACT clothing item (as deduced) standalone on a clean white background. Do not describe a model wearing it, just the item.
    
    ${wardrobeContext}
    
    Valid categories and their subcategories are:
    ${JSON.stringify(WARDROBE_CATEGORIES, null, 2)}
    `,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: parts,
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
          stylingAdvice: {
            type: Type.STRING,
            description: 'Detailed Turkish styling advice for this item.',
          },
          isFallback: {
            type: Type.BOOLEAN,
            description: 'Set to true if the image was ignored/invalid and you deduced the item from the URL.',
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'English prompt for an AI image generator to create a picture of this clothing item.',
          },
          quickMatches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
              },
              required: ['itemIds', 'explanation'],
            },
          },
        },
        required: ['category', 'subCategory', 'description', 'color', 'style', 'stylingAdvice', 'isFallback', 'imagePrompt'],
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
    stylingAdvice: string;
    isFallback: boolean;
    imagePrompt: string;
    quickMatches?: { itemIds: string[]; explanation: string }[];
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
    model: 'gemini-2.5-pro',
    contents: `
      You are an expert fashion stylist.
      Here is the user's wardrobe (JSON format):
      ${wardrobeJson}

      The user wants an outfit recommendation for the following occasion: "${occasion}".
      The user's profile is: ${profile.age} years old ${profile.gender}, ${profile.height}cm tall, ${profile.weight}kg, with ${profile.skinTone} skin tone.

      CRITICAL INSTRUCTION: You MUST ONLY select items that are explicitly listed in the user's wardrobe above. Do NOT suggest, add, or hallucinate any clothing items, shoes, or accessories that are not in the provided JSON list. If the wardrobe is missing shoes or pants, do not add them. ONLY use what is provided.
      The recommendation should be perfectly consistent with the items provided.

      Select the best combination of items from the wardrobe for this occasion.
      Then, write a highly detailed visual description (in English) of the user wearing this exact outfit. This description will be used as a prompt for an AI image generator.
      The prompt should describe a full-body shot of a fashion model matching the user's profile, wearing ONLY the selected clothes. Be extremely specific about the colors, fit, and style of the clothes based exactly on the wardrobe descriptions.
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          selectedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                reasoning: { type: Type.STRING, description: 'Turkish explanation.' },
                imagePrompt: { type: Type.STRING, description: 'English image prompt.' }
              },
              required: ['ids', 'reasoning', 'imagePrompt']
            },
            description: 'Provide 3 alternative different outfit variations if possible, each with different styles (e.g., more formal vs more casual) for the same occasion.'
          }
        },
        required: ['selectedItems'],
      },
    },
  });

  const selectionText = selectionResponse.text;
  if (!selectionText) throw new Error('Failed to generate outfit recommendation');

  const cleanedText = selectionText.replace(/```json/g, '').replace(/```/g, '').trim();

  const selection = JSON.parse(cleanedText) as {
    selectedItems: { ids: string[]; reasoning: string; imagePrompt: string }[];
  };

  // Process the first suggestion for now to maintain compatibility with existing types, 
  // or return all if needed. User asked for "different different combinations".
  // We'll return an array of results.

  const results = await Promise.all(selection.selectedItems.map(async (option) => {
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `A highly realistic, full-body fashion photography shot. A ${profile.age}-year-old ${profile.gender === 'Kadın' ? 'woman' : profile.gender === 'Erkek' ? 'man' : 'person'} with ${profile.skinTone === 'Açık' ? 'light/fair' : profile.skinTone === 'Buğday' ? 'olive/medium' : profile.skinTone === 'Esmer' ? 'brown/dark' : 'dark/black'} skin tone, ${profile.height}cm tall, ${profile.weight}kg. They are wearing EXACTLY AND ONLY: ${option.imagePrompt}. Professional studio lighting, clean background, photorealistic.`,
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

    return {
      itemIds: option.ids,
      description: option.reasoning,
      imageUrl,
    };
  }));

  return results; // Return all variations
}
