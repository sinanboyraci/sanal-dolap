import React, { useState, useRef } from 'react';
import { Plus, Trash2, Camera, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WardrobeItem, Category, WARDROBE_CATEGORIES } from '../types';
import { analyzeClothingItem } from '../services/gemini';

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

  // If it doesn't look like a direct image URL, try scraping first
  if (!isImageUrl) {
    try {
      const scrapeRes = await fetch(`/api/scrape-product?url=${encodeURIComponent(url)}`);
      if (scrapeRes.ok) {
        const { imageUrls } = await scrapeRes.json();

        if (imageUrls && imageUrls.length > 0) {
          // Try each extracted image until one works
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

    // Fallback to Microlink if scraping found nothing or all images failed
    return await tryMicrolinkFallback(url);
  }

  // If it's a direct image URL (or looked like one), proxy it
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
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems =
    activeCategory === 'Tümü'
      ? items
      : items.filter((item) => item.category === activeCategory);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64String = reader.result as string;
        const base64String = await compressImage(rawBase64String);

        // Extract base64 data and mime type
        const match = base64String.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
        if (!match) throw new Error('Invalid image format');

        const mimeType = match[1];
        const data = match[2];

        const analysis = await analyzeClothingItem(data, mimeType);

        const newItem: WardrobeItem = {
          id: uuidv4(),
          image: base64String,
          category: analysis.category,
          subCategory: analysis.subCategory,
          description: analysis.description,
          color: analysis.color,
          style: analysis.style,
          createdAt: Date.now(),
        };

        onAdd(newItem);
        setIsAdding(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Dolabım</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Eşya Ekle</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('Tümü')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'Tümü'
            ? 'bg-stone-900 text-white'
            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
        >
          Tümü
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 border-dashed">
          <ShirtIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900">Dolabınız boş</h3>
          <p className="text-stone-500 mt-1">Hemen yeni eşyalar eklemeye başlayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-stone-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                  {item.category} <span className="text-stone-400 font-normal ml-1">• {item.subCategory}</span>
                </p>
                <p className="text-sm text-stone-900 line-clamp-2 leading-tight">
                  {item.description}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <span className="inline-block px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md">
                    {item.color}
                  </span>
                  <span className="inline-block px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md">
                    {item.style}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h3 className="text-xl font-bold text-stone-900">Eşya Ekle</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-stone-600 text-sm text-center mb-6">
                  Bir fotoğraf yükleyin veya görsel linki yapıştırın. Yapay zeka eşyanızı otomatik olarak analiz edip kategorize edecektir.
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
                  className="w-full flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-stone-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-stone-400 group-hover:text-indigo-600 transition-colors" />
                  )}
                  <span className="font-medium text-stone-700 group-hover:text-indigo-700">
                    {isLoading ? 'Analiz Ediliyor...' : 'Fotoğraf Çek veya Seç'}
                  </span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink-0 mx-4 text-stone-400 text-sm">veya</span>
                  <div className="flex-grow border-t border-stone-200"></div>
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

                    const newItem: WardrobeItem = {
                      id: uuidv4(),
                      image: base64String,
                      category: analysis.category,
                      subCategory: analysis.subCategory,
                      description: analysis.description,
                      color: analysis.color,
                      style: analysis.style,
                      createdAt: Date.now(),
                    };

                    onAdd(newItem);
                    setIsAdding(false);
                  } catch (err: any) {
                    setError(err.message || 'Görsel linkten alınamadı. Lütfen geçerli bir ürün linki veya görsel linki girin.');
                  } finally {
                    setIsLoading(false);
                  }
                }} className="flex gap-2">
                  <input
                    type="url"
                    name="url"
                    placeholder="Görsel linki (URL) yapıştırın"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
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
