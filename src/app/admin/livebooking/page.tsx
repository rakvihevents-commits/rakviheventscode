"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Ticket,
  Users,
  QrCode,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { toast } from "sonner";

export default function LiveBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{show: boolean, id: string | null}>({ show: false, id: null });
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchLiveBookings();
  }, []);

const fetchLiveBookings = async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('live_event_bookings')
      .select(`
        *,
        live_event_id,
        package_id,
        live_events ( title )
      `) // Removed the non-existent live_event_packages ( name )
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
      toast.error(`Database Error [${error.code || 'unknown'}]: ${error.message || "Invalid relation schema query"}`);
      setBookings([]);
    } else {
      setBookings(data || []);
    }
  } catch (err: any) {
    console.error("Unexpected runtime failure:", err);
    toast.error("An unexpected application error occurred");
  } finally {
    setLoading(false);
  }
};

  // Live gate attendance action: Check-In Toggle
  const handleCheckInToggle = async (id: string, currentStatus: boolean, maxPeople: number) => {
    const nextStatus = !currentStatus;
    const targetCount = nextStatus ? maxPeople : 0; 

    const { error } = await supabase
      .from('live_event_bookings')
      .update({ 
        is_checked_in: nextStatus,
        checked_in_at: nextStatus ? new Date().toISOString() : null,
        entered_count: targetCount
      })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update check-in log");
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { 
        ...b, 
        is_checked_in: nextStatus, 
        entered_count: targetCount,
        checked_in_at: nextStatus ? new Date().toISOString() : null
      } : b));
      
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev: any) => ({ 
          ...prev, 
          is_checked_in: nextStatus, 
          entered_count: targetCount,
          checked_in_at: nextStatus ? new Date().toISOString() : null
        }));
      }
      toast.success(nextStatus ? "Attendee successfully checked in" : "Check-in status reversed");
    }
  };

  // Update dynamic count directly at gates
  const handleIncrementEntry = async (id: string, currentCount: number, limit: number) => {
    if (currentCount >= limit) {
      toast.error(`Maximum threshold reached (${limit} Person Limit)`);
      return;
    }
    const newCount = currentCount + 1;
    const { error } = await supabase
      .from('live_event_bookings')
      .update({ 
        entered_count: newCount,
        is_checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, entered_count: newCount, is_checked_in: true } : b));
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev: any) => ({ ...prev, entered_count: newCount, is_checked_in: true }));
      }
      toast.success(`Admitted ${newCount}/${limit} members`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const { error } = await supabase.from('live_event_bookings').delete().eq('id', deleteModal.id);
    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== deleteModal.id));
      if (selectedBooking?.id === deleteModal.id) setSelectedBooking(null);
      toast.success("Nightlife Events record purged securely");
    } else {
      toast.error("Process aborted by backend constraint");
    }
    setDeleteModal({ show: false, id: null });
  };

  const filteredBookings = bookings.filter(b => 
    (b.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.ticket_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.live_events?.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentBadge = (status: string) => {
    switch(status) {
      case 'paid': 
        return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> };
      case 'pending': 
        return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock size={10} /> };
      case 'failed': 
        return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <XCircle size={10} /> };
      default: 
        return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: <Clock size={10} /> };
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans text-slate-900 relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* --- HEADER CONTROLS --- */}
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Rakvih / Live Gate Control</p>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Nightlife Events</h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text"
              placeholder="Search Ticket, Name, or Event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-4 pl-14 pr-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* --- DATA BOARD --- */}
        <div className="p-8 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                <th className="pl-8 pb-2">Ticket Info</th>
                <th className="pb-2">Guest Base</th>
                <th className="pb-2">Gate Status</th>
                <th className="pb-2">Transaction</th>
                <th className="pb-2 text-center">Timestamp</th>
                <th className="pr-8 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((b) => {
                  const paymentConfig = getPaymentBadge(b.payment_status);
                  return (
                    <motion.tr key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50/50 transition-all">
                      
                      {/* Ticket Info */}
                      <td className="py-6 pl-8 border-y border-l border-slate-100 rounded-l-[2rem]">
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight text-slate-800">
                            {b.live_events?.title || 'Live Experience'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                            <Ticket size={11} className="text-emerald-500" />
                            <span>{b.ticket_code ? b.ticket_code.substring(0, 12).toUpperCase() : 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Contact */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700">{b.name}</span>
                          <span className="text-[10px] text-slate-400 tracking-tight">{b.phone}</span>
                        </div>
                      </td>

                      {/* Interactive Checking status */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCheckInToggle(b.id, b.is_checked_in, b.number_of_people)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                              b.is_checked_in 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <LogIn size={11} />
                            {b.is_checked_in ? 'In' : 'Out'}
                          </button>
                          
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-700">
                              Count: {b.entered_count || 0}/{b.number_of_people}
                            </span>
                            {b.number_of_people > 1 && (
                              <button 
                                onClick={() => handleIncrementEntry(b.id, b.entered_count || 0, b.number_of_people)}
                                className="text-[9px] font-extrabold uppercase tracking-tighter text-blue-600 hover:underline text-left mt-0.5"
                              >
                                + Admit Guest
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price & Payments */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 font-black text-sm text-slate-900">
                            <CreditCard size={13} className="text-slate-300" />
                            <span>₹{parseFloat(b.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest border rounded-full px-2.5 py-0.5 w-max flex items-center gap-1 ${paymentConfig.color}`}>
                            {paymentConfig.icon}
                            <span>{b.payment_status}</span>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-6 border-y border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                          <Calendar size={12} />
                          {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Operational buttons */}
                      <td className="py-6 pr-8 border-y border-r border-slate-100 rounded-r-[2rem] text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedBooking(b)}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                            title="Inspect Credentials"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ show: true, id: b.id })}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Purge Document"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SIDE AUDIT DRAWER --- */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setSelectedBooking(null)} className="fixed inset-0 bg-slate-900 z-40" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Gate Audit Control</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1">Ticket Manifest</h2>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider">Close</button>
              </div>

              <div className="p-8 space-y-8 flex-1">
                {/* Access Token */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <QrCode size={12} /> Unique Access Token
                  </h3>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50">
                    <p className="font-mono text-sm font-black tracking-widest text-slate-800 uppercase">{selectedBooking.ticket_code}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Authorized Scan Signature Code</p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <User size={12} /> Main Contact Holder
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Name</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communication Email</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Index</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Companions */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <Users size={12} /> Group Guests Metadata ({selectedBooking.number_of_people - 1} Add-on)
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {Array.isArray(selectedBooking.additional_guests) && selectedBooking.additional_guests.length > 0 ? (
                      selectedBooking.additional_guests.map((guest: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{guest.name || `Guest #${idx + 1}`}</span>
                          <span className="text-[10px] font-mono text-slate-400">{guest.phone || guest.age || "No info"}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4 bg-slate-50 rounded-xl border border-dashed">Single Attendee Order</p>
                    )}
                  </div>
                </div>

                {/* Gateway logs */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <ShieldAlert size={12} /> Payment Security Records
                  </h3>
                  <div className="bg-slate-900 rounded-2xl p-5 space-y-3 font-mono text-[10px] text-slate-400 break-all shadow-inner">
                    <div>
                      <p className="font-sans text-[9px] font-bold text-slate-500 uppercase tracking-wider">Order Reference ID</p>
                      <p className="bg-slate-800 p-2 rounded text-slate-200 mt-1 border border-slate-700/50">{selectedBooking.razorpay_order_id || "NULL"}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Transaction ID</p>
                      <p className="bg-slate-800 p-2 rounded text-slate-200 mt-1 border border-slate-700/50">{selectedBooking.razorpay_payment_id || "NULL"}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[9px] font-bold text-slate-500 uppercase tracking-wider">System Checked In Timestamp</p>
                      <p className="text-slate-300 mt-1">{selectedBooking.checked_in_at ? new Date(selectedBooking.checked_in_at).toLocaleString() : 'Not Checked In yet'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteModal.show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({show:false, id:null})} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2.5rem] p-10 z-[80] text-center shadow-2xl border border-slate-100">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={32} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-1">Purge Booking?</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-6 leading-relaxed">
                This deletes barcode definitions and completely prevents entry at physical turnstiles.
              </p>
              <div className="flex flex-col gap-2.5">
                <button onClick={handleDelete} className="w-full py-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-rose-700 transition-all">
                  Confirm Erase
                </button>
                <button onClick={() => setDeleteModal({show:false, id:null})} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-200 transition-all">
                  Abort Process
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}