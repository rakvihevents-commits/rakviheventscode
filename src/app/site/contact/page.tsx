"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Phone, MapPin, Send, Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight 
} from 'lucide-react';

// --- SHARED ANIMATION VARIANTS (from your About page) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const heroTitleVariants = {
  hidden: { opacity: 0, y: 100, scale: 0.8, rotateX: -90 },
  visible: {
    opacity: 1, y: 0, scale: 1, rotateX: 0,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.9, rotate: -5 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.15 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.4 }
  }
};

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [siteData, setSiteData] = useState<any>(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false, msg: '', type: 'success'
  });

  useEffect(() => {
    setMounted(true);
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) setSiteData(data);
    };
    fetchSettings();
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { error } = await supabase.from('contact_messages').insert([formData]);
    setIsSending(false);

    if (error) {
      triggerToast("Failed to send message.", "error");
    } else {
      triggerToast("Message sent successfully!", "success");
      setFormData({ full_name: '', email: '', phone: '', message: '' });
    }
  };

  if (!mounted || !siteData) return null;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white pt-12 pb-20 px-6 relative overflow-hidden"
    >
      
      {/* --- BACKGROUND BLOBS --- */}
      <motion.div 
        animate={{ x: [0, 100, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-green/15 blur-[130px] rounded-full pointer-events-none" 
      />

      {/* --- TOAST COMPONENT --- */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, scale: 0.9, x: "-50%" }}
            className={`fixed bottom-10 left-1/2 z-[100] flex items-center gap-4 px-8 py-5 rounded-full shadow-2xl border backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-brand-green text-brand-yellow' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-black uppercase tracking-[0.2em] text-[11px]">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-8xl mx-auto relative z-10">
        
        {/* --- HEADER WITH HERO ANIMATION --- */}
        <header className="mb-20 text-center lg:text-left">
          <motion.div 
            variants={cardVariants}
            custom={0}
            className="flex items-center justify-center lg:justify-start gap-3 text-brand-green font-black uppercase tracking-[0.5em] text-[11px] mb-4"
          >
            <div className="w-12 h-[1px] bg-brand-green/30" />
            <Sparkles size={14} className="text-brand-yellow animate-pulse" /> Connection Portal
          </motion.div>
          <motion.h1 
            variants={heroTitleVariants}
            className="text-8xl md:text-8xl font-black  tracking-tighter leading-[0.8]"
          >
            The <span className="text-brand-green">Inquiry</span><span className="text-brand-yellow">.</span>
          </motion.h1>
        </header>

        {/* --- MAIN GRID --- */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-stretch"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          
          {/* --- LEFT: INFO CARD (3D SLIDE) --- */}
          <motion.div 
            variants={cardVariants}
            custom={1}
            className="lg:col-span-5 bg-brand-green rounded-[3.5rem] p-12 md:p-16 text-brand-yellow shadow-2xl relative overflow-hidden group border border-white/10 flex flex-col justify-between"
          >
            <div className="relative z-10">
              <h2 className="text-5xl font-black uppercase tracking-tighter mb-12 leading-none text-white">
                Let's build <br/> something <span className="text-brand-yellow">iconic.</span>
              </h2>
              
              <div className="space-y-10">
                {[
                  { icon: <Phone size={22} />, label: "Direct Line", value: siteData.phone_number },
                  { icon: <Mail size={22} />, label: "Electronic Mail", value: siteData.email },
                  { icon: <MapPin size={22} />, label: "Headquarters", value: siteData.address }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-6 group/item"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                  >
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-yellow border border-white/10 group-hover/item:scale-110 group-hover/item:bg-brand-yellow group-hover/item:text-brand-green transition-all duration-500">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{item.label}</p>
                      <p className="text-xl font-bold tracking-tight text-white">{item.value || "Not set"}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              className="mt-20 flex gap-4 relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[siteData.instagram_url, siteData.facebook_url].map((url, i) => url && (
                <a key={i} href={url} target="_blank" className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white font-bold text-[10px] uppercase tracking-widest hover:bg-brand-yellow hover:text-brand-green transition-all duration-300">
                  {i === 0 ? "Instagram" : "Facebook"}
                </a>
              ))}
            </motion.div>
          </motion.div>

          {/* --- RIGHT: FORM (STAGGERED FADE) --- */}
          <motion.div 
            variants={cardVariants}
            custom={2}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormInput label="Nominal Identity" placeholder="Full Name" value={formData.full_name} delay={0.6} onChange={(val:any) => setFormData({...formData, full_name: val})} />
                <FormInput label="Email Address" placeholder="email@example.com" type="email" value={formData.email} delay={0.7} onChange={(val:any) => setFormData({...formData, email: val})} />
              </div>

              <FormInput label="Phone number" placeholder="+91 9876543210" value={formData.phone} delay={0.8} onChange={(val:any) => setFormData({...formData, phone: val})} />

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 ml-1 group-focus-within:text-brand-green transition-colors">Inquiry Message</p>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Describe your vision..." 
                  className="w-full bg-slate-100/50 dark:bg-white/5 border-b-2 border-slate-200 dark:border-white/10 p-6 focus:border-brand-green focus:bg-white dark:focus:bg-white/10 outline-none transition-all rounded-t-3xl resize-none font-medium" />
              </motion.div>

              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                type="submit" 
                disabled={isSending}
                className="group relative w-full h-24 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-[0.4em] text-[11px] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-4">
                  {isSending ? <Loader2 className="animate-spin" size={18} /> : <>Commence Project <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></>}
                </span>
                <div className="absolute inset-0 bg-brand-green scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-[cubic-bezier(0.85,0,0.15,1)]" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity delay-300">
                  <span className="text-brand-yellow z-20">Send Inquiry Now</span>
                </div>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FormInput({ label, placeholder, value, onChange, delay, type = "text" }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 ml-1 group-focus-within:text-brand-green transition-colors">{label}</p>
      <input 
        required type={type} value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full bg-slate-100/50 dark:bg-white/5 border-b-2 border-slate-200 dark:border-white/10 p-6 focus:border-brand-green focus:bg-white dark:focus:bg-white/10 outline-none transition-all rounded-t-3xl font-medium" 
      />
    </motion.div>
  );
}