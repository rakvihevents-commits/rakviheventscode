import React from 'react';
import { supabase } from "@/utils/supabase";
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Play,
  AlertCircle,
  ChevronRight,
  Users,
  Ticket,
  Sparkles,
} from 'lucide-react';

// ✅ Types now match the ACTUAL Supabase schema (previously this had
// `thumbnail_url` which doesn't exist on `live_events` — that's why no
// images were ever rendering. The real column is `image_urls` (array),
// plus category / cover_charge / capacity / perks which weren't modeled
// or displayed at all.)
interface LiveEventPackage {
  id: string;
  live_event_id: string;
  package_name: string;
  price: string;
  requirements: string[] | null;
  created_at: string;
}

interface LiveEvent {
  id: string;
  title: string;
  category: string | null;
  cover_charge: string | null;
  capacity: number | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  status: 'Active' | 'Inactive' | 'Draft';
  description: string;
  perks: string[] | null;
  image_urls: string[] | null;
  created_at: string;
  live_event_packages?: LiveEventPackage[];
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

const rupee = (value: string | number | null) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};

export default async function EventsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filter = resolvedSearchParams.filter || 'all';

  const now = new Date().toISOString();

  // ✅ FIX: join live_event_packages so ticket tiers actually load with
  // each event instead of never being fetched.
  let query = supabase
    .from('live_events')
    .select('*, live_event_packages(*)')
    .eq('status', 'Active')
    .order('start_date', { ascending: true });

  if (filter === 'live') {
    query = query.lte('start_date', now);
  } else if (filter === 'upcoming') {
    query = query.gt('start_date', now);
  }

  const { data: events, error } = await query as { data: LiveEvent[] | null; error: any };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
        <div className="text-red-500 mb-4 bg-red-100 dark:bg-red-950/30 p-4 rounded-full">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Failed to load events</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-md text-center text-sm">
          Something went wrong while connecting to the database. Please reload the page or try again later.
        </p>
      </div>
    );
  }

  const liveEvents = events?.filter(e => e.start_date <= now && (!e.end_date || e.end_date >= now)) || [];
  const upcomingEvents = events?.filter(e => e.start_date > now) || [];
  const displayEvents = filter === 'live' ? liveEvents : filter === 'upcoming' ? upcomingEvents : events || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pt-36 pb-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8 mb-10">
          <div>
            <span className="text-[11px] font-black tracking-widest text-brand-green dark:text-brand-yellow uppercase bg-brand-green/10 dark:bg-brand-yellow/10 px-3 py-1.5 rounded-full">
              Discover Broadcasts
            </span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-3 text-slate-950 dark:text-white">
              {filter === 'live' && "🔴 Broadcasts Streaming Now"}
              {filter === 'upcoming' && "📅 Future Schedules"}
              {filter === 'all' && "🎉 All Scheduled Events"}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 max-w-xl text-sm">
              Watch our live streams, get tickets, and explore upcoming virtual or physical events in your area.
            </p>
          </div>

        </div>

        {/* EMPTY STATE */}
        {displayEvents.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-white/5 p-12 md:p-20 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-6">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-950 dark:text-white">
              No events found
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
              We couldn't find any {filter === 'all' ? '' : filter} events at the moment. Keep an eye out for future announcements!
            </p>
            <Link
              href="/site/events?filter=all"
              className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full mt-6 transition-colors"
            >
              View All Events
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* EVENTS GRID */}
        {displayEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event) => {
              const isLive = event.start_date <= now && (!event.end_date || event.end_date >= now);
              const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const eventTime = new Date(event.start_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              // ✅ Use the real column: image_urls[]. Fall back gracefully
              // when it's missing or empty.
              const images = event.image_urls?.filter(Boolean) || [];
              const cover = images[0] || null;
              const extraImageCount = images.length > 1 ? images.length - 1 : 0;

              const packages = event.live_event_packages || [];
              const cheapestPackage = packages.length
                ? [...packages].sort((a, b) => Number(a.price) - Number(b.price))[0]
                : null;

              // ✅ FIX: detail page actually lives at
              // src/app/site/events/live/[id]/page.tsx, so its route is
              // /site/events/live/[id] — not /site/events/[id]. Every card
              // was linking to a route that didn't exist.
              const detailHref = `/site/events/live/${event.id}`;

              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300"
                >
                  {/* Thumbnail / Image Section */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-700">
                        <Calendar size={48} strokeWidth={1} />
                      </div>
                    )}

                    {/* subtle gradient so badges stay legible over any photo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

                    {/* LIVE / Upcoming Status Badge */}
                    {isLive ? (
                      <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        Live
                      </span>
                    ) : (
                      <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-brand-yellow text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                        Upcoming
                      </span>
                    )}

                    {/* Category tag */}
                    {event.category && (
                      <span className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md text-slate-800 dark:text-zinc-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        {event.category}
                      </span>
                    )}

                    {/* "+N more photos" indicator */}
                    {extraImageCount > 0 && (
                      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        +{extraImageCount} photo{extraImageCount > 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Ticket-stub cover charge badge — perforated edge nods to a
                        physical event ticket, tying the signature element to
                        the subject matter (paid nightlife events). */}
                    {event.cover_charge && Number(event.cover_charge) > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-stretch bg-brand-green dark:bg-brand-yellow text-white dark:text-zinc-950 rounded-lg overflow-hidden shadow-lg">
                        <div className="px-3 py-1.5 flex items-center gap-1.5">
                          <Ticket size={12} />
                          <span className="text-[11px] font-black">{rupee(event.cover_charge)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      {/* Date & Time Indicators */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-brand-green dark:text-brand-yellow" />
                          {eventDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-brand-green dark:text-brand-yellow" />
                          {eventTime}
                        </span>
                        {event.capacity != null && (
                          <span className="flex items-center gap-1.5">
                            <Users size={13} className="text-brand-green dark:text-brand-yellow" />
                            {event.capacity} spots
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-950 dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors mb-2">
                        {event.title}
                      </h3>

                      {/* Event Location (if any) */}
                      {event.location && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 mb-4">
                          <MapPin size={12} />
                          {event.location}
                        </p>
                      )}

                      {/* Shortened description */}
                      <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                        {event.description}
                      </p>

                      {/* Perks */}
                      {event.perks && event.perks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {event.perks.map((perk, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full"
                            >
                              <Sparkles size={10} className="text-brand-green dark:text-brand-yellow" />
                              {perk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Ticket packages */}
                      {packages.length > 0 && (
                        <div className="mb-5 border border-slate-100 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                          {packages.map((pkg) => (
                            <div key={pkg.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-zinc-800/40">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{pkg.package_name}</p>
                                {pkg.requirements && pkg.requirements.length > 0 && (
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                    {pkg.requirements.join(' • ')}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-black text-brand-green dark:text-brand-yellow shrink-0 ml-3">
                                {rupee(pkg.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Action Buttons */}
                    <div className="flex gap-2">
                      {isLive ? (
                        <Link
                          href={detailHref}
                          className="flex items-center justify-center gap-2 flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-2xl transition-colors shadow-md hover:shadow-lg"
                        >
                          <Play size={14} className="fill-current" />
                          Tune In Stream
                        </Link>
                      ) : (
                        <Link
                          href={detailHref}
                          className="flex items-center justify-center gap-2 flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-800 dark:text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-2xl transition-colors"
                        >
                          View Details
                          <ChevronRight size={14} />
                        </Link>
                      )}
                 
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}