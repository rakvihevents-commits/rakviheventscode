"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/utils/supabase";
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Trash2, 
  ArrowRight, 
  CheckCircle2,
  ChevronLeft,
  Heart
} from 'lucide-react';

// --- TYPED FRAMER MOTION VARIANTS ---
// --- TYPED FRAMER MOTION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.8 
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.1
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -30,
    rotateX: 90,
    transition: { duration: 0.4 }
  }
};

const cardHoverVariants: Variants = {
  hover: {
    y: -12,
    scale: 1.03,
    boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const trashVariants: Variants = {
  hover: {
    scale: 1.15,
    rotate: 10,
    backgroundColor: "#ef4444",
    boxShadow: "0 8px 25px rgba(239, 68, 68, 0.4)"
  },
  tap: {
    scale: 0.95,
    rotate: 5
  }
};

const servicesContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const serviceItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (idx: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: idx * 0.1 }
  })
};

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          event_id,
          events (
            id,
            title,
            price,
            image_url,
            category,
            description,
            services_included
          )
        `)
        .eq('user_id', session.user.id);

      if (!error && data) {
        setWishlistItems(data);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  const removeItem = async (wishlistId: string) => {
    const itemToRemove = document.querySelector(`[data-wishlist-id="${wishlistId}"]`);
    if (itemToRemove) {
      itemToRemove.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(0)' }
      ], { duration: 300, easing: 'ease-in-out' });
    }

    const { error } = await supabase.from('wishlist').delete().eq('id', wishlistId);
    if (!error) {
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-slate-50 dark:from-[#0a0a0a] dark:to-zinc-900">
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }} 
        transition={{ 
          rotate: { repeat: Infinity, duration: 1 },
          scale: { duration: 0.8, repeat: Infinity, repeatType: "reverse" }
        }} 
        className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full shadow-2xl"
      />
    </div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-white via-white to-slate-50 dark:from-[#0a0a0a] dark:to-zinc-900 pt-12 pb-20 transition-colors duration-500"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- HEADER SECTION --- */}
        <motion.section
          ref={headerRef}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              staggerChildren: 0.1,
              duration: 0.8
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/site/events" 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-green mb-4 transition-all inline-flex"
              >
                <ChevronLeft size={14} />
                <span>Back to Gallery</span>
              </Link>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-black text-brand-green dark:text-white uppercase tracking-tighter leading-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            >
              My Wishlist<span className="text-brand-yellow block md:inline">.</span>
            </motion.h1>
            
            <motion.p 
              className="text-slate-500 mt-4 font-black uppercase tracking-[0.3em] text-[10px]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {wishlistItems.length} Saved Collections
            </motion.p>
          </motion.div>
        </motion.section>

        {/* --- EVENTS GRID --- */}
        <main ref={gridRef} className="mt-5">
          {wishlistItems.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              variants={containerVariants}
              initial="hidden"
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              animate="visible"
            >
              <AnimatePresence mode='popLayout'>
                {wishlistItems.map((item, i) => {
                  const event = item.events;
                  return (
                    <motion.div
                      key={item.id}
                      data-wishlist-id={item.id}
                      layout
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover="hover"
                      className="group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-slate-100/50 dark:border-zinc-800/50 hover:shadow-2xl hover:border-brand-yellow/30 transition-all relative"
                    >
                      {/* TRASH ICON */}
                      <motion.button 
                        onClick={() => removeItem(item.id)}
                        variants={trashVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="absolute top-5 right-5 z-30 p-3 rounded-2xl bg-white/95 dark:bg-black/70 backdrop-blur-md shadow-xl transition-all border border-slate-200/50 dark:border-zinc-700/50"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0]
                          }}
                          transition={{ 
                            duration: 0.4,
                            repeat: Infinity,
                            repeatDelay: 1.5
                          }}
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </motion.div>
                      </motion.button>

                      {/* Image Container */}
                      <motion.div 
                        className="relative h-64 overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                      >
                        <motion.img 
                          src={event.image_url?.[0] || '/placeholder-event.jpg'} 
                          className="w-full h-full object-cover" 
                          alt={event.title}
                          initial={{ scale: 1.1 }}
                          whileHover={{ scale: 1.15 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute top-5 left-5 bg-brand-green/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-brand-yellow shadow-lg shadow-brand-green/25"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, delay: 0.2 }}
                        >
                          {event.category}
                        </motion.div>
                      </motion.div>

                      <motion.div 
                        className="p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div 
                          className="flex justify-between items-start mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.h3 
                            className="text-xl font-black uppercase tracking-tighter text-brand-green dark:text-white line-clamp-1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {event.title}
                          </motion.h3>
                          <motion.p 
                            className="text-lg font-black text-brand-green dark:text-brand-yellow"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                          >
                            ₹{event.price?.toLocaleString() || '0'}
                          </motion.p>
                        </motion.div>

                        <motion.p 
                          className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-6 font-medium leading-relaxed"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          {event.description}
                        </motion.p>

                        <motion.div 
                          className="flex flex-wrap gap-2 mb-8"
                          initial="hidden"
                          animate="visible"
                          variants={servicesContainerVariants}
                        >
                          {event.services_included?.slice(0, 2).map((service: string, idx: number) => (
                            <motion.div 
                              key={idx}
                              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400"
                              variants={serviceItemVariants}
                              custom={idx}
                              whileHover={{ x: 5, scale: 1.05 }}
                            >
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 360, 0]
                                }}
                                transition={{ 
                                  duration: 0.6,
                                  repeat: Infinity,
                                  repeatDelay: 2
                                }}
                              >
                                <CheckCircle2 size={10} className="text-brand-yellow" />
                              </motion.div>
                              {service}
                            </motion.div>
                          ))}
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="overflow-hidden"
                        >
                          <Link href={`/site/events/${event.id}`}>
                            <motion.button 
                              className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-700 text-brand-green dark:text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-sm border border-slate-200/50 dark:border-zinc-600/50 hover:shadow-lg transition-all"
                              whileHover={{ 
                                scale: 1.02,
                                backgroundColor: "#facc15",
                                color: "#059669",
                                boxShadow: "0 10px 30px rgba(250, 204, 21, 0.4)"
                              }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 400,
                                damping: 17
                              }}
                            >
                              <span>Discover More</span>
                              <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ 
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <ArrowRight size={14} />
                              </motion.div>
                            </motion.button>
                          </Link>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* --- EMPTY STATE --- */
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="py-32 text-center"
            >
              <motion.div 
                className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-zinc-900/80 dark:to-zinc-800/80 flex items-center justify-center border-2 border-slate-100/50 dark:border-zinc-800/50 mx-auto mb-8 backdrop-blur-xl shadow-2xl"
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, 5, -5, 0],
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <Heart size={48} className="text-slate-200 dark:text-zinc-700" />
                </motion.div>
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-black uppercase text-brand-green dark:text-white tracking-tighter mb-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Your wishlist is empty
              </motion.h2>
              
              <motion.p 
                className="text-slate-400 font-medium mt-2 mb-10 text-xs uppercase tracking-widest"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                No luxury experiences saved yet.
              </motion.p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/site/events" 
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-green to-brand-green/90 text-brand-yellow px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-green/25 hover:shadow-brand-yellow/25 hover:from-brand-yellow hover:to-brand-yellow/90 hover:text-brand-green transition-all duration-300 border border-brand-green/20 backdrop-blur-sm"
                >
                  <span>Explore Events</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight size={16} />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </motion.div>
  );
}