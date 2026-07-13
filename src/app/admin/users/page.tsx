"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  ShieldCheck, 
  Search, 
  MoreVertical, 
  Clock, 
  ShieldAlert, 
  UserCog,
  Trash2
} from 'lucide-react';
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    // Fetching based on your specific table structure
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error("Error loading profiles");
      console.error(error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper for Role Styling
  const getRoleStyles = (role: string) => {
    switch(role) {
      case 'superadmin': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'admin': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'editor': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
        className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Rakvih Events / System Authority</p>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Admin Profiles<span className="text-blue-600">.</span>
            </h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text"
              placeholder="Filter by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-5 pl-14 pr-6 rounded-3xl text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* --- PROFILES LIST --- */}
        <div className="p-8 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                <th className="pl-8 pb-2">Identity</th>
                <th className="pb-2">Authority Level</th>
                <th className="pb-2">Last Modified</th>
                <th className="pr-8 pb-2 text-right">Settings</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredProfiles.map((profile) => (
                  <motion.tr 
                    key={profile.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group hover:bg-slate-50/50 transition-all cursor-default"
                  >
                    {/* Profile Identity */}
                    <td className="py-6 pl-8 border-y border-l border-slate-100 rounded-l-[2rem]">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight text-slate-900">
                            {profile.full_name || 'System User'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            ID: {profile.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-6 border-y border-slate-100">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getRoleStyles(profile.role)}`}>
                        {profile.role === 'superadmin' ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                        {profile.role}
                      </div>
                    </td>

                    {/* Updated At */}
                    <td className="py-6 border-y border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                        <Clock size={12} />
                        {new Date(profile.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-6 pr-8 border-y border-r border-slate-100 rounded-r-[2rem] text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       
                        <button className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredProfiles.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No profiles found in database</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}