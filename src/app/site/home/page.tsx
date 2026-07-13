"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
// Removed 'Instagram' and added 'Instagram' as 'InstaIcon' if available, otherwise using Lucide's 'Camera'
import { Sparkles, Play, MoveRight, Camera, Star } from 'lucide-react'; 
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [sliders, setSliders] = useState<any[]>([]);
  const [instaFeeds, setInstaFeeds] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data: sld } = await supabase.from('home_sliders').select('*').eq('active_status', true).order('display_order');
        const { data: inst } = await supabase.from('instagram_feeds').select('*').order('created_at', { ascending: false }).limit(4);
        const { data: gal } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(6);
        
        if (sld) setSliders(sld);
        if (inst) setInstaFeeds(inst);
        if (gal) setGalleryItems(gal);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (sliders.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [sliders]);

  if (!mounted || loading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <main className="bg-black text-white selection:bg-indigo-500">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] flex items-center px-6 md:px-20 overflow-hidden">
        <AnimatePresence mode="wait">
          {sliders.length > 0 && sliders.map((slide, i) => i === currentSlide && (
            <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
              <img src={slide.file_url} className="w-full h-full object-cover opacity-50" alt="" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="relative z-10 max-w-4xl">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 text-indigo-400 text-[10px] font-black tracking-[0.4em] uppercase mb-4">
            <Sparkles size={14} /> The Gold Standard in Events
          </motion.div>
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 tracking-tighter uppercase">
            Elevating <br /> <span className="text-indigo-500">Your Vision.</span>
          </motion.h1>
          <Link href="/contact" className="group flex items-center gap-3 text-lg font-bold hover:text-indigo-400 transition-colors uppercase tracking-widest">
            Book an Appointment <MoveRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section className="py-20 px-6 md:px-20 bg-zinc-950">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Our <span className="text-indigo-500">Work</span></h2>
            <div className="h-1 w-12 bg-indigo-500 mt-2" />
          </div>
          <Link href="/gallery" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden group bg-zinc-900">
              <img src={item.media?.[0]?.url || item.media?.[0]} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.category_name}</p>
                <h3 className="text-xl font-black uppercase">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- INSTAGRAM REELS SECTION (NO GAP) --- */}
      <section className="py-20 px-6 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto">
           <div className="flex items-center flex-col mb-16 text-center">
             <Camera className="text-indigo-500 mb-4" size={32} />
             <h2 className="text-5xl font-black uppercase tracking-tighter">Live on <span className="text-indigo-600">Instagram</span></h2>
             <p className="text-zinc-500 text-sm mt-2 max-w-sm font-medium uppercase tracking-widest">Watch our events unfold in real-time</p>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {instaFeeds.length > 0 ? (
               instaFeeds.map((reel, i) => (
                 <motion.div whileHover={{ y: -10 }} key={i} className="aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden relative group border border-white/5">
                   <iframe 
                      src={`${reel.url}embed`} 
                      className="w-full h-full border-0" 
                      loading="lazy"
                   />
                   <a href={reel.url} target="_blank" className="absolute inset-0 z-10 bg-black/20 group-hover:bg-transparent transition-colors" />
                 </motion.div>
               ))
             ) : (
               <div className="col-span-full py-20 text-center text-zinc-700 font-bold uppercase tracking-widest">
                 Loading Social Feed...
               </div>
             )}
           </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-32 bg-indigo-600 flex flex-col items-center justify-center text-center px-6">
         <Star className="text-white mb-6 animate-pulse" fill="white" size={40} />
         <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase">Let's create <br /> magic together</h2>
         <Link href="/contact" className="px-12 py-5 bg-black text-white text-xs font-black uppercase tracking-[0.3em] rounded-full hover:bg-white hover:text-black transition-all shadow-2xl">
           Get a Quote
         </Link>
      </section>
    </main>
  );
}