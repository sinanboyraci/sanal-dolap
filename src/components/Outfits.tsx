import React, { useState } from 'react';
import { Sparkles, Loader2, Calendar, Clock, Briefcase, Coffee, Music, ChevronRight, LayoutGrid, Heart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MannequinProfile, WardrobeItem, OutfitRecommendation } from '../types';
import { generateOutfitRecommendation } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';

const OCCASIONS = [
  { id: 'Günlük', icon: <Coffee className="w-5 h-5" />, label: 'Günlük' },
  { id: 'Sportif', icon: <Clock className="w-5 h-5" />, label: 'Sportif' },
  { id: 'Klasik', icon: <Briefcase className="w-5 h-5" />, label: 'Klasik / İş' },
  { id: 'Özel Davet', icon: <Calendar className="w-5 h-5" />, label: 'Özel Davet' },
  { id: 'Gece Eğlencesi', icon: <Music className="w-5 h-5" />, label: 'Gece Eğlencesi' },
];

export default function Outfits({
  wardrobe,
  profile,
  history,
  onSave,
}: {
  wardrobe: WardrobeItem[];
  profile: MannequinProfile | null;
  history: OutfitRecommendation[];
  onSave: (outfit: OutfitRecommendation) => void;
}) {
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleGenerate = async () => {
    if (!profile) {
      setError('Lütfen önce Manken profilinizi oluşturun.');
      return;
    }
    if (wardrobe.length < 2) {
      setError('Kombin oluşturabilmek için dolabınızda en az 2 eşya bulunmalıdır.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setRecommendations([]);
    setSelectedIndex(0);

    try {
      const results = await generateOutfitRecommendation(wardrobe, profile, selectedOccasion);

      const newOutfits: OutfitRecommendation[] = results.map(result => ({
        id: uuidv4(),
        occasion: selectedOccasion,
        itemIds: result.itemIds,
        description: result.description,
        imageUrl: result.imageUrl,
        createdAt: Date.now(),
      }));

      setRecommendations(newOutfits);
    } catch (err: any) {
      setError(err.message || 'Kombin oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentRecommendation = recommendations[selectedIndex];

  return (
    <div className="space-y-12 pb-20 mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-stone-900">Kombin Önerisi</h2>
          <p className="text-stone-500 font-medium mt-1">Dolabınızdaki parçalarla size özel stil rehberi.</p>
        </div>
      </div>

      {/* Generator Section */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-stone-100 border border-stone-100">
        <div className="space-y-8">
          <div>
            <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block ml-1">Günün Stil Teması</label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all relative overflow-hidden group ${selectedOccasion === occ.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-stone-50 bg-stone-50/50 text-stone-500 hover:border-indigo-200 hover:bg-white'
                    }`}
                >
                  <div className={`transition-transform duration-300 group-hover:scale-110 ${selectedOccasion === occ.id ? 'scale-110' : ''}`}>
                    {occ.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              {error}
            </motion.div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !profile || wardrobe.length < 2}
            className="w-full group flex items-center justify-center gap-4 bg-stone-900 text-white p-6 rounded-[1.75rem] hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg shadow-xl shadow-stone-200 active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="uppercase tracking-widest">Geleceğin Modası Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="uppercase tracking-widest">Kombinleri Oluştur</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommendations Display */}
      <AnimatePresence mode="wait">
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                Bugün Ne Giyebilirsin?
              </h3>
              <div className="flex gap-2">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${selectedIndex === idx ? 'w-10 bg-indigo-600 shadow-lg shadow-indigo-100' : 'w-2.5 bg-stone-200 hover:bg-stone-300'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:min-h-[700px]">
              {/* Main Visual */}
              <div className="lg:col-span-7 bg-white rounded-[3.5rem] shadow-2xl shadow-stone-200/50 border border-stone-100 overflow-hidden relative">
                <img
                  src={currentRecommendation.imageUrl}
                  alt="AI Suggestion"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl">
                    <Sparkles className="w-3.5 h-3.5" /> STİL SEÇENEĞİ {selectedIndex + 1}
                  </div>
                  <p className="text-3xl font-bold text-white leading-tight drop-shadow-2xl">
                    {currentRecommendation.description}
                  </p>
                  <button
                    onClick={() => onSave(currentRecommendation)}
                    className="mt-8 flex items-center gap-3 bg-white text-stone-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 shadow-2xl"
                  >
                    <Heart className="w-5 h-5" /> Bu Kombini Favoriye Ekle
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[3rem] p-10 border border-stone-100 shadow-2xl shadow-stone-100/50 h-full flex flex-col">
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Gardırobunuzdan Seçilenler
                  </h4>
                  <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                    {currentRecommendation.itemIds.map((itemId) => {
                      const item = wardrobe.find((i) => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={item.id} className="group flex items-center gap-5 p-5 rounded-[2rem] border border-stone-50 bg-stone-50/40 hover:bg-white hover:shadow-2xl hover:shadow-stone-100/30 transition-all duration-500">
                          <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white shrink-0 shadow-inner border border-stone-100">
                            <img src={item.image} alt={item.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category}</span>
                              <div className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{item.style}</span>
                            </div>
                            <p className="font-bold text-stone-900 leading-snug group-hover:text-indigo-600 transition-colors">
                              {item.description}
                            </p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase mt-2 bg-stone-100 inline-block px-2 py-1 rounded-md">
                              {item.color}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Outfits History */}
      {history.length > 0 && (
        <div className="pt-16 border-t border-stone-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-3xl font-black tracking-tighter text-stone-900">Koleksiyonum</h3>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mt-1">Favori Kombinleriniz</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center shadow-inner">
              <span className="text-stone-900 font-black text-sm">{history.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {history.slice().reverse().map((outfit) => (
              <motion.div
                whileHover={{ y: -10 }}
                key={outfit.id}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-100 border border-stone-100 overflow-hidden group cursor-pointer"
                onClick={() => {
                  setRecommendations([outfit]);
                  setSelectedIndex(0);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                <div className="aspect-[4/5] relative bg-stone-50 overflow-hidden">
                  <img src={outfit.imageUrl} alt="Outfit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-5 left-5">
                    <span className="inline-block px-4 py-2 bg-white/95 backdrop-blur-md text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                      {outfit.occasion}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between bg-white">
                  <p className="text-xs font-bold text-stone-600 line-clamp-1 flex-1 pr-6">
                    {outfit.description}
                  </p>
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
