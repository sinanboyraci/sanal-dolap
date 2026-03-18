export const WARDROBE_CATEGORIES = {
  'Üst Giyim': ['Kaban', 'Mont', 'Triko Mont', 'Ceket', 'Kazak', 'Gömlek', 'T-Shirt', 'Hırka', 'Sweatshirt', 'Polo T-Shirt', 'Yelek', 'Takım Elbise', 'Smokin'],
  'Alt Giyim': ['Pantolon', 'Şort', 'Mayo', 'Boxer'],
  'Ayakkabı': ['Loafer', 'Klasik Ayakkabı', 'Bot'],
  'Aksesuar': ['Çanta', 'Kemer', 'Kravat', 'Çorap', 'Mendil', 'Parfüm', 'Atkı'],
  'Koleksiyon': ['Performans Serisi', 'Keten Koleksiyonu', 'Non-Iron Gömlek', 'Deri Koleksiyonu', 'Kaşmir Koleksiyonu', 'İpek Koleksiyonu']
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
