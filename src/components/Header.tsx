"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import Link from 'next/link';
import { useTheme } from "next-themes";
import { 
  Phone, 
  Mail, 
  Clock, 
  Menu, 
  X, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  Bookmark, 
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from './LoginModal';

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [siteData, setSiteData] = useState<any>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    const initializeHeader = async () => {
      const { data: settings } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (settings) setSiteData(settings);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    initializeHeader();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/site/events' },
    { name: 'Gallery', path: '/site/gallery' },
    { name: 'About Us', path: '/site/about' },
    { name: 'Contact', path: '/site/contact' },
  ];

  // Animation Variants
  const logoVariants = {
    initial: { opacity: 0, scale: 0.8, y: -20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const navLinkVariants = {
    initial: { opacity: 0, y: -10 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.4
      }
    })
  };

  const topBarVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { 
      height: "auto", 
      opacity: 1,
      transition: { duration: 0.4, delay: 0.2 }
    }
  };

  const mobileMenuVariants = {
    initial: { 
      clipPath: "inset(100% 0 0 0)",
      opacity: 0 
    },
    animate: { 
      clipPath: "inset(0% 0 0 0)",
      opacity: 1,
      transition: { 
        clipPath: { 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        },
        duration: 0.5
      }
    },
    exit: { 
      clipPath: "inset(100% 0 0 0)",
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const dropdownVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.2 }
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15 }
    }
  };

  // Render static skeleton matching layout dimensions during SSR/Loading to eliminate layout shifting
  if (!siteData || !mounted) {
    return (
      <div className="w-full fixed top-0 z-[100] bg-white dark:bg-black border-b border-slate-100 dark:border-white/10 animate-pulse">
        {/* Mock Top Bar */}
        <div className="bg-brand-green h-10 w-full" />
        {/* Mock Main Nav Bar */}
        <div className="px-6 md:px-12 py-5 flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="h-12 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="hidden lg:flex gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-14 bg-slate-200 dark:bg-zinc-800 rounded" />
            ))}
          </div>
          <div className="h-12 w-32 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <header className="w-full fixed top-0 z-[100] transition-all duration-300">
      
      {/* TOP BAR */}
      <motion.div 
        variants={topBarVariants}
        initial="initial"
        animate="animate"
        className="bg-gradient-to-r from-brand-green to-brand-green/90 text-white py-2.5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-2 backdrop-blur-xl shadow-lg"
      >
        <motion.div 
          className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.a 
            href={`tel:${siteData.phone_number}`} 
            className="flex items-center gap-2 hover:text-brand-yellow transition-all group"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Phone size={12} className="text-brand-yellow group-hover:scale-110 transition-transform" />
            </motion.div>
            {siteData.phone_number}
          </motion.a>
          
          <motion.a 
            href={`mailto:${siteData.email}`} 
            className="flex items-center gap-2 hover:text-brand-yellow transition-all group"
            whileHover={{ scale: 1.05 }}
          >
            <Mail size={12} className="text-brand-yellow group-hover:scale-110 transition-transform" />
            {siteData.email}
          </motion.a>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/90"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Clock size={12} className="animate-pulse" />
          Mon-Sat: 9:00 AM - 6:00 PM
        </motion.div>
      </motion.div>

      {/* MAIN NAVIGATION */}
      <nav className={`px-6 md:px-12 transition-all duration-700 ${
          isScrolled
            ? 'bg-white/95 dark:bg-black/95 backdrop-blur-2xl shadow-2xl py-3 border-b border-brand-green/20'
            : 'bg-white/80 dark:bg-black/80 backdrop-blur-xl py-5 border-b border-slate-100/50 dark:border-white/10'
        }`}>
        <motion.div 
          className="max-w-[1400px] mx-auto flex items-center justify-between"
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 }
          }}
        >
          {/* LOGO */}
          <motion.div variants={logoVariants}>
            <Link href="/" className="flex items-center gap-4 group">
              {siteData.logo_url && (
                <motion.div 
                  className="p-2 bg-gradient-to-br from-brand-green to-brand-green/80 rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.img 
                    src={siteData.logo_url} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain"
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </motion.div>
              )}
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-2xl font-black text-black dark:text-white tracking-tighter uppercase leading-none">
                  {siteData.site_name}<span className="text-brand-yellow">.</span>
                </span>
                <motion.span 
                  className="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-1"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {siteData.tag_line}
                </motion.span>
              </motion.div>
            </Link>
          </motion.div>

          {/* DESKTOP NAV & ACTIONS */}
          <motion.div 
            className="hidden lg:flex items-center gap-12"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { 
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.4
                }
              }
            }}
          >
            {navLinks.map((link, i) => (
              <motion.div key={link.name} custom={i} variants={navLinkVariants}>
                <Link 
                  href={link.path} 
                  className="group relative text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 hover:text-brand-green dark:hover:text-brand-yellow transition-all duration-300"
                >
                  <span>{link.name}</span>
                  <motion.span 
                    className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-yellow to-brand-green rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </Link>
              </motion.div>
            ))}

            {/* THEME TOGGLE */}
            <motion.button 
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} 
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-brand-green dark:text-brand-yellow hover:scale-110 hover:rotate-180 transition-all duration-300 shadow-lg hover:shadow-brand-green/20"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              {mounted && (
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              )}
            </motion.button>

            {/* AUTH SECTION */}
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {/* WISHLIST BUTTON */}
                  <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                    <Link 
                      href="/site/wishlist" 
                      className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-900 dark:to-zinc-800 text-slate-500 hover:text-red-500 hover:from-red-50 hover:to-red-100 dark:hover:from-zinc-800 dark:hover:to-zinc-700 hover:shadow-lg transition-all duration-300 relative shadow-sm"
                      title="My Wishlist"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                          rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                        }}
                      >
                        <Heart size={20} className="group-hover:fill-red-500 transition-all" />
                      </motion.div>
                    </Link>
                  </motion.div>

                  {/* BOOKINGS BUTTON */}
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link 
                      href="/site/bookings" 
                      className="flex items-center gap-2.5 bg-gradient-to-r from-brand-yellow to-brand-yellow/90 text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:from-brand-green hover:to-brand-green hover:text-white transition-all duration-300 shadow-xl shadow-brand-yellow/30 hover:shadow-brand-green/30 active:scale-95"
                    >
                      <Bookmark size={16} />
                      <span>My Books</span>
                    </Link>
                  </motion.div>

                  {/* USER DROPDOWN */}
                  <motion.div 
                    className="group relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.button 
                      className="w-12 h-12 rounded-2xl border-3 border-brand-green/50 p-1 overflow-hidden shadow-xl hover:border-brand-green hover:shadow-brand-green/20 transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {user.user_metadata?.avatar_url ? (
                        <motion.img 
                          src={user.user_metadata.avatar_url} 
                          alt="User" 
                          className="w-full h-full rounded-xl object-cover"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                      ) : (
                        <motion.div 
                          className="w-full h-full bg-gradient-to-br from-brand-green to-brand-yellow text-white flex items-center justify-center rounded-xl shadow-inner"
                          whileHover={{ scale: 1.1 }}
                        >
                          <User size={20} />
                        </motion.div>
                      )}
                    </motion.button>
                    
                    <motion.div 
                      className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50"
                      variants={dropdownVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <motion.div 
                        className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-brand-green/20 rounded-3xl shadow-2xl p-1 w-72 overflow-hidden"
                        whileHover={{ y: -2, scale: 1.02 }}
                      >
                        <motion.div 
                          className="px-6 py-4 bg-gradient-to-r from-brand-green/10 to-brand-yellow/10 rounded-2xl mb-3 border-b border-brand-green/20"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-[10px] font-black text-brand-green dark:text-brand-yellow uppercase tracking-[0.3em] truncate">
                            {user.email}
                          </p>
                        </motion.div>
                        
                        <motion.div
                          className="space-y-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link 
                            href="/site/profile" 
                            className="flex items-center gap-3 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-zinc-300 hover:bg-brand-green/5 hover:text-brand-green rounded-2xl transition-all duration-200"
                            whileHover={{ x: 4 }}
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          
                          <motion.button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all duration-200"
                            whileHover={{ x: 4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <LogOut size={16} />
                            Sign Out
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-3 bg-gradient-to-r from-brand-yellow to-brand-yellow/90 hover:from-brand-green hover:to-brand-green text-black hover:text-white px-10 py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl shadow-brand-yellow/30 hover:shadow-brand-green/30 active:scale-95"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User size={16} />
                  <span>Member Login</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* MOBILE MENU BUTTON */}
          <motion.button 
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 text-brand-green dark:text-brand-yellow rounded-xl hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 transition-all shadow-md"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </motion.button>
        </motion.div>
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="lg:hidden fixed inset-0 top-[115px] bg-gradient-to-b from-white/95 to-white/80 dark:from-black/95 dark:to-black/80 backdrop-blur-2xl z-[90] p-8 space-y-8 shadow-2xl border-t border-brand-green/20"
          >
            <motion.div 
              className="space-y-6 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {navLinks.map((link, i) => (
                <motion.div key={link.name} custom={i}>
                  <Link 
                    href={link.path} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black dark:text-white py-6 px-8 rounded-3xl bg-white/50 dark:bg-black/30 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-300 shadow-xl hover:shadow-brand-green/20"
                    whileHover={{ 
                      scale: 1.02, 
                      y: -8,
                      backgroundColor: "#059669",
                      color: "#ffffff"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* AUTH SECTION MOBILE */}
            <motion.div 
              className="pt-8 border-t border-slate-200/50 dark:border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {user ? (
                <motion.div className="space-y-4">
                  {/* WISHLIST */}
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link 
                      href="/site/wishlist" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter text-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-500/10 dark:to-red-600/10 p-8 rounded-3xl border-2 border-red-200/50 dark:border-red-500/30 hover:border-red-500 hover:shadow-red-500/20 transition-all duration-300 shadow-lg"
                    >
                      <Heart size={36} className="fill-red-500" />
                      <span>My Wishlist</span>
                    </Link>
                  </motion.div>

                  {/* BOOKINGS */}
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link 
                      href="/site/bookings" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-4xl font-black uppercase tracking-tighter text-brand-yellow bg-gradient-to-r from-brand-green to-brand-green/90 p-8 rounded-3xl text-center hover:from-brand-yellow hover:to-brand-yellow/90 hover:text-brand-green transition-all duration-300 shadow-2xl shadow-brand-green/30 hover:shadow-brand-yellow/30"
                    >
                      <div className="flex flex-col items-center gap-3 mb-4">
                        <Bookmark size={40} />
                        <span>My Bookings</span>
                      </div>
                    </Link>
                  </motion.div>

                  {/* USER INFO MOBILE */}
                  <motion.div 
                    className="p-8 bg-gradient-to-r from-brand-green/5 to-brand-yellow/5 rounded-3xl border border-brand-green/20 backdrop-blur-xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {user.user_metadata?.avatar_url ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-3 border-brand-green/50">
                          <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-yellow rounded-2xl flex items-center justify-center border-3 border-brand-green/50">
                          <User size={28} className="text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-black text-brand-green uppercase tracking-wider truncate max-w-[200px]">
                          {user.email}
                        </p>
                        <Link href="/site/profile" className="text-[10px] font-bold text-brand-yellow uppercase tracking-widest hover:underline">
                          View Profile →
                        </Link>
                      </div>
                    </div>
                    
                    <motion.button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 text-xl font-black uppercase tracking-wider text-red-500 bg-red-50/50 dark:bg-red-500/10 p-6 rounded-2xl border-2 border-red-200/50 dark:border-red-500/30 hover:bg-red-100 hover:border-red-400 transition-all duration-300 shadow-lg"
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut size={28} />
                      <span>Sign Out</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => {
                    setIsLoginOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-brand-yellow to-brand-yellow/90 text-black px-12 py-8 rounded-3xl text-xl font-black uppercase tracking-[0.1em] shadow-2xl shadow-brand-yellow/30 hover:from-brand-green hover:to-brand-green hover:text-white hover:shadow-brand-green/30 transition-all duration-300 active:scale-95"
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User size={32} />
                  <span>Member Login</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}