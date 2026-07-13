"use client";
import React, { useState } from 'react';
import { supabase } from "@/utils/supabase";
import { X, User, Lock, ArrowRight, Loader2, Mail, BadgeCheck, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'login' | 'register';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [view, setView] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const resetForm = () => {
    setMessage({ type: '', text: '' });
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const toggleView = () => {
    setView(view === 'login' ? 'register' : 'login');
    resetForm();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Welcome back! Redirecting...' });
        setTimeout(() => { onClose(); window.location.reload(); }, 1500);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setMessage({ type: 'error', text: error.message });
      else setMessage({ type: 'success', text: 'Success! Check your email to confirm.' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
  if (!email) {
    setMessage({ type: 'error', text: 'Please enter your email address above first.' });
    return;
  }
  
  setLoading(true); // Disable buttons while sending
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`, 
  });

  if (error) {
    setMessage({ type: 'error', text: error.message });
  } else {
    setMessage({ type: 'success', text: 'A reset link has been sent to your inbox.' });
  }
  setLoading(false);
};

return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      {/* Glass Backdrop - Adjusted for better dark mode depth */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-all duration-500" 
        onClick={onClose} 
      />

      {/* Horizontal Modal Card */}
      <div className="relative w-full max-w-4xl flex flex-col md:flex-row bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500 transition-colors">
        
        {/* LEFT SIDE: Visual/Branding (Hidden on mobile) */}
        <div className="hidden md:flex w-1/2 bg-zinc-900 dark:bg-black relative items-center justify-center overflow-hidden">
          {/* Animated Overlay for cinematic feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-black z-10 opacity-70" />
          <img 
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop" 
            alt="Event" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-40 scale-110 hover:scale-100 transition-transform duration-1000"
          />
          <div className="relative z-20 p-12 text-center">
            <Sparkles className="text-indigo-400 dark:text-indigo-500 mb-6 mx-auto animate-pulse" size={48} />
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Rakvih <br /> <span className="text-indigo-400 dark:text-indigo-500 text-5xl">Events</span>
            </h3>
            <p className="text-[9px] font-black text-zinc-300 dark:text-zinc-500 uppercase tracking-[0.4em] opacity-80">
              Premium Experiences Only
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Auth Form */}
        <div className="w-full md:w-1/2 p-8 md:p-14 relative bg-white dark:bg-zinc-950 transition-colors duration-500">
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                {view === 'login' ? 'Sign In' : 'Register'}
              </h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                Rakvih Member Access Panel
              </p>
            </div>

            {/* Error/Success Messages */}
            {message.text && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-2 border ${
                message.type === 'error' 
                ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500' 
                : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500'
              }`}>
                {message.text}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleAuth}>
              {view === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 ml-1">Full Name</label>
                  <div className="relative group">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Password</label>
                  {view === 'login' && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-all"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                  />
                </div>
              </div>

              {/* Submit Button - Flip color logic for Dark Mode */}
              <button 
                disabled={loading}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-zinc-950 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] mt-4 shadow-xl shadow-indigo-500/10 dark:shadow-none disabled:opacity-50 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {view === 'login' ? 'Enter Portal' : 'Create Account'} 
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-4">
              <button 
                onClick={toggleView} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-white transition-colors"
              >
                {view === 'login' ? "Need an account? Register Now" : "Have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}