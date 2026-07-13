"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from "framer-motion";
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
import LoginModal from './LoginModal';

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [siteData, setSiteData] = useState<any>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const MotionLink = motion(Link);

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

  // ---------- Animation variants ----------
  const logoVariants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const navLinkVariants: Variants = {
    initial: { opacity: 0, y: -8 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.05 + i * 0.04, duration: 0.3 }
    })
  };

  const topBarVariants: Variants = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1, transition: { duration: 0.3 } }
  };

  const mobileMenuVariants: Variants = {
    initial: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
    animate: {
      clipPath: "inset(0 0 0% 0)",
      opacity: 1,
      transition: { clipPath: { type: "spring", stiffness: 320, damping: 32 }, duration: 0.4 }
    },
    exit: { clipPath: "inset(0 0 100% 0)", opacity: 0, transition: { duration: 0.25 } }
  };

  const dropdownVariants: Variants = {
    initial: { opacity: 0, scale: 0.97, y: -6 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.12 } }
  };

  // ---------- Loading skeleton (matches final layout to avoid CLS) ----------
  if (!siteData || !mounted) {
    return (
      <div className="w-full fixed top-0 z-[100] bg-white dark:bg-black border-b border-slate-100 dark:border-white/10 animate-pulse">
        <div className="bg-brand-green h-9 w-full" />
        <div className="px-6 md:px-12 py-3.5 flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="h-10 w-32 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="hidden lg:flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            ))}
          </div>
          <div className="h-10 w-28 bg-slate-200 dark:bg-zinc-800 rounded-full" />
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
        className="bg-brand-green text-white py-2 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-1.5 text-[11px]"
      >
        <div className="flex items-center gap-5 font-semibold tracking-wide">
          <a
            href={`tel:${siteData.phone_number}`}
            className="flex items-center gap-1.5 hover:text-brand-yellow transition-colors"
          >
            <Phone size={12} className="text-brand-yellow" />
            {siteData.phone_number}
          </a>

          <a
            href={`mailto:${siteData.email}`}
            className="flex items-center gap-1.5 hover:text-brand-yellow transition-colors"
          >
            <Mail size={12} className="text-brand-yellow" />
            {siteData.email}
          </a>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-white/85">
          <Clock size={12} />
          Mon–Sat: 9:00 AM – 6:00 PM
        </div>
      </motion.div>

      {/* MAIN NAVIGATION */}
      <nav
        className={`px-6 md:px-12 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-md py-2.5 border-slate-200 dark:border-white/10'
            : 'bg-white dark:bg-black py-4 border-slate-100 dark:border-white/5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">

          {/* LOGO */}
          <motion.div variants={logoVariants} initial="initial" animate="animate">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              {siteData.logo_url && (
                <div className="w-10 h-10 rounded-lg bg-brand-green/5 flex items-center justify-center overflow-hidden">
                  <img
                    src={siteData.logo_url}
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-black text-black dark:text-white tracking-tight uppercase">
                  {siteData.site_name}<span className="text-brand-yellow">.</span>
                </span>
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-widest">
                  {siteData.tag_line}
                </span>
              </div>
            </Link>
          </motion.div>

          {/* DESKTOP NAV — compact pill tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 p-1 rounded-full border border-slate-100 dark:border-white/5">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.name}
                custom={i}
                variants={navLinkVariants}
                initial="initial"
                animate="animate"
              >
                <MotionLink
                  href={link.path}
                  className="block text-[12px] font-bold uppercase tracking-wide text-slate-600 dark:text-zinc-300 px-4 py-2 rounded-full hover:bg-brand-green hover:text-white transition-colors duration-200"
                  whileTap={{ scale: 0.96 }}
                >
                  {link.name}
                </MotionLink>
              </motion.div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">

            {/* THEME TOGGLE */}
            <motion.button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full bg-slate-50 dark:bg-zinc-900 text-brand-green dark:text-brand-yellow hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>

            {/* AUTH SECTION */}
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* WISHLIST */}
                  <Link
                    href="/site/wishlist"
                    className="p-2.5 rounded-full bg-slate-50 dark:bg-zinc-900 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="My Wishlist"
                  >
                    <Heart size={16} />
                  </Link>

                  {/* BOOKINGS */}
                  <Link
                    href="/site/bookings"
                    className="flex items-center gap-2 bg-brand-yellow text-black px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-brand-green hover:text-white transition-colors"
                  >
                    <Bookmark size={14} />
                    <span>My Books</span>
                  </Link>

                  {/* USER DROPDOWN */}
                  <div className="group relative">
                    <button className="w-9 h-9 rounded-full border-2 border-brand-green/40 p-0.5 overflow-hidden hover:border-brand-green transition-colors">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="User"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-green text-white flex items-center justify-center rounded-full">
                          <User size={16} />
                        </div>
                      )}
                    </button>

                    <motion.div
                      className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50"
                      variants={dropdownVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/10 rounded-2xl shadow-xl p-1.5 w-60 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl mb-1">
                          <p className="text-[10px] font-bold text-brand-green dark:text-brand-yellow uppercase tracking-wider truncate">
                            {user.email}
                          </p>
                        </div>

                        <Link
                          href="/site/profile"
                          className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 hover:bg-brand-green/5 hover:text-brand-green rounded-xl transition-colors"
                        >
                          <User size={14} />
                          My Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 bg-brand-yellow text-black px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-brand-green hover:text-white transition-colors shadow-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <User size={14} />
                  <span>Member Login</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-brand-green dark:text-brand-yellow rounded-lg hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
            className="lg:hidden fixed inset-0 top-[100px] bg-white dark:bg-black z-[90] p-6 space-y-6 overflow-y-auto"
          >
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-2xl font-black uppercase tracking-tight text-black dark:text-white py-4 px-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-brand-green hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* AUTH SECTION MOBILE */}
            <div className="pt-6 border-t border-slate-100 dark:border-white/10">
              {user ? (
                <div className="space-y-3">
                  <Link
                    href="/site/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base font-black uppercase tracking-tight text-red-500 bg-red-50 dark:bg-red-500/10 p-5 rounded-2xl"
                  >
                    <Heart size={20} className="fill-red-500" />
                    <span>My Wishlist</span>
                  </Link>

                  <Link
                    href="/site/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-3 text-base font-black uppercase tracking-tight text-white bg-brand-green p-5 rounded-2xl"
                  >
                    <Bookmark size={20} />
                    <span>My Bookings</span>
                  </Link>

                  <div className="p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      {user.user_metadata?.avatar_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-brand-green/40">
                          <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center">
                          <User size={22} className="text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black text-brand-green uppercase tracking-wide truncate max-w-[180px]">
                          {user.email}
                        </p>
                        <Link
                          href="/site/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-[10px] font-bold text-brand-yellow uppercase tracking-widest hover:underline"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 text-sm font-black uppercase tracking-wide text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsLoginOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-brand-yellow text-black px-8 py-5 rounded-2xl text-base font-black uppercase tracking-wide shadow-md"
                >
                  <User size={20} />
                  <span>Member Login</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}