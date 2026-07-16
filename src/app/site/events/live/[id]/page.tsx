"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from "@/utils/supabase";
import {
  MapPin, Users2, Clock, IndianRupee, X, CheckCircle2,
  Loader2, User, Mail, Phone, Ticket, PartyPopper
} from 'lucide-react';
import LoginModal from '@/components/LoginModal'; // adjust path to match your project

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function LiveEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<any | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Booking form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>("general"); // "general" or package id

  useEffect(() => {
    const load = async () => {
      const { data: eventData } = await supabase.from('live_events').select('*').eq('id', id).single();
      const { data: pkgData } = await supabase.from('live_event_packages').select('*').eq('live_event_id', id);
      setEvent(eventData);
      setPackages(pkgData || []);
      setLoading(false);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user?.email) setEmail(session.user.email);
    };
    if (id) load();

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) setEmail(session.user.email);
    });
    return () => authListener.subscription.unsubscribe();
  }, [id]);

  const unitPrice = selectedOption === "general"
    ? Number(event?.cover_charge || 0)
    : Number(packages.find(p => p.id === selectedOption)?.price || 0);

  const totalAmount = unitPrice * numberOfPeople;

  const handleBookNowClick = () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setIsBookingOpen(true);
  };

  const resetBookingForm = () => {
    setNumberOfPeople(1);
    setSelectedOption("general");
    setName("");
    setPhone("");
    setBookingError("");
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!name.trim() || !email.trim() || !phone.trim() || numberOfPeople < 1) {
      setBookingError("Please fill in all fields correctly.");
      return;
    }
    if (totalAmount <= 0) {
      setBookingError("Invalid amount for this selection.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create a Razorpay order via our server route (keeps the secret key server-side)
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
      receipt: `live_${event.id.slice(-8)}_${Date.now()}`,
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
        description: `Booking: ${event.title}`,
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

  const handlePaymentSuccess = async (response: any) => {
    try {
      // 3. Verify the payment signature server-side
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

      // 4. Save the booking in the database
      const { error: insertErr } = await supabase.from('live_event_bookings').insert([{
        live_event_id: event.id,
        package_id: selectedOption === "general" ? null : selectedOption,
        user_id: user?.id || null,
        name,
        email,
        phone,
        number_of_people: numberOfPeople,
        amount: totalAmount,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_status: 'paid',
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">Event not found.</p>
        <button onClick={() => router.push('/site/events/live')} className="text-xs font-black uppercase underline">Back to Live Events</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* HERO */}
      <div className="relative h-[420px] w-full">
        <img src={event.image_urls?.[0] || '/placeholder.png'} className="w-full h-full object-cover" alt={event.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-[1400px] mx-auto right-0">
          <span className="text-red-400 text-[11px] font-black uppercase tracking-[0.2em]">{event.category}</span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mt-2">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 -mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Pass</p>
              <p className="text-xl font-black mt-1 flex items-center"><IndianRupee size={18} />{event.cover_charge}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1"><Users2 size={14} className="text-blue-500" />{event.capacity} Guests</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1 truncate"><MapPin size={14} className="text-red-500" />{event.location}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center gap-3">
            <Clock className="text-blue-500" size={18} />
            <p className="text-sm font-bold text-black">{new Date(event.start_date).toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">About This Event</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{event.description || "No details provided."}</p>
          </div>

          {event.perks?.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pass Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {event.perks.map((perk: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-50 border rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {perk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {packages.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">VIP Table Packages</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold uppercase">{pkg.package_name}</p>
                      <p className="text-xs font-black text-red-600">₹{pkg.price}</p>
                    </div>
                    {pkg.requirements?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pkg.requirements.map((req: string, rIdx: number) => (
                          <span key={rIdx} className="bg-white px-2 py-1 border rounded-lg text-[8px] font-bold text-slate-500 uppercase">{req}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: STICKY BOOK PANEL */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-tight">Reserve Your Spot</h4>
            <p className="text-xs text-slate-400 font-medium">Secure your entry or a VIP table for this event.</p>
            <button
              onClick={handleBookNowClick}
              className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <Ticket size={14} /> Book Now
            </button>
            {!user && <p className="text-[10px] text-center text-slate-400 font-bold uppercase">Login required to book</p>}
          </div>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* BOOKING MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-tight">Confirm Your Booking</h3>
              <button onClick={() => { setIsBookingOpen(false); resetBookingForm(); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><User size={10} /> Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none" placeholder="Your name" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Mail size={10} /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none" placeholder="you@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Phone size={10} /> Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none" placeholder="10-digit mobile number" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Number of People</label>
                  <input
                    type="number"
                    min={1}
                    value={numberOfPeople}
                    onChange={e => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Booking Type</label>
                  <select
                    value={selectedOption}
                    onChange={e => setSelectedOption(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                  >
                    <option value="general">General Entry (₹{event.cover_charge}/person)</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.package_name} (₹{pkg.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable</span>
                <span className="text-xl font-black text-black flex items-center"><IndianRupee size={16} />{totalAmount}</span>
              </div>

              {bookingError && <p className="text-[11px] font-bold text-red-600 text-center">{bookingError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center space-y-4 border border-slate-100">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <PartyPopper className="mx-auto text-brand-yellow" size={24} />
            <h3 className="text-lg font-black uppercase tracking-tight">Successfully Booked!</h3>
            <p className="text-xs text-slate-400 font-medium">Thank you for your booking. A confirmation has been sent to your email.</p>
            <button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}