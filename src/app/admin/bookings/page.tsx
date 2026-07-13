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
  ChevronDown
} from 'lucide-react';
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{show: boolean, id: string | null}>({ show: false, id: null });

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
    setLoading(false);
  };

  // UPDATED: Direct status selection logic
  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const { error } = await supabase.from('bookings').delete().eq('id', deleteModal.id);
    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== deleteModal.id));
      toast.success("Booking permanently deleted");
    }
    setDeleteModal({ show: false, id: null });
  };

  const filteredBookings = bookings.filter(b => 
    b.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.events?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper for Status UI Styles
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
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans text-slate-900">
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
              placeholder="Search package or event..."
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
                <th className="pb-2">Payment</th>
                <th className="pb-2">Lifecycle Status</th>
                <th className="pb-2 text-center">Timestamp</th>
                <th className="pr-8 pb-2 text-right">Delete</th>
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

                      {/* Payment */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="flex items-center gap-2 font-black text-sm">
                          <CreditCard size={14} className="text-slate-300" />
                          ₹{b.package_price.toLocaleString()}
                        </div>
                      </td>

                      {/* Lifecycle Dropdown Select */}
                      <td className="py-6 border-y border-slate-100">
                        <div className="relative inline-flex items-center">
                          <div className={`absolute left-4 pointer-events-none`}>
                            {statusInfo.icon}
                          </div>
                          <select 
                            value={b.status}
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
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Action: Delete Only */}
                      <td className="py-6 pr-8 border-y border-r border-slate-100 rounded-r-[2rem] text-right">
                        <button 
                          onClick={() => setDeleteModal({ show: true, id: b.id })}
                          className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteModal.show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({show:false, id:null})} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2.5rem] p-10 z-[60] border border-slate-100 text-center shadow-2xl">
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