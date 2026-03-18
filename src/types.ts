export const WARDROBE_CATEGORIES = {
  'Üst Giyim': ['Kaban', 'Mont', 'Ceket', 'Kazak', 'Gömlek', 'T-Shirt', 'Hırka', 'Sweatshirt', 'Yelek', 'Takım Elbise'],
  'Alt Giyim': ['Pantolon', 'Şort'],
  'Ayakkabı': ['Klasik Ayakkabı', 'Bot', 'Spor Ayakkabı'],
  'Aksesuar': ['Çanta', 'Kemer', 'Kravat', 'Atkı']
} as const;

export type Category = keyof typeof WARDROBE_CATEGORIES;
export type SubCategory = typeof WARDROBE_CATEGORIES[Category][number];

export interface WardrobeItem {
  id: string;
  image: string; // base64 or url
  category: Category;
  subCategory: SubCategory;
  description: string;
  color: string;
  style: string;
  stylingAdvice?: string; // AI generated advice
  quickMatches?: { itemIds: string[]; explanation: string }[];
  createdAt: number;
}

export interface MannequinProfile {
  gender: 'Kadın' | 'Erkek' | 'Diğer';
  age: number;
  height: number;
  weight: number;
  skinTone: 'Açık' | 'Buğday' | 'Esmer' | 'Siyahi';
}

export interface OutfitRecommendation {
  id: string;
  occasion: string;
  itemIds: string[];
  description: string;
  imageUrl: string; // Generated image
  createdAt: number;
}
