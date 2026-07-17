"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  CheckCircle2,
  Package,
  ArrowRight,
  Ticket,
  MapPin,
  Clock,
  Radio,
  Users2,
  XCircle,
  QrCode,
  X,
  User,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

type TabKey = 'events' | 'live';

// A single person on a booking — primary booker or additional guest
interface GuestEntry {
  name: string;
  email: string;
  isPrimary?: boolean;
}

// ✅ Normalized shape so both `bookings` and `live_event_bookings` rows can
// share the exact same card UI below.
interface NormalizedBooking {
  id: string;
  title: string;
  image: string | null;
  category: string | null;
  packageLabel: string | null;
  price: number;
  status: string; // 'pending' | 'confirmed' | 'paid' | 'failed'
  createdAt: string;
  detailHref: string;
  numberOfPeople?: number;
  location?: string | null;
  // ✅ NEW — only populated for live_event_bookings, used for the scan modal
  ticketCode?: string | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  // ✅ NEW — primary booker + every additional guest's name/email
  guests?: GuestEntry[];
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [eventBookings, setEventBookings] = useState<NormalizedBooking[]>([]);
  const [liveBookings, setLiveBookings] = useState<NormalizedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ NEW — which booking's QR is currently open in the modal
  const [scanBooking, setScanBooking] = useState<NormalizedBooking | null>(null);

  // ✅ NEW — which booking's guest list is currently open in the modal
  const [guestListBooking, setGuestListBooking] = useState<NormalizedBooking | null>(null);

  useEffect(() => {
    const fetchMyBookings = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setEventBookings([]);
        setLiveBookings([]);
        setLoading(false);
        return;
      }

      const [eventsRes, liveRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            events (
              title,
              image_url,
              category
            )
          `)
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),

        // ✅ live_event_bookings joined with live_events (for title/image/
        // category/location) and live_event_packages (for the package name,
        // when the booking wasn't a general-entry booking).
        supabase
          .from('live_event_bookings')
          .select(`
            *,
            live_events (
              title,
              image_urls,
              category,
              location,
              start_date
            ),
            live_event_packages (
              package_name,
              price
            )
          `)
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ]);

      const normalizedEvents: NormalizedBooking[] = (eventsRes.data || []).map((item: any) => ({
        id: item.id,
        title: item.events?.title || 'Untitled Event',
        image: item.events?.image_url?.[0] || null,
        category: item.events?.category || null,
        packageLabel: item.package_name || null,
        price: Number(item.package_price || 0),
        status: (item.status || 'pending').toLowerCase(),
        createdAt: item.created_at,
        detailHref: `/site/events/${item.event_id}`,
      }));

      const normalizedLive: NormalizedBooking[] = (liveRes.data || []).map((item: any) => {
        // Primary booker (whoever paid) + every additional guest stored in
        // the additional_guests jsonb column, e.g.
        // [{ name: "Rohan", email: "rohan@example.com" }, ...]
        const additional: GuestEntry[] = Array.isArray(item.additional_guests)
          ? item.additional_guests.map((g: any) => ({ name: g?.name || '', email: g?.email || '' }))
          : [];
        const guests: GuestEntry[] = [
          { name: item.name || 'Primary Booker', email: item.email || '', isPrimary: true },
          ...additional,
        ];

        return {
          id: item.id,
          title: item.live_events?.title || 'Untitled Event',
          image: item.live_events?.image_urls?.[0] || null,
          category: item.live_events?.category || null,
          packageLabel: item.live_event_packages?.package_name || 'General Entry',
          price: Number(item.amount || 0),
          // ✅ live_event_bookings uses `payment_status`, not `status`, and its
          // values are 'pending' | 'paid' | 'failed' rather than 'confirmed'.
          status: (item.payment_status || 'pending').toLowerCase(),
          createdAt: item.created_at,
          // ✅ Route matches the live event detail page at
          // /site/events/live/[id]/page.tsx
          detailHref: `/site/events/live/${item.live_event_id}`,
          numberOfPeople: item.number_of_people,
          location: item.live_events?.location || null,
          // ✅ NEW — comes straight off the row (added via the migration)
          ticketCode: item.ticket_code || null,
          isCheckedIn: !!item.is_checked_in,
          checkedInAt: item.checked_in_at || null,
          guests,
        };
      });

      setEventBookings(normalizedEvents);
      setLiveBookings(normalizedLive);
      setLoading(false);
    };

    fetchMyBookings();
  }, []);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const bookingCardVariants: Variants = {
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

  const statusVariants: any = {
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
    },
    // ✅ live_event_bookings.payment_status values
    paid: {
      backgroundColor: "#dcfce7",
      color: "#059669",
      scale: [1, 1.08, 1],
      boxShadow: "0 0 25px rgba(5, 150, 105, 0.4)"
    },
    failed: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      scale: [1, 1.05, 1],
      boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)"
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'failed') return <XCircle size={11} />;
    return <CheckCircle2 size={11} />;
  };

  const imageHoverVariants: Variants = {
    hover: {
      scale: 1.12,
      rotate: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const buttonHoverVariants: Variants = {
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

  const activeBookings = activeTab === 'events' ? eventBookings : liveBookings;

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
          className="mb-10 text-center md:text-left"
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

        {/* --- TABS --- */}
        <motion.div
          className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full border border-slate-200 dark:border-white/5 w-fit mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all ${
              activeTab === 'events'
                ? 'bg-white dark:bg-zinc-800 text-brand-green dark:text-brand-yellow shadow-md'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <Ticket size={14} />
            Events ({eventBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all ${
              activeTab === 'live'
                ? 'bg-white dark:bg-zinc-800 text-brand-green dark:text-brand-yellow shadow-md'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <Radio size={14} />
            Live Events ({liveBookings.length})
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeBookings.length > 0 ? (
              <motion.div
                className="grid gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {activeBookings.map((item, idx) => (
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
                            src={item.image || '/placeholder-event.jpg'}
                            className="w-full h-full object-cover"
                            alt={item.title}
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
                            {item.category && (
                              <motion.span
                                className="px-4 py-1.5 rounded-full bg-brand-green/15 text-brand-green text-[9px] font-black uppercase tracking-widest border border-brand-green/20 shadow-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                {item.category}
                              </motion.span>
                            )}

                            {item.packageLabel && (
                              <motion.span
                                className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-slate-500 border border-slate-200/50 dark:border-zinc-700/50 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                <Package size={11}/>
                                {item.packageLabel}
                              </motion.span>
                            )}

                            {activeTab === 'live' && item.numberOfPeople && (
                              <motion.span
                                className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-slate-500 border border-slate-200/50 dark:border-zinc-700/50 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                <Users2 size={11}/>
                                {item.numberOfPeople} {item.numberOfPeople > 1 ? 'People' : 'Person'}
                              </motion.span>
                            )}

                            {/* ✅ NEW — checked-in badge for live events */}
                            {activeTab === 'live' && item.isCheckedIn && (
                              <motion.span
                                className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                <CheckCircle2 size={11}/>
                                Checked In
                              </motion.span>
                            )}
                          </div>

                          <motion.h3
                            className="text-2xl lg:text-3xl font-black text-brand-green dark:text-white uppercase tracking-tighter line-clamp-1"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {item.title}
                          </motion.h3>

                          {activeTab === 'live' && item.location && (
                            <p className="flex items-center justify-center lg:justify-start gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                              <MapPin size={13} className="text-brand-yellow" />
                              {item.location}
                            </p>
                          )}

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
                              {new Date(item.createdAt).toLocaleDateString('en-IN')}
                            </motion.div>

                            <motion.div
                              className="flex items-center gap-1.5"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Clock size={13} className="text-brand-yellow" />
                              {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </motion.div>

                            {/* Dynamic Status Badge */}
                            <motion.div
                              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border`}
                              animate={statusVariants[item.status] || statusVariants.pending}
                              whileHover={{ scale: 1.08 }}
                              transition={{ duration: 0.3 }}
                            >
                              {statusIcon(item.status)}
                              {item.status}
                            </motion.div>
                          </motion.div>

                          {/* ✅ NEW — Guest List trigger, only shown for group bookings */}
                          {activeTab === 'live' && item.guests && item.guests.length > 1 && (
                            <motion.button
                              onClick={() => setGuestListBooking(item)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50 text-slate-500 text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                            >
                              <Users2 size={12} />
                              View Guest List ({item.guests.length})
                            </motion.button>
                          )}
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
                            ₹{item.price?.toLocaleString('en-IN') || '0'}
                          </motion.p>

                          {/* ✅ Scan + View Details sit side by side */}
                          <div className="flex items-center gap-3">
                            {activeTab === 'live' && item.status === 'paid' && (
                              <motion.button
                                onClick={() => setScanBooking(item)}
                                whileHover={{
                                  scale: 1.05,
                                  boxShadow: "0 10px 30px rgba(5, 150, 105, 0.25)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl border shadow-lg hover:shadow-xl transition-all ${
                                  item.isCheckedIn
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                    : 'text-brand-green bg-brand-yellow/20 dark:bg-brand-yellow/10 border-brand-yellow/40'
                                }`}
                              >
                                <QrCode size={15} />
                                <span>{item.isCheckedIn ? 'View Pass' : 'Scan'}</span>
                              </motion.button>
                            )}

                            <motion.div variants={buttonHoverVariants}>
                              <Link href={item.detailHref}>
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
                          </div>
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
                    {activeTab === 'live' ? (
                      <Radio size={44} className="text-brand-green" />
                    ) : (
                      <Ticket size={44} className="text-brand-green" />
                    )}
                  </motion.div>
                </motion.div>

                <motion.h2
                  className="text-3xl lg:text-4xl font-black uppercase text-brand-green dark:text-white tracking-tighter mb-4"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  No {activeTab === 'live' ? 'live event ' : ''}bookings yet
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
                    href={activeTab === 'live' ? '/site/events?filter=live' : '/site/events'}
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ✅ QR Scan Modal */}
      <AnimatePresence>
        {scanBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setScanBooking(null)}
          >
            <motion.div
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-zinc-800"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setScanBooking(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter text-brand-green dark:text-white line-clamp-1">
                  {scanBooking.title}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {scanBooking.numberOfPeople
                    ? `${scanBooking.numberOfPeople} ${scanBooking.numberOfPeople > 1 ? 'People' : 'Person'}`
                    : 'Entry Pass'}
                </p>
              </div>

              {scanBooking.isCheckedIn ? (
                <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                  <p className="text-sm font-black uppercase tracking-widest text-emerald-600 text-center">
                    Already Checked In
                  </p>
                  {scanBooking.checkedInAt && (
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {new Date(scanBooking.checkedInAt).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              ) : scanBooking.ticketCode ? (
                <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700">
                  <div className="p-4 bg-white rounded-2xl">
                    <QRCodeSVG value={scanBooking.ticketCode} size={200} level="H" />
                  </div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-400">
                    {scanBooking.ticketCode}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Show this at entry — single use only
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border border-dashed border-slate-200 dark:border-zinc-700">
                  <XCircle size={32} className="text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">
                    No ticket code found for this booking
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NEW — Guest List Modal */}
      <AnimatePresence>
        {guestListBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGuestListBooking(null)}
          >
            <motion.div
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-zinc-800 max-h-[80vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setGuestListBooking(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6 shrink-0">
                <h3 className="text-lg font-black uppercase tracking-tighter text-brand-green dark:text-white line-clamp-1">
                  {guestListBooking.title}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {guestListBooking.guests?.length || 0} {(guestListBooking.guests?.length || 0) > 1 ? 'People' : 'Person'} on this booking
                </p>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {guestListBooking.guests?.map((guest, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                      <User size={16} className="text-brand-green" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-black dark:text-white truncate">
                        {guest.name || 'Unnamed Guest'}
                        {guest.isPrimary && (
                          <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-brand-green">Primary</span>
                        )}
                      </p>
                      {guest.email && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail size={10} /> {guest.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}