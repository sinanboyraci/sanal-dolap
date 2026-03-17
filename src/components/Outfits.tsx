import React, { useState } from 'react';
import { Sparkles, Loader2, Calendar, Clock, Briefcase, Coffee, Music, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MannequinProfile, WardrobeItem, OutfitRecommendation } from '../types';
import { generateOutfitRecommendation } from '../services/gemini';

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
  const [currentRecommendation, setCurrentRecommendation] = useState<OutfitRecommendation | null>(null);

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
    setCurrentRecommendation(null);

    try {
      const result = await generateOutfitRecommendation(wardrobe, profile, selectedOccasion);
      
      const newOutfit: OutfitRecommendation = {
        id: uuidv4(),
        occasion: selectedOccasion,
        itemIds: result.itemIds,
        description: result.description,
        imageUrl: result.imageUrl,
        createdAt: Date.now(),
      };

      setCurrentRecommendation(newOutfit);
      onSave(newOutfit);
    } catch (err: any) {
      setError(err.message || 'Kombin oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Kombin Önerisi</h2>
      </div>

      {/* Generator Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-3">Günün Önemi / Tarz</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                    selectedOccasion === occ.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-indigo-300 hover:bg-stone-50'
                  }`}
                >
                  {occ.icon}
                  <span className="text-xs font-medium text-center">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !profile || wardrobe.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white p-4 rounded-2xl hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Sanal Manken Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <span>Kombin Önerisi Al</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Recommendation */}
      {currentRecommendation && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h3 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Sizin İçin Seçtiklerimiz
          </h3>
          <div className="bg-white rounded-3xl shadow-md border border-stone-200 overflow-hidden flex flex-col md:flex-row">
            {/* Image Side */}
            <div className="md:w-1/2 bg-stone-100 relative aspect-[3/4] md:aspect-auto">
              <img
                src={currentRecommendation.imageUrl}
                alt="Generated Outfit"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-2">
                  {currentRecommendation.occasion}
                </span>
                <p className="text-sm font-medium leading-snug drop-shadow-md">
                  {currentRecommendation.description}
                </p>
              </div>
            </div>

            {/* Items Side */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
              <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                Kullanılan Parçalar
              </h4>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {currentRecommendation.itemIds.map((itemId) => {
                  const item = wardrobe.find((i) => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl border border-stone-100 bg-stone-50/50">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200">
                        <img src={item.image} alt={item.description} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                          {item.category} <span className="text-stone-400 font-normal ml-1">• {item.subCategory}</span>
                        </p>
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {item.description}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {item.color} • {item.style}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !currentRecommendation && (
        <div className="pt-8 border-t border-stone-200">
          <h3 className="text-lg font-bold text-stone-900 mb-6">Geçmiş Kombinler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.slice().reverse().map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden group cursor-pointer hover:shadow-md transition-all" onClick={() => setCurrentRecommendation(outfit)}>
                <div className="aspect-[4/5] relative bg-stone-100">
                  <img src={outfit.imageUrl} alt="Outfit" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-2 py-1 bg-black/50 backdrop-blur-md text-white rounded-md text-[10px] font-medium uppercase tracking-wider">
                      {outfit.occasion}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-stone-600 line-clamp-1 flex-1 pr-4">
                    {outfit.description}
                  </p>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
