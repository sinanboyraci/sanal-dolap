export const WARDROBE_CATEGORIES = {
  'Dış Giyim': ['Kaban', 'Palto', 'Mont', 'Trençkot', 'Ceket', 'Yelek'],
  'Üst Giyim': ['Gömlek', 'Bluz', 'Kazak', 'Hırka', 'Triko', 'Tişört', 'Sweatshirt'],
  'Alt Giyim': ['Pantolon', 'Etek', 'Jean', 'Şort', 'Tayt'],
  'Elbise & Tulum': ['Elbise', 'Tulum'],
  'Ayakkabı': ['Topuklu Ayakkabı', 'Sneaker', 'Bot', 'Çizme', 'Babet', 'Loafer', 'Sandalet', 'Terlik'],
  'Çanta': ['Omuz Çantası', 'Çapraz Çanta', 'El Çantası', 'Sırt Çantası', 'Portföy & Abiye Çanta'],
  'Aksesuar': ['Şal', 'Eşarp', 'Kemer', 'Cüzdan', 'Takı', 'Gözlük', 'Şapka']
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
