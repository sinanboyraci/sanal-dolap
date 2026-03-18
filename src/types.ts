export const WARDROBE_CATEGORIES = {
  'Tekstil': ['T-Shirt', 'Gömlek', 'Teknik Üst', 'Polo T-shirt', 'Mont', 'Polar Üst', 'Yağmurluk', 'Pantolon', 'Sweatshirt', 'Softshell', 'Tulum', 'Şort', 'Deniz Şortu', 'Yelek', 'İç Giyim', 'Kaban', 'Palto', 'Trençkot', 'Ceket', 'Bluz', 'Kazak', 'Hırka', 'Triko', 'Tişört', 'Etek', 'Jean', 'Tayt', 'Elbise'],
  'Ayakkabı': ['Ayakkabı', 'Bot', 'Terlik', 'Topuklu Ayakkabı', 'Sneaker', 'Çizme', 'Babet', 'Loafer', 'Sandalet'],
  'Aksesuar': ['Şapka', 'Çorap', 'Bere', 'Eldiven', 'Şal', 'Eşarp', 'Kemer', 'Cüzdan', 'Takı', 'Gözlük', 'Çanta', 'Omuz Çantası', 'Çapraz Çanta', 'El Çantası', 'Sırt Çantası', 'Portföy & Abiye Çanta'],
  'Ekipman': ['Çanta', 'Termos', 'Kamp Ekipmanları']
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
