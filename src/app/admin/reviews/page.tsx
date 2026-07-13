"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Star, 
  MessageSquare, 
  Calendar, 
  Image as ImageIcon,
  ExternalLink,
  Search,
  AlertTriangle,
  X
} from 'lucide-react';
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{show: boolean, id: string | null}>({
    show: false,
    id: null
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`*, events ( title )`)
      .order('created_at', { ascending: false });

    if (error) toast.error("Failed to load reviews");
    else setReviews(data || []);
    setLoading(false);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteModal({ show: true, id });
  };

const confirmDelete = async () => {
  if (!deleteModal.id) return;

  const { error } = await supabase.from('reviews').delete().eq('id', deleteModal.id);

  if (error) {
    toast.error("Error deleting review");
  } else {
    // THIS LINE IS CRITICAL:
    setReviews(prev => prev.filter(r => r.id !== deleteModal.id)); 
    toast.success("Review removed successfully");
  }
  setDeleteModal({ show: false, id: null });
};

  const filteredReviews = reviews.filter(review => 
    review.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.events?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
        className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Rakvih Events / Command Center</p>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">
              Review Management
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              {reviews.length} Total Feedback entries
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Filter by user or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* --- REVIEWS TABLE --- */}
        <div className="p-4 md:p-8 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">
                <th className="pb-4 pl-6">Reviewer</th>
                <th className="pb-4">Event Context</th>
                <th className="pb-4">Message</th>
                <th className="pb-4 text-center">Media</th>
                <th className="pb-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredReviews.map((review) => (
                  <motion.tr
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group bg-white hover:bg-slate-50 transition-colors"
                  >
                    {/* User Info */}
                    <td className="py-5 pl-6 rounded-l-2xl border-y border-l border-slate-100">
                       <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-200"} />
                          ))}
                        </div>
                        <p className="font-black text-sm uppercase">{review.user_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(review.created_at).toLocaleDateString()}</p>
                    </td>

                    {/* Event Info */}
                    <td className="py-5 border-y border-slate-100">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-blue-600">
                           <ExternalLink size={12} />
                           {review.events?.title || "Direct Feedback"}
                        </div>
                    </td>

                    {/* Comment */}
                    <td className="py-5 border-y border-slate-100 max-w-xs">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                          "{review.comment}"
                        </p>
                    </td>

                    {/* Media */}
                    <td className="py-5 border-y border-slate-100 text-center">
                        {review.images?.length > 0 ? (
                          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">
                            <ImageIcon size={12} /> {review.images.length}
                          </div>
                        ) : <span className="text-[10px] text-slate-300">None</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-5 pr-6 rounded-r-2xl border-y border-r border-slate-100 text-right">
                        <button 
                          onClick={() => handleDeleteRequest(review.id)}
                          className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredReviews.length === 0 && (
            <div className="py-20 text-center">
              <MessageSquare className="mx-auto text-slate-100 mb-4" size={64} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found</p>
            </div>
          )}
        </div>
      </div>

      {/* --- DELETE POPUP MODAL --- */}
      <AnimatePresence>
        {deleteModal.show && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({show: false, id: null})}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl z-[100] border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Delete Review?</h3>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  Are you sure you want to remove this feedback? This action is permanent and cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setDeleteModal({show: false, id: null})}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[11px] tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setDeleteModal({show: false, id: null})}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}