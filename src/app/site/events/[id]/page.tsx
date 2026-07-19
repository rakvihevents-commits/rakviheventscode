"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowLeft,
  Share2,
  Heart,
  ShieldCheck,
  Zap,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  MessageSquare,
  X,
  Camera,
  UploadCloud,
  PartyPopper,
  ArrowUpRight,
  User,
  Mail,
  Phone,
  Home,
  Loader2,
  IndianRupee
} from 'lucide-react';
import LoginModal from '@/components/LoginModal'; // adjust path to match your project

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EventDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Auth
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Booking modal / payment state
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Booker contact + address fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const fetchFullData = async () => {
      setLoading(true);
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();

      if (eventData) {
        setEvent(eventData);
        const [pkgData, relatedData, reviewsData] = await Promise.all([
          supabase.from('event_packages').select('*').eq('event_id', id),
          supabase.from('events').select('*').eq('category', eventData.category).neq('id', id).limit(4),
          supabase.from('reviews').select('*').eq('event_id', id).order('created_at', { ascending: false })
        ]);

        setPackages(pkgData.data || []);
        setRelatedEvents(relatedData.data || []);
        setReviews(reviewsData.data || []);
      }
      setLoading(false);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user?.email) setEmail(session.user.email);
    };
    fetchFullData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) setEmail(session.user.email);
    });
    return () => authListener.subscription.unsubscribe();
  }, [id]);

  const resetBookingForm = () => {
    setSelectedPkg(null);
    setName("");
    setPhone("");
    setAddress("");
    setAcceptedTerms(false);
    setBookingError("");
  };

  // Step 1: user picks a package -> require login, then open the booking modal
  const handleSelectPackage = (pkg: any) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setSelectedPkg(pkg);
    setIsBookingOpen(true);
  };

  // Step 2: validate the form, then create a Razorpay order and open checkout
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setBookingError("Please fill in all fields, including your address.");
      return;
    }
    if (!acceptedTerms) {
      setBookingError("Please accept the Terms & Conditions to continue.");
      return;
    }
    if (!selectedPkg || !selectedPkg.price || selectedPkg.price <= 0) {
      setBookingError("Invalid package selected.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create a Razorpay order via our server route (keeps the secret key server-side)
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPkg.price,
          receipt: `evt_${String(id).slice(-8)}_${Date.now()}`,
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not create payment order.");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Rakvih Events",
        description: `Booking: ${event.title} — ${selectedPkg.package_name}`,
        order_id: order.id,
        prefill: { name, email, contact: phone },
        theme: { color: "#000000" },
        handler: async function (response: any) {
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setBookingError("Payment failed. Please try again.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setBookingError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  // Step 3: verify the payment server-side, then save the booking (with address)
  const handlePaymentSuccess = async (response: any) => {
    try {
      const verifyRes = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) throw new Error("Payment verification failed.");

      const { error: insertErr } = await supabase.from('bookings').insert([{
        event_id: id,
        package_name: selectedPkg.package_name,
        package_price: selectedPkg.price,
        user_id: user?.id || null,
        name,
        email,
        phone,
        address,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_status: 'paid',
        status: 'confirmed',
      }]);
      if (insertErr) throw insertErr;

      setIsBookingOpen(false);
      setIsSuccessOpen(true);
      resetBookingForm();
    } catch (err: any) {
      setBookingError(err.message || "We took payment but couldn't save your booking. Please contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSuccessOpen) {
      const t = setTimeout(() => {
        router.push('/site/bookings');
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isSuccessOpen, router]);

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex items-center justify-center bg-gradient-to-br from-brand-yellow/10 to-brand-green/10 dark:from-zinc-900/50 dark:to-zinc-900/20"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full shadow-lg"
      />
    </motion.div>
  );

  if (!event) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-20 transition-colors duration-500 overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccessOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[300] w-full max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-2 border-brand-green dark:border-brand-yellow/50 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-green/20"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-brand-yellow/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative z-10 flex items-center gap-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="shrink-0 p-4 rounded-3xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-green shadow-2xl shadow-brand-green/30"
                >
                  <PartyPopper size={28} />
                </motion.div>
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1 min-w-0"
                >
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green dark:text-brand-yellow mb-1">
                    Booking Confirmed
                  </h4>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">
                    {event.title}
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                    Redirecting to your bookings...
                  </p>
                </motion.div>
              </div>
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-brand-green to-brand-yellow"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-green dark:hover:text-brand-yellow transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Events
          </motion.button>
          <div className="flex gap-4">
            <motion.button whileHover={{ scale: 1.1, rotate: 5 }} className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-brand-green">
              <Share2 size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1, rotate: -5 }} className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-red-500">
              <Heart size={18} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <main ref={mainRef} className="max-w-7xl mx-auto px-6 mt-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24"
        >
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ scale: 0.9, rotateX: 10 }}
              whileInView={{ scale: 1, rotateX: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={event.image_url?.[activeImg]}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <motion.div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
            >
              {event.image_url?.map((img: string, i: number) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-brand-yellow scale-105 shadow-xl shadow-brand-yellow/30' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                  {activeImg === i && (
                    <motion.div className="absolute inset-0 bg-brand-yellow/20" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} />
                  )}
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="pt-10 border-t border-slate-100 dark:border-zinc-900"
            >
              <motion.h2 initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="text-sm font-black uppercase tracking-[0.4em] text-brand-yellow mb-6">
                Event Details
              </motion.h2>
              <p className="text-xl text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">{event.description}</p>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="px-4 py-1 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-[10px] font-black uppercase tracking-widest border border-brand-green/20 inline-block"
                >
                  {event.category}
                </motion.span>
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-black text-brand-green dark:text-white uppercase tracking-tighter mt-4 leading-none"
                >
                  {event.title}
                </motion.h1>
                <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="flex items-center gap-6 mt-6">
                  <motion.p initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="text-4xl font-black text-brand-green dark:text-brand-yellow">
                    ₹{event.price.toLocaleString()}
                  </motion.p>
                  <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="flex items-center gap-2 text-slate-400">
                    <Star className="text-brand-yellow fill-brand-yellow" size={16} />
                    <span className="text-sm font-bold">
                      {reviews.length > 0 ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1) : "4.9"} ({reviews.length} Reviews)
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800"
              >
                <motion.h3 initial={{ x: -50 }} whileInView={{ x: 0 }} viewport={{ once: true }} className="text-xs font-black uppercase tracking-widest mb-6 text-slate-400 flex items-center gap-2">
                  <Zap size={14} className="text-brand-yellow" /> Services Included
                </motion.h3>
                <div className="grid grid-cols-1 gap-4">
                  {event.services_included?.map((service: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-zinc-300"
                    >
                      <CheckCircle2 className="text-brand-green dark:text-brand-yellow" size={18} /> {service}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex justify-between items-center px-4">
                <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.1 }} className="flex flex-col items-center gap-2">
                  <ShieldCheck className="text-slate-300" size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Verified</span>
                </motion.div>
                <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.1 }} className="flex flex-col items-center gap-2">
                  <Clock className="text-slate-300" size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fast Booking</span>
                </motion.div>
                <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.1 }} className="flex flex-col items-center gap-2">
                  <MapPin className="text-slate-300" size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bangalore</span>
                </motion.div>
              </motion.div>

              {!user && (
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Login required to book a package</p>
              )}
            </div>
          </motion.div>
        </motion.section>

        {/* --- PACKAGE SECTION --- */}
        {packages.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="pt-2 mt-14 border-t border-slate-100 dark:border-zinc-900"
          >
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="mb-12 text-center lg:text-left">
              <motion.h2 initial={{ y: -30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-sm font-black uppercase tracking-[0.4em] text-brand-yellow mb-2">
                Exclusive Tiers
              </motion.h2>
              <motion.p initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-4xl font-black text-brand-green dark:text-white uppercase">
                Choose Your Package
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
            >
              {packages.map((pkg, idx) => (
                <PackageCard key={idx} pkg={pkg} onSelect={() => handleSelectPackage(pkg)} isBooking={submitting} />
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* --- REVIEWS SECTION --- */}
        <motion.section
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="pt-2 border-t border-slate-100 dark:border-zinc-900 mt-24"
        >
          <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <motion.h2 initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="text-sm font-black uppercase tracking-[0.4em] text-brand-yellow mb-2">
                Guest Feedback
              </motion.h2>
              <motion.p initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-5xl font-black text-brand-green dark:text-white uppercase tracking-tighter leading-none">
                Reviews<span className="text-brand-yellow block text-3xl">.</span>
              </motion.p>
            </motion.div>
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReviewModal(true)}
              className="px-8 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-brand-green hover:text-white transition-all shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-brand-green/20"
            >
              <MessageSquare size={16} /> Write Review
            </motion.button>
          </motion.div>

          {reviews.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.2, delayChildren: 0.3 } } }}
            >
              {reviews.map((review, idx) => (
                <ReviewCard key={idx} review={review} delay={idx * 0.1} />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="py-20 text-center bg-slate-50 dark:bg-zinc-900/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-zinc-800">
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No reviews yet. Share your experience!</p>
            </motion.div>
          )}
        </motion.section>

        {/* Related Events Section */}
        {relatedEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="pt-2 mt-14 border-t border-slate-100 dark:border-zinc-900"
          >
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="flex justify-between items-end mb-12">
              <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <motion.h2 initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="text-sm font-black uppercase tracking-[0.4em] text-brand-yellow mb-2">
                  More from {event.category}
                </motion.h2>
                <motion.p initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-4xl font-black text-brand-green dark:text-white uppercase">
                  Similar Experiences
                </motion.p>
              </motion.div>
              <Link href={`/site/events`} className="group block space-y-4">
                <motion.button initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} whileHover={{ scale: 1.05, x: 5 }} className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-yellow transition-all">
                  View All
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
            >
              {relatedEvents.map((rel, idx) => (
                <RelatedEventCard key={rel.id} event={rel} delay={idx * 0.1} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* BOOKING MODAL (contact + address, then triggers Razorpay) */}
      {isBookingOpen && selectedPkg && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 max-h-[90vh] flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Confirm Your Booking</h3>
              <button onClick={() => { setIsBookingOpen(false); resetBookingForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedPkg.package_name}</span>
                <span className="text-lg font-black text-black dark:text-white flex items-center"><IndianRupee size={14} />{selectedPkg.price}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><User size={10} /> Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none" placeholder="Your name" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Mail size={10} /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none" placeholder="you@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Phone size={10} /> Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none" placeholder="10-digit mobile number" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Home size={10} /> Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none resize-none"
                  placeholder="Full delivery / billing address"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <input
                  type="checkbox"
                  id="accept-terms-event"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-black shrink-0"
                />
                <label htmlFor="accept-terms-event" className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  I confirm the details above are correct and agree to the event's Terms &amp; Conditions.
                </label>
              </div>

              {bookingError && <p className="text-[11px] font-bold text-red-600 text-center">{bookingError}</p>}

              <button
                type="submit"
                disabled={submitting || !acceptedTerms}
                className="w-full py-4 bg-black dark:bg-brand-yellow text-white dark:text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showReviewModal && (
          <ReviewModal eventId={id as string} onClose={() => setShowReviewModal(false)} onSuccess={() => window.location.reload()} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Animated Package Card */
function PackageCard({ pkg, onSelect, isBooking }: { pkg: any, onSelect: () => void, isBooking: boolean }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 } }
      }}
      whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(34,197,94,0.4)" }}
      className="w-full p-10 rounded-[3rem] bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 hover:border-brand-yellow/50 group relative overflow-hidden"
    >
      <motion.div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-brand-yellow/5" whileHover={{ scale: 1.1 }} />
      <div className="relative z-10">
        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} whileHover={{ rotate: 5 }} className="flex justify-between items-start mb-8">
          <motion.div whileHover={{ scale: 1.1 }} className="p-3 rounded-2xl bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 group-hover:bg-brand-yellow transition-all">
            <Zap className="text-brand-yellow group-hover:text-brand-green transition-colors" size={24} />
          </motion.div>
          <motion.span initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="text-2xl font-black text-brand-green dark:text-brand-yellow">
            ₹{pkg.price.toLocaleString()}
          </motion.span>
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          whileHover={{ color: "#22c55e" }}
          className="text-2xl font-black uppercase text-brand-green dark:text-white mb-6 tracking-tighter"
        >
          {pkg.package_name}
        </motion.h3>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
          className="space-y-4 mb-10"
        >
          {(Array.isArray(pkg.requirements) ? pkg.requirements : pkg.requirements?.split(',') || []).map((req: string, rIdx: number) => (
            <motion.li key={rIdx} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="flex items-start gap-3 text-sm font-bold text-slate-500 dark:text-zinc-400">
              <CheckCircle2 size={16} className="text-brand-yellow shrink-0 mt-0.5" />
              <span>{req.trim()}</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.button
          initial={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isBooking}
          onClick={onSelect}
          className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-brand-green to-brand-yellow dark:from-white dark:to-brand-yellow text-white dark:text-brand-green text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
        >
          {isBooking ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="flex items-center justify-center gap-2">
              Booking...
            </motion.div>
          ) : (
            "Select Tier"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* Animated Review Card */
function ReviewCard({ review, delay = 0 }: { review: any, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      whileHover={{ y: -5, scale: 1.02, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)" }}
      className="p-10 rounded-[3rem] bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 group"
    >
      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="flex justify-between items-center mb-6">
        <motion.div initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <h4 className="font-black text-brand-green dark:text-white uppercase tracking-tighter text-lg group-hover:text-brand-yellow transition-colors">
            {review.user_name}
          </h4>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + (i * 0.05) }}>
                <Star size={12} className={i < review.rating ? "fill-brand-yellow text-brand-yellow" : "text-slate-300"} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mb-6">
        "{review.comment}"
      </motion.p>

      {review.images?.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex gap-3 overflow-x-auto no-scrollbar">
          {review.images.map((img: string, i: number) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative">
              <img src={img} className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-zinc-800 shadow-sm" alt="review" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* Animated Related Event Card */
function RelatedEventCard({ event, delay = 0 }: { event: any, delay?: number }) {
  return (
    <Link href={`/site/events/${event.id}`} className="group block space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
        whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.3 } }}
        className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-zinc-900 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-brand-green/20 relative"
      >
        <motion.img src={event.image_url?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" whileHover={{ scale: 1.1 }} />
        <motion.div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" initial={{ scale: 0 }} whileHover={{ scale: 1 }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="px-2 pt-4">
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          whileHover={{ color: "#22c55e" }}
          className="text-lg font-black uppercase text-brand-green dark:text-white line-clamp-1 tracking-tighter group-hover:text-brand-yellow transition-colors"
        >
          {event.title}
        </motion.h3>
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex justify-between items-center mt-2">
          <motion.p initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="text-brand-yellow font-black text-lg">
            ₹{event.price.toLocaleString()}
          </motion.p>
          <motion.span initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ x: 10 }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-green transition-all">
            View Details
            <ArrowUpRight size={12} className="inline ml-1" />
          </motion.span>
        </motion.div>
      </motion.div>
    </Link>
  );
}

/* --- REVIEW MODAL --- */
function ReviewModal({ eventId, onClose, onSuccess }: any) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!name || !comment) return alert("Please enter name and comment");
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data } = await supabase.storage.from('review-images').upload(fileName, file);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }
      const { error } = await supabase.from('reviews').insert([{
        event_id: eventId,
        user_name: name,
        rating,
        comment,
        images: uploadedUrls
      }]);
      if (!error) {
        onSuccess();
        onClose();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[3rem] p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-brand-green"><X size={24} /></button>
        <h2 className="text-3xl font-black text-brand-green dark:text-white uppercase tracking-tighter mb-8">Post Review</h2>
        <div className="space-y-6">
          <div className="flex justify-center gap-2 py-4 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}><Star size={28} className={s <= rating ? "fill-brand-yellow text-brand-yellow" : "text-slate-300"} /></button>
            ))}
          </div>
          <input type="text" placeholder="NAME" className="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl p-5 text-xs font-black uppercase outline-none focus:ring-2 ring-brand-yellow" onChange={(e) => setName(e.target.value)} />
          <textarea rows={4} placeholder="YOUR EXPERIENCE..." className="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl p-6 text-sm outline-none focus:ring-2 ring-brand-yellow" onChange={(e) => setComment(e.target.value)} />
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center cursor-pointer hover:border-brand-yellow group">
            <input type="file" multiple hidden ref={fileInputRef} onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <UploadCloud className="mx-auto text-slate-300 group-hover:text-brand-yellow mb-2" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{files.length > 0 ? `${files.length} Selected` : "Add Photos"}</p>
          </div>
          <button disabled={uploading} onClick={handleSubmit} className="w-full py-6 rounded-[2rem] bg-brand-green text-brand-yellow font-black uppercase text-xs tracking-[0.2em]">{uploading ? "Publishing..." : "Post Review"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}