import React, { useState, useEffect } from 'react';
import { LayoutGrid, User, Sparkles, Download, Heart } from 'lucide-react';
import Wardrobe from './components/Wardrobe';
import Mannequin from './components/Mannequin';
import Outfits from './components/Outfits';
import { db } from './services/db';
import { MannequinProfile, WardrobeItem, OutfitRecommendation } from './types';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'mannequin' | 'outfits'>('wardrobe');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [profile, setProfile] = useState<MannequinProfile | null>(null);
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setWardrobe(await db.getWardrobe());
      setProfile(await db.getMannequin());
      setOutfits(await db.getOutfits());
    };
    loadData();

    // Listen for the beforeinstallprompt event for PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleSaveProfile = async (newProfile: MannequinProfile) => {
    await db.saveMannequin(newProfile);
    setProfile(newProfile);
  };

  const handleAddWardrobeItem = async (item: WardrobeItem) => {
    await db.saveWardrobeItem(item);
    setWardrobe(await db.getWardrobe());
  };

  const handleDeleteWardrobeItem = async (id: string) => {
    await db.deleteWardrobeItem(id);
    setWardrobe(await db.getWardrobe());
  };

  const handleSaveOutfit = async (outfit: OutfitRecommendation) => {
    await db.saveOutfit(outfit);
    setOutfits(await db.getOutfits());
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 pb-24 md:pb-0 md:pl-72">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-200 md:top-0 md:bottom-auto md:w-72 md:h-screen md:border-r md:border-t-0 z-50 flex md:flex-col shadow-2xl md:shadow-none">
        <div className="hidden md:flex flex-col p-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-stone-900">Sanal Dolap</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Fashion Pro</p>
            </div>
          </div>

          <div className="space-y-3">
            <NavItem
              icon={<LayoutGrid className="w-5 h-5" />}
              label="Dolabım"
              active={activeTab === 'wardrobe'}
              onClick={() => setActiveTab('wardrobe')}
            />
            <NavItem
              icon={<User className="w-5 h-5" />}
              label="Manken"
              active={activeTab === 'mannequin'}
              onClick={() => setActiveTab('mannequin')}
            />
            <NavItem
              icon={<Sparkles className="w-5 h-5" />}
              label="Kombin Önerisi"
              active={activeTab === 'outfits'}
              onClick={() => setActiveTab('outfits')}
            />
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden w-full justify-around items-center p-3">
          <MobileNavItem
            icon={<LayoutGrid className="w-6 h-6" />}
            label="Dolap"
            active={activeTab === 'wardrobe'}
            onClick={() => setActiveTab('wardrobe')}
          />
          <MobileNavItem
            icon={<User className="w-6 h-6" />}
            label="Manken"
            active={activeTab === 'mannequin'}
            onClick={() => setActiveTab('mannequin')}
          />
          <MobileNavItem
            icon={<Sparkles className="w-6 h-6" />}
            label="Kombin"
            active={activeTab === 'outfits'}
            onClick={() => setActiveTab('outfits')}
          />
        </div>

        {/* PWA Install Button */}
        {deferredPrompt && (
          <div className="hidden md:block mt-auto p-10">
            <button
              onClick={handleInstallClick}
              className="w-full group flex items-center justify-center gap-3 bg-stone-900 text-white p-4 rounded-2xl hover:bg-stone-800 transition-all text-sm font-bold shadow-xl shadow-stone-200 active:scale-95"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              Yükle (PWA)
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="p-6 md:p-12 relative max-w-[1600px] mx-auto min-h-screen">
        {/* Mobile Install Banner */}
        {deferredPrompt && (
          <div className="md:hidden mb-8 bg-indigo-600 rounded-[2rem] p-6 flex items-center justify-between shadow-xl shadow-indigo-100 overflow-hidden relative group">
            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <h3 className="text-white font-black text-lg">Uygulamayı Yükle</h3>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Daha Profesyonel Kullanım</p>
            </div>
            <button
              onClick={handleInstallClick}
              className="relative z-10 bg-white text-indigo-600 px-5 py-2.5 rounded-[1.25rem] text-sm font-black shadow-lg active:scale-90 transition-all"
            >
              ŞİMDİ YÜKLE
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {activeTab === 'wardrobe' && (
              <Wardrobe
                items={wardrobe}
                onAdd={handleAddWardrobeItem}
                onDelete={handleDeleteWardrobeItem}
              />
            )}
            {activeTab === 'mannequin' && (
              <Mannequin profile={profile} onSave={handleSaveProfile} />
            )}
            {activeTab === 'outfits' && (
              <Outfits
                wardrobe={wardrobe}
                profile={profile}
                history={outfits}
                onSave={handleSaveOutfit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${active
          ? 'bg-indigo-50 text-indigo-600 shadow-sm'
          : 'text-stone-500 hover:bg-white hover:text-stone-900'
        }`}
    >
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r-full"
        />
      )}
      <span className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'scale-110' : ''}`}>
        {icon}
      </span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}

function MobileNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-2 px-6 rounded-2xl transition-all ${active ? 'bg-indigo-50 text-indigo-600 scale-110' : 'text-stone-400'
        }`}
    >
      <div className="relative">
        {icon}
        {active && (
          <motion.div
            layoutId="mobile-dot"
            className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full"
          />
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
