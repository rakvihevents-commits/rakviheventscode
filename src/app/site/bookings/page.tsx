"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Ticket, 
  MapPin,
  Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events (
            title,
            image_url,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (data) setBookings(data || []);
      setLoading(false);
    };

    fetchMyBookings();
  }, []);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const bookingCardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95 
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.15
      }
    })
  };

  const statusVariants = {
    pending: {
      backgroundColor: "#fef3c7",
      color: "#d97706",
      scale: [1, 1.05, 1],
      boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)"
    },
    confirmed: {
      backgroundColor: "#dcfce7",
      color: "#059669",
      scale: [1, 1.08, 1],
      boxShadow: "0 0 25px rgba(5, 150, 105, 0.4)"
    }
  };

  const imageHoverVariants = {
    hover: {
      scale: 1.12,
      rotate: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const buttonHoverVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "#facc15",
      color: "#059669",
      boxShadow: "0 10px 30px rgba(250, 204, 21, 0.4)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
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
          rotate: { repeat: Infinity, duration: 1.2 },
          scale: { duration: 1, repeat: Infinity, repeatType: "reverse" }
        }} 
        className="w-20 h-20 border-4 border-brand-green border-t-transparent rounded-full shadow-2xl"
      />
    </div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-white via-white to-slate-50 dark:from-[#0a0a0a] dark:to-zinc-900 py-6 px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <motion.header 
          className="mb-20 text-center md:text-left"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-sm font-black uppercase tracking-[0.4em] text-brand-yellow mb-2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            History
          </motion.h2>
          <motion.h1 
            className="text-6xl font-black text-brand-green dark:text-white uppercase tracking-tighter"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            My Bookings<span className="text-brand-yellow block md:inline">.</span>
          </motion.h1>
        </motion.header>

        {bookings.length > 0 ? (
          <motion.div 
            className="grid gap-8"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {bookings.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  custom={idx}
                  variants={bookingCardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0,0, 0.15)"
                  }}
                  className="group relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-100/50 dark:border-zinc-800/50 rounded-[2.5rem] p-8 hover:border-brand-green/50 transition-all shadow-lg hover:shadow-2xl"
                >
                  {/* Background shimmer */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ x: -100 }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />

                  <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                    
                    {/* Event Mini-Thumb */}
                    <motion.div 
                      className="w-full lg:w-40 h-40 lg:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shrink-0 border-2 border-slate-200/50 dark:border-zinc-700/50 shadow-lg"
                      variants={imageHoverVariants}
                      whileHover="hover"
                    >
                      <motion.img 
                        src={item.events?.image_url?.[0] || '/placeholder-event.jpg'} 
                        className="w-full h-full object-cover" 
                        alt={item.events?.title}
                        initial={{ scale: 1.1 }}
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.8 }}
                      />
                    </motion.div>

                    {/* Booking Details */}
                    <motion.div 
                      className="flex-1 space-y-4 text-center lg:text-left"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                        <motion.span 
                          className="px-4 py-1.5 rounded-full bg-brand-green/15 text-brand-green text-[9px] font-black uppercase tracking-widest border border-brand-green/20 shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          {item.events?.category}
                        </motion.span>
                        
                        <motion.span 
                          className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-slate-500 border border-slate-200/50 dark:border-zinc-700/50 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Package size={11}/>
                          {item.package_name}
                        </motion.span>
                      </div>

                      <motion.h3 
                        className="text-2xl lg:text-3xl font-black text-brand-green dark:text-white uppercase tracking-tighter line-clamp-1"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {item.events?.title}
                      </motion.h3>

                      <motion.div 
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <motion.div 
                          className="flex items-center gap-1.5"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Calendar size={13} className="text-brand-yellow" />
                          {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center gap-1.5"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Clock size={13} className="text-brand-yellow" />
                          {new Date(item.created_at).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </motion.div>

                        {/* Dynamic Status Badge */}
                        <motion.div
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border`}
                          animate={statusVariants[item.status?.toLowerCase()] || statusVariants.pending}
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle2 size={11} />
                          {item.status}
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Price & Action */}
                    <motion.div 
                      className="text-right flex flex-col items-center lg:items-end gap-6 shrink-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.p 
                        className="text-3xl lg:text-4xl font-black text-brand-green dark:text-brand-yellow tracking-tighter"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, delay: 0.6 }}
                      >
                        ₹{item.package_price?.toLocaleString() || '0'}
                      </motion.p>
                      
                      <motion.div variants={buttonHoverVariants}>
                        <Link href={`/site/events/${item.event_id}`}>
                          <motion.button 
                            className="flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all"
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>View Details</span>
                            <motion.div
                              animate={{ x: [0, 4, 0] }}
                              transition={{ 
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <ArrowRight size={15} />
                            </motion.div>
                          </motion.button>
                        </Link>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* --- EMPTY STATE --- */
          <motion.div 
            className="py-32 text-center bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-zinc-900/50 dark:to-zinc-800/50 rounded-[3rem] border-2 border-dashed border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-brand-green/10 to-brand-yellow/10 border-2 border-brand-green/20 flex items-center justify-center shadow-xl"
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity },
                scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              >
                <Ticket size={44} className="text-brand-green" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-3xl lg:text-4xl font-black uppercase text-brand-green dark:text-white tracking-tighter mb-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              No bookings yet
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 font-black uppercase tracking-widest text-sm mb-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your booking history will appear here.
            </motion.p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/site/events"
                className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-brand-green to-brand-green/90 text-brand-yellow rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-brand-green/30 hover:shadow-brand-yellow/30 hover:from-brand-yellow hover:to-brand-yellow/90 hover:text-brand-green transition-all duration-300 border border-brand-green/20 backdrop-blur-sm"
              >
                <span>Discover Events</span>
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ 
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ArrowRight size={18} />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}