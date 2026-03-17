import React, { useState, useEffect } from 'react';
import { Shirt, User, Sparkles, Download } from 'lucide-react';
import Wardrobe from './components/Wardrobe';
import Mannequin from './components/Mannequin';
import Outfits from './components/Outfits';
import { db } from './services/db';
import { MannequinProfile, WardrobeItem, OutfitRecommendation } from './types';

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
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 md:top-0 md:bottom-auto md:w-64 md:h-screen md:border-r md:border-t-0 z-50 flex md:flex-col">
        <div className="hidden md:flex items-center p-6 border-b border-stone-200">
          <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
          <h1 className="text-xl font-bold tracking-tight">Sanal Dolap</h1>
        </div>
        <div className="flex w-full md:flex-col md:p-4">
          <NavItem
            icon={<Shirt />}
            label="Dolabım"
            active={activeTab === 'wardrobe'}
            onClick={() => setActiveTab('wardrobe')}
          />
          <NavItem
            icon={<User />}
            label="Manken"
            active={activeTab === 'mannequin'}
            onClick={() => setActiveTab('mannequin')}
          />
          <NavItem
            icon={<Sparkles />}
            label="Kombin Önerisi"
            active={activeTab === 'outfits'}
            onClick={() => setActiveTab('outfits')}
          />
        </div>
        
        {/* PWA Install Button (Desktop & Mobile Sidebar) */}
        {deferredPrompt && (
          <div className="hidden md:block mt-auto p-4">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Uygulamayı Yükle</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Mobile Install Banner */}
        {deferredPrompt && (
          <div className="md:hidden mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-indigo-900">Uygulamayı Yükle</h3>
              <p className="text-xs text-indigo-700 mt-0.5">Daha iyi bir deneyim için ana ekrana ekleyin</p>
            </div>
            <button
              onClick={handleInstallClick}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-transform"
            >
              Yükle
            </button>
          </div>
        )}

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
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start py-3 md:py-4 md:px-4 gap-1 md:gap-3 transition-colors md:rounded-xl ${
        active
          ? 'text-indigo-600 md:bg-indigo-50 font-medium'
          : 'text-stone-500 hover:text-stone-900 md:hover:bg-stone-100'
      }`}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] md:text-sm uppercase md:capitalize tracking-wider md:tracking-normal">
        {label}
      </span>
    </button>
  );
}
