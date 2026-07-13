"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Maximize2, X, Play, Sparkles } from 'lucide-react';

// --- SHARED BRAND ANIMATIONS (TYPED) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const heroTitleVariants: Variants = {
  hidden: { opacity: 0, y: 100, scale: 0.8, rotateX: -90 },
  visible: {
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  }
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9, rotateX: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.08 
    }
  })
};

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchGallery = async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (data) {
        setItems(data);
        const cats = ['All', ...Array.from(new Set(data.map((item: any) => item.category_name)))];
        setCategories(cats as string[]);
      }
      setLoading(false);
    };
    fetchGallery();
  }, []);

  if (!mounted) return null;

  const filteredItems = filter === 'All' ? items : items.filter(item => item.category_name === filter);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-700 relative overflow-hidden"
    >
      
      {/* --- BACKGROUND BLOBS --- */}
      <motion.div 
        animate={{ x: [0, 80, -40, 0], y: [0, -30, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-brand-green/10 blur-[120px] rounded-full pointer-events-none"
      />

      <div className="relative z-10">
        {/* --- HEADER --- */}
        <header className="pt-14 pb-2 px-2">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div 
              variants={gridItemVariants}
              custom={0}
              className="flex items-center justify-center gap-3 text-brand-green font-black uppercase tracking-[0.5em] text-[10px] mb-6"
            >
              <div className="w-12 h-[1px] bg-brand-green/30" />
              <Sparkles size={14} className="text-brand-yellow animate-pulse" /> Cinematic Showcase
            </motion.div>
            <motion.h1 
              variants={heroTitleVariants}
              className="text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8]"
            >
              The <span className="text-brand-green">Gallery</span><span className="text-brand-yellow">.</span>
            </motion.h1>
          </div>
        </header>

        {/* --- STICKY FILTER --- */}
        <nav className="sticky top-24 z-40 py-10 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-fit mx-auto flex flex-wrap gap-3 p-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-full border border-zinc-200 dark:border-white/10 shadow-2xl"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-500 ${
                  filter === cat 
                  ? 'bg-brand-green text-brand-yellow shadow-lg shadow-brand-green/40 scale-105' 
                  : 'text-zinc-500 hover:text-brand-green dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </nav>

        {/* --- DYNAMIC GRID --- */}
        <section className="max-w-[1600px] mx-auto px-6 py-16">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => {
                const fileUrl = item.media?.[0]?.url || item.media?.[0] || "";
                const isVideo = fileUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || item.file_type?.includes('video');

                return (
                  <motion.div
                    layout
                    key={item.id}
                    variants={gridItemVariants}
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                    whileHover={{ y: -10, transition: { duration: 0.4 } }}
                    className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 group cursor-pointer shadow-2xl border border-zinc-200 dark:border-white/5"
                    onClick={() => setSelectedImg(fileUrl)}
                  >
                    {/* Media Container */}
                    <div className="w-full h-full overflow-hidden">
                      {isVideo ? (
                        <video autoPlay muted loop playsInline className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110">
                          <source src={fileUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <img src={fileUrl} className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110" alt={item.title} />
                      )}
                    </div>

                    {/* High-End Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-10">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-brand-yellow text-[10px] font-black uppercase tracking-[0.4em]">
                          {item.category_name}
                        </p>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                          {item.title}
                        </h3>
                        <div className="w-12 h-[2px] bg-brand-yellow" />
                      </motion.div>
                    </div>

                    {/* Video Indicator */}
                    {isVideo && (
                      <div className="absolute top-8 right-8 z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 group-hover:bg-brand-yellow group-hover:text-brand-green transition-all duration-500">
                        <Play size={16} className="fill-current" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>

      {/* --- LIGHTBOX (SMOOTH SCALE) --- */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-green/98 backdrop-blur-3xl flex items-center justify-center p-6 md:p-16"
            onClick={() => setSelectedImg(null)}
          >
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              className="absolute top-10 right-10 text-brand-yellow z-[110]"
            >
              <X size={48} />
            </motion.button>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-6xl h-full flex items-center justify-center"
            >
               {selectedImg.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
                 <video autoPlay controls className="max-w-full max-h-full rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10">
                    <source src={selectedImg} type="video/mp4" />
                 </video>
               ) : (
                 <img src={selectedImg} className="max-w-full max-h-full object-contain rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10" />
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- VOID STATE --- */}
      {filteredItems.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 0.05, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <h2 className="font-black text-[20vw] uppercase tracking-tighter">Void</h2>
        </motion.div>
      )}
    </motion.div>
  );
}