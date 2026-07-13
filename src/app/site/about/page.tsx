"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase";
import {
  Users, Target, ArrowRight, Mail, Phone, MapPin, MessageCircle
} from 'lucide-react';
import { motion, Variants } from "framer-motion";

// --- CUSTOM SVG ICONS ---
const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

// --- PAGE-WIDE ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const heroTitleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.8,
    rotateX: -90
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.5
    }
  }
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 80,
    scale: 0.9,
    rotate: -5
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.3 + i * 0.15
    }
  })
};

const heroSubtitleVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 1.2
    }
  }
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: 100 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.68, -0.55, 0.265, 1.55],
      delay: 0.2
    }
  }
};

const teamCardVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
    rotateY: 90
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      duration: 0.9,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.8 + i * 0.2
    }
  })
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4
    }
  }
};

export default function AboutUsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [data, setData] = useState<{
    story: string;
    mission: string;
    team: any[];
    stats: any[];
  }>({
    story: '',
    mission: '',
    team: [],
    stats: []
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        const { data: sections } = await supabase.from('about_sections').select('*');
        const { data: teamData } = await supabase.from('team_members').select('*').order('priority', { ascending: true });
        const { data: statsData } = await supabase.from('about_stats').select('*');

        setSettings(settingsData);
        setData({
          story: sections?.find(s => s.section_type === 'story')?.content || '',
          mission: sections?.find(s => s.section_type === 'mission')?.content || '',
          team: teamData || [],
          stats: statsData || []
        });
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchAll();
  }, []);

  return (
    <motion.div
      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-brand-yellow selection:text-brand-green transition-colors duration-500"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      {/* --- PREMIUM HERO BANNER --- */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          initial={{ scale: 1.3, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ backgroundImage: "url('/aboutusbanner.jpeg')" }}
        />
        <motion.div
          className="absolute inset-0 z-10 bg-gradient-to-r from-brand-green/95 via-brand-green/60 dark:via-brand-green/80 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-20 w-full">
          <motion.div variants={heroTitleVariants} className="max-w-3xl">
            <motion.h1
              className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {settings?.site_name || 'RAKVIH EVENTS'}<br />
              <motion.span
                className="text-brand-yellow"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                About US.
              </motion.span>
            </motion.h1>

            <motion.p
              variants={heroSubtitleVariants}
              className="mt-8 text-white/90 text-lg md:text-xl font-medium leading-relaxed max-w-xl"
            >
              {settings?.description}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <motion.section
        variants={statsVariants}
        className="relative z-30 -mt-16 max-w-7xl mx-auto px-6"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {data.stats.map((s: any, i: number) => (
            <motion.div
              key={i}
              variants={cardVariants}
              custom={i}
              className="bg-white dark:bg-slate-900 border-b-4 border-brand-yellow p-8 shadow-2xl rounded-2xl text-center group hover:bg-brand-green transition-all duration-300 origin-bottom"
            >
              <motion.h2
                className="text-4xl font-black text-brand-green dark:text-brand-yellow group-hover:text-brand-yellow mb-1 transition-colors"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.5 + i * 0.1 }}
              >
                {s.value}
              </motion.h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-white/70">
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* --- STORY & MISSION --- */}
      <motion.section
        className="pt-5 pb-12 max-w-7xl mx-auto px-2 grid lg:grid-cols-2 gap-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.div variants={cardVariants} custom={0}>
          <motion.h2
            className="text-brand-green dark:text-brand-yellow text-sm font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div className="w-10 h-[2px] bg-brand-yellow" />
            Our Journey
          </motion.h2>
          <div className="prose prose-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
            {data.story}
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          custom={1}
          className="bg-brand-green p-12 rounded-[3rem] text-white relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/20 rounded-full -mr-16 -mt-16" />
          <Target className="text-brand-yellow mb-6 relative z-10" size={48} />
          <h3 className="text-3xl font-black uppercase mb-6 tracking-tighter relative z-10">Our Mission</h3>
          <p className="text-xl text-white/80 leading-relaxed relative z-10 italic">"{data.mission}"</p>
        </motion.div>
      </motion.section>

      {/* --- LEADERSHIP SECTION WITH CINEMATIC ENTRANCE --- */}
      <motion.section
        className="pt-6 pb-14 bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-brand-yellow/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-brand-yellow font-black text-xs uppercase tracking-[0.5em] mb-4 block">Our Team</span>
              <h2 className="text-6xl md:text-7xl font-black text-brand-green dark:text-white uppercase tracking-tighter leading-none">
                The <span className="text-transparent stroke-2 bg-clip-text bg-gradient-to-b from-brand-green to-slate-900 dark:from-white dark:to-slate-500">Leadership</span>
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-[250px] border-l-2 border-brand-yellow pl-4"
            >
              The professional minds steering your events toward perfection.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {data.team.map((m: any, i: number) => (
              <motion.div
                key={m.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -15 }}
                className="group relative bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl dark:shadow-2xl transition-all duration-500 border border-slate-200/50 dark:border-slate-800"
              >
                <div className="relative mb-10">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    className="w-20 h-20 bg-brand-green rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.2)] group-hover:bg-brand-yellow group-hover:rotate-12 transition-all duration-500"
                  >
                    <span className="text-4xl font-black text-white group-hover:text-brand-green uppercase">
                      {m.name?.charAt(0) || ''}
                    </span>
                  </motion.div>
                </div>

                <h4 className="text-3xl font-black text-brand-green dark:text-white uppercase tracking-tighter leading-none group-hover:text-brand-yellow transition-colors">
                  {m.name}
                </h4>
                <div className="flex items-center gap-3 mt-4 mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: 24 }}
                    className="h-[2px] bg-brand-yellow"
                  />
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.role}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {m.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- FINAL CTA BANNER: THE GRAND FINALE --- */}
      <motion.section 
        className="relative z-40 -mb-4 max-w-7xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-brand-green dark:bg-brand-green/90 border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] rounded-[4rem] p-10 md:p-16 overflow-hidden relative group">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-brand-yellow rounded-full blur-[120px] pointer-events-none"
          />
          
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute -left-20 -bottom-20 w-[300px] h-[300px] bg-white rounded-full blur-[100px] pointer-events-none"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center text-white">
            <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-white/20 pb-8 lg:pb-0 lg:pr-8">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-brand-yellow font-black text-[10px] uppercase tracking-[0.4em] block mb-3"
              >
                Connect with us
              </motion.span>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.85]">
                Let's Start <br />
                <motion.span 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="text-brand-yellow bg-clip-text text-transparent bg-gradient-to-r from-brand-yellow to-white/80"
                >
                  Planning.
                </motion.span>
              </h3>
            </div>

            {[
              { Icon: Mail, label: "Drop a line", val: settings?.email, delay: 0.2 },
              { Icon: Phone, label: "Quick Call", val: settings?.phone_number, delay: 0.3 },
              { Icon: MapPin, label: "Our Studio", val: settings?.address, delay: 0.4 },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.delay }}
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-green transition-all duration-500 shadow-xl group-hover:shadow-brand-yellow/20">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.Icon size={28} />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 group-hover:text-brand-yellow/60 transition-colors">
                    {item.label}
                  </p>
                  <p className="font-bold text-sm md:text-base group-hover:text-white transition-colors truncate">
                    {item.val}
                  </p>
                  <div className="h-px w-0 group-hover:w-full bg-brand-yellow/50 transition-all duration-500 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}