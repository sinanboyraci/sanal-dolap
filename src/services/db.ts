import localforage from 'localforage';
import { WardrobeItem, MannequinProfile, OutfitRecommendation } from '../types';

localforage.config({
  name: 'SanalDolap',
  storeName: 'wardrobe_store',
});

const WARDROBE_KEY = 'wardrobe_items';
const MANNEQUIN_KEY = 'mannequin_profile';
const OUTFITS_KEY = 'outfit_history';

export const db = {
  async getWardrobe(): Promise<WardrobeItem[]> {
    const items = await localforage.getItem<WardrobeItem[]>(WARDROBE_KEY);
    return items || [];
  },

  async saveWardrobeItem(item: WardrobeItem): Promise<void> {
    const items = await this.getWardrobe();
    items.push(item);
    await localforage.setItem(WARDROBE_KEY, items);
  },

  async deleteWardrobeItem(id: string): Promise<void> {
    let items = await this.getWardrobe();
    items = items.filter((i) => i.id !== id);
    await localforage.setItem(WARDROBE_KEY, items);
  },

  async getMannequin(): Promise<MannequinProfile | null> {
    return await localforage.getItem<MannequinProfile>(MANNEQUIN_KEY);
  },

  async saveMannequin(profile: MannequinProfile): Promise<void> {
    await localforage.setItem(MANNEQUIN_KEY, profile);
  },

  async getOutfits(): Promise<OutfitRecommendation[]> {
    const outfits = await localforage.getItem<OutfitRecommendation[]>(OUTFITS_KEY);
    return outfits || [];
  },

  async saveOutfit(outfit: OutfitRecommendation): Promise<void> {
    const outfits = await this.getOutfits();
    outfits.push(outfit);
    await localforage.setItem(OUTFITS_KEY, outfits);
  },
};
