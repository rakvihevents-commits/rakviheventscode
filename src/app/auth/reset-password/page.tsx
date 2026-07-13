"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setIsSuccess(true);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        window.location.href = '/'; // Redirect to home/login
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 p-10 pt-14 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">
            Set New <span className="text-indigo-600">Password</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Rakvih Events Security Portal
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${
            message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            {message.text}
          </div>
        )}

        {!isSuccess ? (
          <form className="space-y-5" onSubmit={handleReset}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] mt-4 shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Update Password <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <div className="text-center py-10 animate-bounce">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={64} />
            <p className="text-white font-black uppercase tracking-widest text-sm">Redirecting to login...</p>
          </div>
        )}

        <p className="text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Securely Powered by RAKVH Solutions
        </p>
      </div>
    </div>
  );
}