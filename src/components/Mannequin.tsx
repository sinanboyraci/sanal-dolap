import React, { useState } from 'react';
import { Save, UserCircle, Sparkles, Ruler, Weight } from 'lucide-react';
import { MannequinProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Mannequin({
  profile,
  onSave,
}: {
  profile: MannequinProfile | null;
  onSave: (profile: MannequinProfile) => void;
}) {
  const [formData, setFormData] = useState(
    profile ? {
      gender: profile.gender,
      age: profile.age.toString(),
      height: profile.height.toString(),
      weight: profile.weight.toString(),
      skinTone: profile.skinTone,
    } : {
      gender: 'Kadın',
      age: '25',
      height: '170',
      weight: '60',
      skinTone: 'Buğday',
    }
  );

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      gender: formData.gender as 'Kadın' | 'Erkek' | 'Diğer',
      skinTone: formData.skinTone as 'Açık' | 'Buğday' | 'Esmer' | 'Siyahi',
      age: Number(formData.age) || 25,
      height: Number(formData.height) || 170,
      weight: Number(formData.weight) || 60,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="text-center space-y-4 mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 mb-4"
        >
          <UserCircle className="w-12 h-12" />
        </motion.div>
        <h2 className="text-4xl font-black tracking-tighter text-stone-900">Manken Profiliniz</h2>
        <p className="text-stone-500 max-w-md mx-auto font-medium">
          Yapay zeka modellerimiz, bu bilgileri kullanarak kıyafetleri sizin vücut tipinize göre simüle eder.
        </p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[3rem] shadow-xl border border-stone-100 p-10 md:p-12 space-y-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gender */}
          <div className="space-y-3">
            <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Cinsiyet</label>
            <div className="relative group">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none font-bold text-stone-700 shadow-inner"
              >
                <option value="Kadın">Kadın</option>
                <option value="Erkek">Erkek</option>
                <option value="Diğer">Diğer</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Skin Tone */}
          <div className="space-y-3">
            <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Ten Rengi</label>
            <select
              name="skinTone"
              value={formData.skinTone}
              onChange={handleChange}
              className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none font-bold text-stone-700 shadow-inner"
            >
              <option value="Açık">Açık</option>
              <option value="Buğday">Buğday</option>
              <option value="Esmer">Esmer</option>
              <option value="Siyahi">Siyahi</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-3">
            <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Yaş</label>
            <input
              type="number"
              name="age"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-stone-700 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Height */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Ruler className="w-3 h-3" /> Boy
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full pl-6 pr-12 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-stone-700 shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300">CM</span>
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Weight className="w-3 h-3" /> Kilo
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full pl-6 pr-12 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-stone-700 shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300">KG</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <AnimatePresence>
            {isSaved && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-emerald-500 font-bold flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                Profil başarıyla kaydedildi!
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-stone-900 text-white px-10 py-5 rounded-[1.5rem] hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 font-black text-sm uppercase tracking-widest active:scale-95"
          >
            <Save className="w-5 h-5" />
            Değişiklikleri Kaydet
          </button>
        </div>
      </motion.form>
    </div>
  );
}
