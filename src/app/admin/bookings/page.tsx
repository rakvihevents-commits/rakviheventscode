"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Search, 
  Calendar, 
  Tag, 
  CreditCard, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  ChevronDown,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{show: boolean, id: string | null}>({ show: false, id: null });
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, events ( title )`)
      .order('created_at', { ascending: false });

    if (error) toast.error("Error loading bookings");
    else setBookings(data || []);
    loading === true && setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const { error } = await supabase.from('bookings').delete().eq('id', deleteModal.id);
    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== deleteModal.id));
      if (selectedBooking?.id === deleteModal.id) setSelectedBooking(null);
      toast.success("Booking permanently deleted");
    } else {
      toast.error("Failed to delete booking");
    }
    setDeleteModal({ show: false, id: null });
  };

  const filteredBookings = bookings.filter(b => 
    (b.package_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.events?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'confirmed': 
        return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> };
      case 'pending': 
        return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <HelpCircle size={10} /> };
      case 'cancelled': 
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
        
        {/* --- HEADER --- */}
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Rakvih / Authority Panel</p>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Reservations</h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text"
              placeholder="Search package, event, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-4 pl-14 pr-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="p-8 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                <th className="pl-8 pb-2">Event Detail</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Payment</th>
                <th className="pb-2">Lifecycle Status</th>
                <th className="pb-2 text-center">Timestamp</th>
                <th className="pr-8 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((b) => {
                  const statusInfo = getStatusConfig(b.status);
                  return (
                    <motion.tr key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50/50 transition-all">
                      
                      {/* Event Detail */}
                      <td className="py-6 pl-8 border-y border-l border-slate-100 rounded-l-[2rem]">
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight">{b.events?.title || 'Custom Booking'}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag size={12} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.package_name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Summary */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700">{b.name || "N/A"}</span>
                          <span className="text-[10px] text-slate-400 tracking-tight">{b.email || "No Email"}</span>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-black text-sm">
                            <CreditCard size={13} className="text-slate-400" />
                            <span>₹{b.package_price ? b.package_price.toLocaleString() : '0'}</span>
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded w-max ${b.payment_status === 'captured' || b.payment_status === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                            {b.payment_status || 'pending'}
                          </span>
                        </div>
                      </td>

                      {/* Lifecycle Status Select */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="relative inline-flex items-center">
                          <div className="absolute left-4 pointer-events-none">
                            {statusInfo.icon}
                          </div>
                          <select 
                            value={b.status || 'pending'}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                            className={`pl-10 pr-10 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border appearance-none outline-none cursor-pointer transition-all ${statusInfo.color}`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-4 pointer-events-none opacity-50" />
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-6 border-y border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                          <Calendar size={12} />
                          {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Action Panel */}
                      <td className="py-6 pr-8 border-y border-r border-slate-100 rounded-r-[2rem] text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedBooking(b)}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ show: true, id: b.id })}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Delete Permanently"
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

      {/* --- SLIDING SIDE DETAIL DRAWER --- */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.3 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedBooking(null)} 
              className="fixed inset-0 bg-slate-900 z-40" 
            />
            {/* Slideout Side Panel */}
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto flex flex-col font-sans"
            >
              {/* Drawer Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Reservation Details</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1">
                    {selectedBooking.events?.title || 'Custom Booking'}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all text-xs font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-8 space-y-8 flex-1">
                {/* Section 1: Customer Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <User size={12} className="text-slate-400" /> Customer Information
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.name || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-bold text-slate-800">{selectedBooking.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Address</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedBooking.address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Package & Pricing info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <FileText size={12} className="text-slate-400" /> Order Summary
                  </h3>
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Tier</span>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedBooking.package_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Charged</span>
                        <p className="text-base font-black text-slate-900">₹{selectedBooking.package_price?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Booking Status</span>
                        <div className="relative inline-flex items-center">
                          <select 
                            value={selectedBooking.status || 'pending'}
                            onChange={(e) => handleStatusChange(selectedBooking.id, e.target.value)}
                            className={`pl-4 pr-8 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border appearance-none outline-none cursor-pointer transition-all ${getStatusConfig(selectedBooking.status).color}`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-3 pointer-events-none opacity-50" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created On</span>
                        <span className="text-xs font-bold text-slate-600">{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment Gateways Tracking */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-slate-400" /> Gateway Logs (Razorpay)
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3 font-mono text-[11px] text-slate-600 break-all">
                    <div>
                      <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payment Status</p>
                      <span className={`font-sans text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${selectedBooking.payment_status === 'captured' || selectedBooking.payment_status === 'success' ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'}`}>
                        {selectedBooking.payment_status || "Pending"}
                      </span>
                    </div>
                    <div className="pt-2">
                      <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
                      <p className="bg-white p-2 rounded border border-slate-100 mt-1">{selectedBooking.razorpay_order_id || "null"}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment ID</p>
                      <p className="bg-white p-2 rounded border border-slate-100 mt-1">{selectedBooking.razorpay_payment_id || "null"}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signature Verification</p>
                      <p className="bg-white p-2 rounded border border-slate-100 mt-1 max-h-16 overflow-y-auto">{selectedBooking.razorpay_signature || "null"}</p>
                    </div>
                    <div className="pt-1">
                      <p className="font-sans text-[9px] text-slate-400 italic">User Token Reference: {selectedBooking.user_id || "Anonymous"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteModal.show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({show:false, id:null})} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2.5rem] p-10 z-[80] border border-slate-100 text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Confirm Delete</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-8 leading-relaxed">
                This will permanently remove the booking records for this user.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDelete} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-red-700 transition-all">
                  Delete Now
                </button>
                <button onClick={() => setDeleteModal({show:false, id:null})} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-200 transition-all">
                  Go Back
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}