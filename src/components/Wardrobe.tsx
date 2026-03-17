import React, { useState, useRef } from 'react';
import { Plus, Trash2, Camera, Link as LinkIcon, X, Loader2, Search, Filter, Sparkles, ChevronRight, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WardrobeItem, Category, WARDROBE_CATEGORIES } from '../types';
import { analyzeClothingItem, getQuickMatches } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: Category[] = Object.keys(WARDROBE_CATEGORIES) as Category[];

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Fill white background for transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Always output as JPEG to reduce size and ensure compatibility
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Görsel işlenemedi veya geçersiz bir görsel formatı. Lütfen farklı bir link deneyin veya fotoğrafı indirip yükleyin.'));
  });
};

const fetchImageFromUrl = async (url: string): Promise<string> => {
  const isImageUrl = !!url.match(/\.(jpeg|jpg|gif|png|webp|avif)(\?.*)?$/i);

  const tryMicrolinkFallback = async (targetUrl: string) => {
    try {
      const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`);
      const mlJson = await mlRes.json();
      if (mlJson.status === 'success' && mlJson.data?.screenshot?.url) {
        const screenshotUrl = mlJson.data.screenshot.url;
        const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(screenshotUrl)}`);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          return await blobToBase64(blob);
        }
      }
    } catch (e) {
      console.error('Microlink fallback failed:', e);
    }
    throw new Error('Linke erişilemedi (CORS veya Ağ hatası). Lütfen farklı bir link deneyin veya fotoğrafı cihazınıza indirip yükleyin.');
  };

  if (!isImageUrl) {
    try {
      const scrapeRes = await fetch(`/api/scrape-product?url=${encodeURIComponent(url)}`);
      if (scrapeRes.ok) {
        const { imageUrls } = await scrapeRes.json();

        if (imageUrls && imageUrls.length > 0) {
          for (const imgUrl of imageUrls) {
            try {
              const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`);
              if (imgRes.ok) {
                const blob = await imgRes.blob();
                if (blob.size > 1000) {
                  return await blobToBase64(blob);
                }
              }
            } catch (e) {
              console.warn('Failed to fetch extracted image:', imgUrl);
            }
          }
        }
      }
    } catch (e) {
      console.error('Scraping failed:', e);
    }

    return await tryMicrolinkFallback(url);
  }

  try {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const blob = await response.blob();
      return await blobToBase64(blob);
    }
  } catch (e) {
    console.error('Direct proxy failed:', e);
  }

  return await tryMicrolinkFallback(url);
};

export default function Wardrobe({
  items,
  onAdd,
  onDelete,
}: {
  items: WardrobeItem[];
  onAdd: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category | 'Tümü'>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterColor, setFilterColor] = useState('Tümü');
  const [filterStyle, setFilterStyle] = useState('Tümü');

  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available unique colors and styles for filtering
  const availableColors = ['Tümü', ...new Set(items.map(i => i.color))];
  const availableStyles = ['Tümü', ...new Set(items.map(i => i.style))];

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'Tümü' || item.category === activeCategory;
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = filterColor === 'Tümü' || item.color === filterColor;
    const matchesStyle = filterStyle === 'Tümü' || item.style === filterStyle;

    return matchesCategory && matchesSearch && matchesColor && matchesStyle;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64FromFile = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64String = await compressImage(base64FromFile);

      const match = base64String.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
      if (!match) throw new Error('Geçersiz görsel formatı');

      const mimeType = match[1];
      const data = match[2];

      const analysis = await analyzeClothingItem(data, mimeType);

      // Get quick matches with existing wardrobe
      const matches = await getQuickMatches({
        description: analysis.description,
        category: analysis.category,
        subCategory: analysis.subCategory,
        color: analysis.color,
        style: analysis.style
      }, items);

      const newItem: WardrobeItem = {
        id: uuidv4(),
        image: base64String,
        category: analysis.category,
        subCategory: analysis.subCategory,
        description: analysis.description,
        color: analysis.color,
        style: analysis.style,
        stylingAdvice: analysis.stylingAdvice,
        quickMatches: matches?.suggestions,
        createdAt: Date.now(),
      };

      onAdd(newItem);
      setIsAdding(false);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Dolabım</h2>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline font-semibold">Eşya Ekle</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border border-stone-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFilterColor(color)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterColor === color ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Stil</label>
                <div className="flex flex-wrap gap-2">
                  {availableStyles.map(style => (
                    <button
                      key={style}
                      onClick={() => setFilterStyle(style)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterStyle === style ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('Tümü')}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === 'Tümü'
            ? 'bg-stone-900 text-white scale-105'
            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
        >
          Tümü
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === cat
              ? 'bg-stone-900 text-white scale-105'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-stone-100 border-dashed">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <ShirtIcon className="w-20 h-20 text-stone-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-stone-900">Aradığınızı bulamadık</h3>
            <p className="text-stone-400 mt-2">Filtreleri değiştirmeyi veya yeni eşyalar eklemeyi deneyin.</p>
          </motion.div>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          <AnimatePresence mode='popLayout'>
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -4 }}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-[4/5] bg-stone-50 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.description}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-red-50 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-3 left-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-stone-900 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Tavsiye İçin Tıklayın
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                    {item.category}
                  </p>
                  <h4 className="text-sm font-semibold text-stone-900 truncate mb-2">
                    {item.description}
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[9px] font-bold rounded-md uppercase tracking-tighter">
                      {item.color}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[9px] font-bold rounded-md uppercase tracking-tighter">
                      {item.style}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Styled Advice Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div
              layoutId={selectedItem.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 grid md:grid-cols-2"
            >
              <div className="aspect-[4/5] md:aspect-auto bg-stone-100 relative">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.description}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 left-4 p-2 bg-white/90 rounded-full text-stone-900 shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-between max-h-[80vh] overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                      {selectedItem.category}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500 text-xs font-medium uppercase tracking-widest">
                      {selectedItem.subCategory}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-stone-900 mb-6 leading-tight">
                    {selectedItem.description}
                  </h3>

                  <div className="space-y-6">
                    <div className="flex gap-10">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Renk</p>
                        <p className="text-sm font-bold text-stone-900">{selectedItem.color}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Stil</p>
                        <p className="text-sm font-bold text-stone-900">{selectedItem.style}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 relative overflow-hidden group">
                      <Sparkles className="absolute -top-2 -right-2 w-12 h-12 text-indigo-200/40 group-hover:scale-110 transition-transform" />
                      <h5 className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-3">
                        <Info className="w-3 h-3" />
                        AI Stil Danışmanı
                      </h5>
                      <p className="text-stone-600 text-sm leading-relaxed italic">
                        {selectedItem.stylingAdvice || "Bu parça için henüz styling tavsiyesi oluşturulmamış. Yeni parçalar ekledikçe Gemini size özel tavsiyeler verecek!"}
                      </p>
                    </div>

                    {selectedItem.quickMatches && selectedItem.quickMatches.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h5 className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5" />
                          Dolabınızdaki Uyumlu Parçalar
                        </h5>
                        <div className="space-y-3">
                          {selectedItem.quickMatches.map((match, i) => (
                            <div key={i} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-4 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/30 transition-all group">
                              <div className="flex -space-x-4 shrink-0 mt-1">
                                {match.itemIds.slice(0, 3).map(id => {
                                  const matchItem = items.find(it => it.id === id);
                                  return matchItem ? (
                                    <div key={id} className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-lg overflow-hidden shrink-0 group-hover:scale-110 transition-transform bg-white">
                                      <img src={matchItem.image} alt="Match" className="w-full h-full object-cover" />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <p className="text-[11px] text-stone-700 font-bold leading-snug group-hover:text-indigo-900 transition-colors pt-1">
                                {match.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="mt-8 w-full py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Kapat
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(false)}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10"
          >
            <div className="flex justify-between items-center p-8 border-b border-stone-50">
              <h3 className="text-2xl font-extrabold text-stone-900">Eşya Ekle</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors p-2 hover:bg-stone-50 rounded-full"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              {error && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-wide border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-6">
                <p className="text-stone-500 text-sm text-center font-medium">
                  Yapay zeka eşyanızı otomatik olarak analiz edip size özel <span className="text-indigo-600 font-bold">styling tavsiyeleri</span> hazırlayacaktır.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-stone-200 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                >
                  {isLoading ? (
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                  ) : (
                    <Camera className="w-12 h-12 text-stone-300 group-hover:text-indigo-500 transition-all group-hover:scale-110" />
                  )}
                  <div className="text-center">
                    <span className="block font-bold text-stone-700 group-hover:text-indigo-900 mb-1">
                      {isLoading ? 'Moda Analizi Yapılıyor...' : 'Fotoğraf Çek veya Seç'}
                    </span>
                    {!isLoading && <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Kamerayı Başlat</span>}
                  </div>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-stone-100"></div>
                  <span className="flex-shrink-0 mx-6 text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em]">veya link</span>
                  <div className="flex-grow border-t border-stone-100"></div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('url') as HTMLInputElement;
                  const url = input.value;
                  if (!url) return;

                  setIsLoading(true);
                  setError(null);

                  try {
                    const rawBase64String = await fetchImageFromUrl(url);
                    const base64String = await compressImage(rawBase64String);

                    const match = base64String.match(/^data:(.*?);base64,(.*)$/);
                    if (!match) throw new Error('Geçersiz görsel formatı');

                    let mimeType = match[1];
                    const data = match[2];

                    if (!mimeType.startsWith('image/')) {
                      mimeType = 'image/jpeg';
                    }

                    const analysis = await analyzeClothingItem(data, mimeType);

                    const matches = await getQuickMatches({
                      description: analysis.description,
                      category: analysis.category,
                      subCategory: analysis.subCategory,
                      color: analysis.color,
                      style: analysis.style
                    }, items);

                    const newItem: WardrobeItem = {
                      id: uuidv4(),
                      image: base64String,
                      category: analysis.category,
                      subCategory: analysis.subCategory,
                      description: analysis.description,
                      color: analysis.color,
                      style: analysis.style,
                      stylingAdvice: analysis.stylingAdvice,
                      quickMatches: matches?.suggestions,
                      createdAt: Date.now(),
                    };

                    onAdd(newItem);
                    setIsAdding(false);
                  } catch (err: any) {
                    setError(err.message || 'Görsel linkten alınamadı. Lütfen geçerli bir ürün linki veya görsel linki girin.');
                  } finally {
                    setIsLoading(false);
                  }
                }} className="flex gap-2 p-1.5 bg-stone-50 rounded-2xl border border-stone-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="url"
                    name="url"
                    placeholder="Ürün veya görsel URL'si..."
                    className="flex-1 px-4 py-3 bg-transparent outline-none text-sm font-medium"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ShirtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}
