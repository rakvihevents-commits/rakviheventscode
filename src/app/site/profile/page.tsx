"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Camera, 
  LogOut,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full" />
    </div>
  );

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-black uppercase text-brand-green dark:text-white">Please Login</h2>
      <button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-brand-yellow text-brand-green font-black uppercase text-[10px] rounded-full">Go Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pt-32 pb-20 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* --- PROFILE HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white dark:bg-zinc-900 rounded-[3rem] p-10 shadow-2xl shadow-brand-green/5 border border-slate-100 dark:border-zinc-800 overflow-hidden"
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-10">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-brand-green flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-white" />
                )}
              </div>
              <button className="absolute bottom-2 right-2 p-3 bg-brand-yellow text-brand-green rounded-2xl shadow-lg hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="px-4 py-1 rounded-full bg-brand-green/10 text-brand-green dark:text-brand-yellow text-[10px] font-black uppercase tracking-widest border border-brand-green/20">
                Verified Member
              </span>
              <h1 className="text-4xl font-black text-brand-green dark:text-white uppercase tracking-tighter mt-4 leading-none">
                {user.user_metadata?.full_name || 'Premium User'}
              </h1>
              <p className="text-slate-400 dark:text-zinc-500 font-medium mt-2 flex items-center justify-center md:justify-start gap-2 uppercase text-[10px] tracking-widest">
                <Mail size={12} className="text-brand-yellow" /> {user.email}
              </p>
            </div>

            <button onClick={handleLogout} className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={20} />
            </button>
          </div>

          {/* Stats Divider */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-10 border-t border-slate-50 dark:border-zinc-800/50">
            <div className="text-center">
              <p className="text-2xl font-black text-brand-green dark:text-white">12</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Bookings</p>
            </div>
            <div className="text-center border-x border-slate-100 dark:border-zinc-800">
              <p className="text-2xl font-black text-brand-yellow">04</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Wishlist</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-brand-green dark:text-white">Gold</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tier</p>
            </div>
          </div>
        </motion.div>

        {/* --- SETTINGS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          
          {/* Account Details Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <Settings size={14} className="text-brand-yellow" /> Account Details
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{user.user_metadata?.phone || 'Not linked'}</p>
                </div>
                <button className="text-[10px] font-black text-brand-green dark:text-brand-yellow uppercase">Edit</button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined On</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <Calendar size={16} className="text-slate-300" />
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-yellow" /> Privacy & Security
            </h3>
            
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-brand-green group transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 group-hover:text-white">Change Password</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-brand-green group transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 group-hover:text-white">Two-Factor Auth</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
              </button>
            </div>
          </div>

        </div>

        {/* --- DANGER ZONE --- */}
        <div className="mt-12 text-center px-10 py-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Manage Account Data</p>
          <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">
            Request Data Deletion
          </button>
        </div>

      </div>
    </div>
  );
}