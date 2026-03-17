import React, { useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import { MannequinProfile } from '../types';

export default function Mannequin({
  profile,
  onSave,
}: {
  profile: MannequinProfile | null;
  onSave: (profile: MannequinProfile) => void;
}) {
  const [formData, setFormData] = useState<MannequinProfile>(
    profile || {
      gender: 'Kadın',
      age: 25,
      height: 170,
      weight: 60,
      skinTone: 'Buğday',
    }
  );

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <UserCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Manken Profiliniz</h2>
        <p className="text-stone-500 max-w-md mx-auto">
          Kombin önerilerini kendi vücut tipinize ve özelliklerinize uygun bir manken üzerinde görmek için profilinizi oluşturun.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Cinsiyet</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            >
              <option value="Kadın">Kadın</option>
              <option value="Erkek">Erkek</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Skin Tone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Ten Rengi</label>
            <select
              name="skinTone"
              value={formData.skinTone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            >
              <option value="Açık">Açık</option>
              <option value="Buğday">Buğday</option>
              <option value="Esmer">Esmer</option>
              <option value="Siyahi">Siyahi</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Yaş</label>
            <input
              type="number"
              name="age"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Boy (cm)</label>
            <input
              type="number"
              name="height"
              min="50"
              max="250"
              value={formData.height}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Kilo (kg)</label>
            <input
              type="number"
              name="weight"
              min="20"
              max="300"
              value={formData.weight}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <p className={`text-sm font-medium transition-opacity duration-300 ${isSaved ? 'text-emerald-600 opacity-100' : 'opacity-0'}`}>
            Profil başarıyla kaydedildi!
          </p>
          <button
            type="submit"
            className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors shadow-sm font-medium"
          >
            <Save className="w-5 h-5" />
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
