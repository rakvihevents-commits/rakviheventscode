"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence, useAnimation, useInView, Variants } from "framer-motion"; 
import { 
  ArrowRight, 
  CheckCircle2, 
  Heart,
  ChevronDown,
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// --- Types ---
interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  image_url: string[];
  status: string;
  services_included: string[];
}

// --- TYPED ANIMATION VARIANTS ---
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
    y: -20,
    transition: { duration: 0.3 }
  }
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  }
};

const heartVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  liked: {
    scale: [1, 1.3, 1.1],
    rotate: [0, 360],
    fill: "#ef4444",
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  unliked: {
    scale: [1.1, 1],
    rotate: [-360, 0],
    transition: {
      duration: 0.3
    }
  }
};

export default function EventsPage() {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [user, setUser] = useState<any>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);
  
  const controls = useAnimation();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchUserWishlist(session.user.id);
      fetchEvents();
    };
    init();
  }, []);

  useEffect(() => {
    if (inView) {
      controls.start("animate");
    }
  }, [inView, controls]);

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUserWishlist = async (userId: string) => {
    const { data } = await supabase.from('wishlist').select('event_id').eq('user_id', userId);
    if (data) setWishlistIds(data.map(i => i.event_id));
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').eq('status', 'Active').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      setFilteredEvents(data);
      const uniqueCats = ['All', ...Array.from(new Set(data.map((item: any) => item.category)))];
      setCategories(uniqueCats);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = [...events];

    if (searchQuery) {
      result = result.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategory !== 'All') {
      result = result.filter(e => e.category === activeCategory);
    }

    if (sortBy === 'low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high') result.sort((a, b) => b.price - a.price);
    
    setFilteredEvents(result);
  }, [searchQuery, activeCategory, sortBy, events]);

  const toggleWishlist = async (eventId: string) => {
    if (!user) {
      setToast({ show: true, msg: "Please login to manage your wishlist!" });
      return;
    }

    const isWishlisted = wishlistIds.includes(eventId);
    if (isWishlisted) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('event_id', eventId);
      if (!error) setWishlistIds(prev => prev.filter(id => id !== eventId));
    } else {
      const { error } = await supabase.from('wishlist').insert({ user_id: user.id, event_id: eventId });
      if (!error) setWishlistIds(prev => [...prev, eventId]);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-zinc-100 transition-colors duration-500 pb-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      
      {/* --- PREMIUM TOAST --- */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.9 }}
            className="fixed bottom-10 left-1/2 z-[200] flex items-center gap-3 bg-brand-green text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <AlertCircle size={20} className="text-brand-yellow" />
            </motion.div>
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.msg}</span>
            <motion.button 
              whileHover={{ scale: 0.9 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO BANNER --- */}
      <motion.section 
        variants={heroVariants}
        className="relative h-[35vh] flex items-center justify-center overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent z-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.img 
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Banner"
          initial={{ scale: 1.2, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <motion.div 
          className="relative z-20 text-center px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Signature <span className="text-brand-yellow">Events</span>
          </motion.h1>
          <motion.p 
            className="text-white/50 text-[10px] font-black uppercase tracking-[0.5em] mt-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Crafting Memories
          </motion.p>
        </motion.div>
      </motion.section>

      {/* --- FILTER & SEARCH BAR --- */}
      <motion.div
        ref={containerRef}
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 }
        }}
        className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-900 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Search Input */}
            <motion.div 
              className="relative flex-1 max-w-md group"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Search size={18} />
              </motion.div>
              <input 
                type="text" 
                placeholder="Search event, wedding, party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-zinc-900/50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand-green transition-all"
              />
            </motion.div>

            {/* Sorting & Stats */}
            <motion.div 
              className="flex items-center gap-4 self-end lg:self-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span 
                className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 }}
              >
                Showing {filteredEvents.length} Results
              </motion.span>
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-brand-green text-brand-yellow px-8 py-3 pr-12 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none border-none shadow-lg shadow-brand-green/20"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-yellow pointer-events-none" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Categories Horizontal Scroll */}
          <motion.div 
            className="flex gap-2 overflow-x-auto no-scrollbar py-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {categories.map((cat, i) => (
              <motion.button
                key={cat}
                custom={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.8, y: 20 },
                  visible: (idx: number) => ({
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      delay: idx * 0.05
                    }
                  })
                }}
                whileHover={{ 
                  scale: 1.1, 
                  y: -2,
                  boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? 'bg-brand-yellow text-brand-green shadow-lg shadow-brand-yellow/25' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* --- EVENTS GRID --- */}
      <main className="max-w-7xl mx-auto px-6 mt-12">
        {loading ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {[1,2,3].map((i) => (
              <motion.div 
                key={i}
                className="h-96 rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-900 dark:to-zinc-800 animate-pulse"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  background: [
                    "linear-gradient(90deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)",
                    "linear-gradient(90deg, #f8fafc 0%, #cbd5e1 50%, #f8fafc 100%)"
                  ]
                }}
                transition={{ 
                  duration: 1.5,
                  background: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            variants={containerVariants}
          >
            <AnimatePresence mode='popLayout'>
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  layout
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    y: -10,
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800 relative"
                >
                  {/* WISHLIST HEART */}
                  <motion.button 
                    onClick={() => toggleWishlist(event.id)}
                    className="absolute top-5 right-5 z-30 p-3 rounded-2xl bg-white/90 dark:bg-black/60 backdrop-blur-md shadow-lg transition-all"
                    variants={heartVariants}
                    initial="initial"
                    animate={wishlistIds.includes(event.id) ? "liked" : "unliked"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart size={18} />
                  </motion.button>

                  {/* Image Container */}
                  <motion.div 
                    className="relative h-64 overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.img 
                      src={event.image_url?.[0]} 
                      className="w-full h-full object-cover"
                      alt={event.title}
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-5 left-5 bg-brand-green/90 backdrop-blur-md px-4 py-1 rounded-full text-[9px] font-black uppercase text-brand-yellow"
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
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                      >
                        ₹{event.price.toLocaleString()}
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
                      variants={{
                        hidden: {},
                        visible: {
                          transition: {
                            staggerChildren: 0.1
                          }
                        }
                      }}
                    >
                      {event.services_included.slice(0, 2).map((service, idx) => (
                        <motion.div 
                          key={idx}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400"
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              transition: { delay: idx * 0.1 }
                            }
                          }}
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
                          className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-brand-green dark:text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 group-hover:bg-brand-yellow group-hover:text-brand-green transition-all shadow-sm"
                          whileHover={{ 
                            scale: 1.02,
                            backgroundColor: "#facc15",
                            color: "#059669"
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
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty Search State */}
        {!loading && filteredEvents.length === 0 && (
          <motion.div 
            className="py-20 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-black uppercase text-slate-300 tracking-tighter"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              No events match your search
            </motion.h2>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}