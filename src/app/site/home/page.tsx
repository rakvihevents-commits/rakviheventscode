"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Fraunces, Inter } from "next/font/google";
import {
  MoveRight,
  Camera,
  CalendarDays,
  MapPin,
  Users,
  ArrowUpRight,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Type pairing — a characterful serif for display, a quiet grotesk   */
/*  for structure/labels. Loaded once, applied via CSS variables.      */
/* ------------------------------------------------------------------ */

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

/* ------------------------------------------------------------------ */
/*  Types matching your Supabase schema                                */
/* ------------------------------------------------------------------ */

type LiveEvent = {
  id: string;
  title: string;
  category: string | null;
  cover_charge: number | null;
  capacity: number | null;
  location: string;
  start_date: string;
  end_date: string | null;
  status: string | null;
  description: string | null;
  perks: string[] | null;
  image_urls: string[] | null;
  created_at: string | null;
  min_group_size: number;
};

type EventItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price: number;
  image_url: string[] | null;
  status: "Active" | "Inactive" | "Cancel" | string;
};

type InstagramFeed = {
  id: string;
  url: string;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/*  Palette tokens (brass / ivory / ink — kept out of the arbitrary    */
/*  Tailwind-blue-on-black default) — reused as literal classes below  */
/* ------------------------------------------------------------------ */
// accent (light):  #8A6A2F   accent (dark): #D9B565
// paper (light):   #FAF8F2   paper alt:     #F2ECDD
// ink (dark bg):   #0B0A08   ink alt:       #141210

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const formatPrice = (n: number | null | undefined) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : null;

const formatDate = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const firstImage = (img: string[] | null | undefined) => {
  if (!img || img.length === 0) return null;
  return img[0];
};

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
};

const statusStyles: Record<string, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Inactive:
    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  Cancel: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

/* Roman numerals — used as the section eyebrow. The sections read as a
   programme (the order an evening / engagement with the brand unfolds),
   so a numbered rundown is doing real work here, not decorating. */
const numerals = ["I", "II", "III", "IV"];

/* ------------------------------------------------------------------ */
/*  Section heading — shared so the "programme" numbering stays exact  */
/* ------------------------------------------------------------------ */

function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  viewAllHref,
}: {
  index: number;
  eyebrow: string;
  title: React.ReactNode;
  accent: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex justify-between items-end mb-12 gap-6">
      <div>
        <p className="flex items-baseline gap-3 text-[11px] font-semibold tracking-[0.35em] uppercase text-zinc-400 dark:text-zinc-600 mb-3">
          <span className="text-[#8A6A2F] dark:text-[#D9B565] font-serif italic text-base tracking-normal">
            {numerals[index]}
          </span>
          {eyebrow}
        </p>
        <h2
          className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <div className="h-px w-16 bg-[#8A6A2F] dark:bg-[#D9B565] mt-4" />
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400 hover:text-[#8A6A2F] dark:hover:text-[#D9B565] transition-colors pb-1 border-b border-transparent hover:border-current"
        >
          View all
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [sliders, setSliders] = useState<any[]>([]);
  const [instaFeeds, setInstaFeeds] = useState<InstagramFeed[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [{ data: sld }, { data: inst }, { data: gal }, { data: live }, { data: evts }] =
          await Promise.all([
            supabase.from("home_sliders").select("*").eq("active_status", true).order("display_order"),
            supabase.from("instagram_feeds").select("*").order("created_at", { ascending: false }).limit(4),
            supabase.from("gallery").select("*").order("created_at", { ascending: false }).limit(6),
            supabase
              .from("live_events")
              .select("*")
              .order("start_date", { ascending: true })
              .limit(6),
            supabase
              .from("events")
              .select("*")
              .eq("status", "Active")
              .order("created_at", { ascending: false })
              .limit(3),
          ]);

        if (sld) setSliders(sld);
        if (inst) setInstaFeeds(inst as InstagramFeed[]);
        if (gal) setGalleryItems(gal);
        if (live) setLiveEvents(live as LiveEvent[]);
        if (evts) setEvents(evts as EventItem[]);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (sliders.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [sliders]);

  // Signature element data: a ticker built from real categories when we
  // have them, falling back to a house list while data is thin.
  const tickerItems = useMemo(() => {
    const fromData = Array.from(
      new Set(
        [...liveEvents.map((e) => e.category), ...events.map((e) => e.category)].filter(
          (c): c is string => Boolean(c)
        )
      )
    );
    const list = fromData.length >= 4
      ? fromData
      : ["Weddings", "Corporate Galas", "Product Launches", "Private Celebrations", "Brand Activations"];
    return [...list, ...list];
  }, [liveEvents, events]);

  if (!mounted || loading)
    return (
      <div className="h-screen bg-[#FAF8F2] dark:bg-[#0B0A08] flex items-center justify-center transition-colors">
        <div className="w-9 h-9 border-2 border-[#8A6A2F] dark:border-[#D9B565] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <main
      className={`${fraunces.variable} ${inter.variable} bg-[#FAF8F2] text-zinc-900 dark:bg-[#0B0A08] dark:text-zinc-50 selection:bg-[#D9B565] selection:text-black transition-colors duration-300`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 28s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
        }
      `}</style>

      {/* --- THEME TOGGLE --- */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 shadow-sm backdrop-blur-md hover:border-[#8A6A2F] dark:hover:border-[#D9B565] transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* --- HERO --- */}
      <section className="relative h-screen flex flex-col justify-end overflow-hidden">
        <AnimatePresence mode="wait">
          {sliders.length > 0 &&
            sliders.map(
              (slide, i) =>
                i === currentSlide && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1 }}
                    className="absolute inset-0"
                  >
                    {isVideoUrl(slide.file_url) ? (
                      <video
                        src={slide.file_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={slide.file_url} className="w-full h-full object-cover" alt="" />
                    )}
                    {/* Light scrim only — kept low so the media stays the hero, not the background */}
                    <div className="absolute inset-0 bg-black/35 dark:bg-black/50" />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </motion.div>
                )
            )}
        </AnimatePresence>

        <div className="relative z-10 px-6 md:px-20 max-w-5xl pb-14">
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[11px] font-semibold tracking-[0.4em] uppercase text-[#D9B565] mb-5"
          >
            The Gold Standard in Events
          </motion.p>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="text-6xl md:text-8xl leading-[0.95] mb-8 tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="font-medium">Elevating</span>
            <br />
            <span className="italic font-medium text-[#D9B565]">your vision.</span>
          </motion.h1>
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 text-sm font-semibold text-white hover:text-[#D9B565] transition-colors uppercase tracking-[0.2em] border-b border-white/70 hover:border-[#D9B565] pb-1 w-fit"
            >
              Book an appointment
              <MoveRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Signature: a running programme of what we produce */}
        <div className="relative z-10 border-t border-white/15 py-3.5 overflow-hidden bg-black/40 backdrop-blur-sm">
          <div className="flex whitespace-nowrap ticker-track w-max">
            {tickerItems.map((item, i) => (
              <span
                key={i}
                className="flex items-center text-sm md:text-base uppercase tracking-[0.25em] font-semibold text-white/70 px-8"
              >
                {item}
                <span className="ml-8 text-[#D9B565]">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- UPCOMING EVENTS --- */}
      <section className="py-24 px-6 md:px-20 bg-[#F2ECDD]/60 dark:bg-[#141210] border-t border-black/5 dark:border-white/5 transition-colors">
        <SectionHeading
          index={0}
          eyebrow="Mark your calendar"
          title={<>Nightlife <span className="italic text-[#8A6A2F] dark:text-[#D9B565]">Events</span></>}
          accent="events"
          viewAllHref="/site/events/live"
        />

        {liveEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((ev, i) => {
              const img = firstImage(ev.image_urls);
              const date = formatDate(ev.start_date);

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={`/site/events/live/${ev.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-[#17150F] hover:border-[#8A6A2F] dark:hover:border-[#D9B565] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {img ? (
                        <img
                          src={img}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <CalendarDays size={30} />
                        </div>
                      )}
                      {ev.status && (
                        <span
                          className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md ${
                            statusStyles[ev.status] ?? statusStyles.Active
                          }`}
                        >
                          {ev.status}
                        </span>
                      )}
                      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                        <ArrowUpRight size={16} className="text-[#8A6A2F] dark:text-[#D9B565]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 p-6">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A6A2F] dark:text-[#D9B565]">
                        {ev.category || "Special event"}
                      </span>
                      <h3
                        className="text-lg leading-snug"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {ev.title}
                      </h3>

                      <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {date && (
                          <span className="flex items-center gap-2">
                            <CalendarDays size={13} className="text-[#8A6A2F] dark:text-[#D9B565]" /> {date}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-2">
                            <MapPin size={13} className="text-[#8A6A2F] dark:text-[#D9B565]" /> {ev.location}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 pt-3 border-t border-black/10 dark:border-white/10 flex items-baseline gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400">Entry cover</span>
                        <span className="text-base font-semibold text-[#8A6A2F] dark:text-[#D9B565]">
                          {ev.cover_charge && ev.cover_charge > 0 ? formatPrice(Number(ev.cover_charge)) : "Free entry"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-400 font-semibold uppercase tracking-widest text-sm">
            No upcoming events yet — check back soon
          </div>
        )}
      </section>

      {/* --- SERVICES --- */}
      <section className="py-24 px-6 md:px-20 bg-[#FAF8F2] dark:bg-[#0B0A08] border-t border-black/5 dark:border-white/5 transition-colors">
        <SectionHeading
          index={1}
          eyebrow="What we offer"
          title={<>Our <span className="italic text-[#8A6A2F] dark:text-[#D9B565]">Events</span></>}
          accent="services"
          viewAllHref="/site/events"
        />

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev, i) => {
              const img = firstImage(ev.image_url);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={`/site/events/${ev.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-md border border-black/10 dark:border-white/10 bg-[#F2ECDD]/50 dark:bg-[#141210] hover:border-[#8A6A2F] dark:hover:border-[#D9B565] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {img ? (
                        <img
                          src={img}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Users size={30} />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#8A6A2F]/30 dark:border-[#D9B565]/30 bg-white/80 dark:bg-black/60 text-[#8A6A2F] dark:text-[#D9B565] backdrop-blur-md">
                        {ev.category}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 p-6">
                      <h3
                        className="text-lg leading-snug"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium">
                          {ev.description}
                        </p>
                      )}
                      <div className="mt-1 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                        <span className="text-base font-semibold text-[#8A6A2F] dark:text-[#D9B565]">
                          {formatPrice(ev.price)}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#8A6A2F] dark:group-hover:text-[#D9B565] transition-colors flex items-center gap-1">
                          Details <ArrowUpRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-400 font-semibold uppercase tracking-widest text-sm">
            No events published yet
          </div>
        )}
      </section>

      {/* --- GALLERY --- */}
      <section className="py-24 px-6 md:px-20 bg-[#F2ECDD]/60 dark:bg-[#141210] border-t border-black/5 dark:border-white/5 transition-colors">
        <SectionHeading
          index={2}
          eyebrow="Recent work"
          title={<>Our <span className="italic text-[#8A6A2F] dark:text-[#D9B565]">work</span></>}
          accent="work"
          viewAllHref="/gallery"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item, idx) => (
            <motion.div
              key={item.id ?? idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
              className="relative aspect-square overflow-hidden group bg-zinc-100 dark:bg-zinc-900 rounded-md"
            >
              <img
                src={item.media?.[0]?.url || item.media?.[0]}
                className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-[10px] font-bold text-[#D9B565] uppercase tracking-widest">
                  {item.category_name}
                </p>
                <h3 className="text-xl text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {item.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- INSTAGRAM --- */}
      <section className="py-24 px-6 bg-[#FAF8F2] dark:bg-[#0B0A08] border-t border-black/5 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center flex-col mb-16 text-center">
            <Camera className="text-[#8A6A2F] dark:text-[#D9B565] mb-4" size={28} />
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-zinc-400 dark:text-zinc-600 mb-3">
              <span className="text-[#8A6A2F] dark:text-[#D9B565] font-serif italic text-base tracking-normal mr-3">
                {numerals[3]}
              </span>
              Follow along
            </p>
            <h2
              className="text-4xl md:text-5xl tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Live on <span className="italic text-[#8A6A2F] dark:text-[#D9B565]">Instagram</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {instaFeeds.length > 0 ? (
              instaFeeds.map((reel) => (
                <motion.div
                  whileHover={{ y: -8 }}
                  key={reel.id}
                  className="aspect-[9/16] bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden relative group border border-black/10 dark:border-white/10"
                >
                  <iframe
                    src={reel.url.endsWith("/") ? `${reel.url}embed` : `${reel.url}/embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 z-10 bg-transparent dark:bg-black/20 group-hover:bg-transparent transition-colors"
                  />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-zinc-400 dark:text-zinc-700 font-semibold uppercase tracking-widest">
                No Instagram feeds found
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="relative py-32 bg-[#0B0A08] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #D9B565 0%, transparent 45%), radial-gradient(circle at 80% 70%, #D9B565 0%, transparent 40%)",
          }}
        />
        <p className="relative text-[11px] font-semibold tracking-[0.4em] uppercase text-[#D9B565] mb-6">
          Let's talk
        </p>
        <h2
          className="relative text-5xl md:text-7xl tracking-tight mb-10 text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Let's create <br />
          <span className="italic text-[#D9B565]">magic together</span>
        </h2>
        <Link
          href="/contact"
          className="relative px-12 py-5 bg-[#D9B565] text-black text-xs font-bold uppercase tracking-[0.3em] rounded-full hover:bg-white transition-all shadow-2xl"
        >
          Get a quote
        </Link>
      </section>
    </main>
  );
}