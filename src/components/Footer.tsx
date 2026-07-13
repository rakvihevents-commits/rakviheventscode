"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import Link from 'next/link';
// We use generic icons to avoid the "Module not found" error
import {
    Camera,      // Used for Instagram
    Share2,      // Used for Facebook
    MessageSquare, // Used for WhatsApp
    Mail,
    Phone,
    MapPin,
    ArrowUpRight
} from 'lucide-react';

export default function Footer() {
    const [siteData, setSiteData] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
            if (data) setSiteData(data);
        };
        fetchSettings();
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Events', path: '/site/events' },
        { name: 'Packages', path: '/site/packages' },
        { name: 'Gallery', path: '/site/gallery' },
        { name: 'About Us', path: '/site/about' },
        { name: 'Contact', path: '/site/contact' },
    ];

    if (!siteData) return null;

    return (
        <footer className="bg-black text-white pt-20 pb-10 px-6 md:px-12 border-t border-white/5">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">

                    {/* BRAND COLUMN */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="flex items-center gap-4">
                            {siteData.logo_url && (
                                <img src={siteData.logo_url} alt="Logo" className="w-12 h-12 object-contain" />
                            )}
                            <h2 className="text-2xl font-black tracking-tighter uppercase">{siteData.site_name}</h2>
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
                            {siteData.description || "Crafting premium experiences and unforgettable moments."}
                        </p>

                        {/* SOCIAL LINKS (Using Generic Icons) */}
                        {/* SOCIAL LINKS (Using Direct SVGs) */}
                        <div className="flex gap-4 pt-4">
                            {siteData.instagram_url && (
                                <a
                                    href={siteData.instagram_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-pink-600 transition-all group"
                                    aria-label="Instagram"
                                >
                                    <svg
                                        className="w-5 h-5 fill-none stroke-current stroke-[2] transition-transform group-hover:scale-110"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                </a>
                            )}

                            {siteData.facebook_url && (
                                <a
                                    href={siteData.facebook_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all group"
                                    aria-label="Facebook"
                                >
                                    <svg
                                        className="w-5 h-5 fill-none stroke-current stroke-[2] transition-transform group-hover:scale-110"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </a>
                            )}

                            {siteData.whatsapp_channel && (
                                <a
                                    href={siteData.whatsapp_channel}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all group"
                                    aria-label="WhatsApp"
                                >
                                    {/* Reusing MessageSquare for WhatsApp consistency */}
                                    <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* QUICK LINKS */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8">Navigation</h3>
                        <ul className="space-y-4">
                            {navLinks.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.path} className="text-sm font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                                        {link.name}
                                        <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CONTACT INFO */}
                    <div className="md:col-span-4 lg:col-span-5 space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Connect</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-indigo-400"><Phone size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Call Support</p>
                                    <p className="text-sm font-bold">{siteData.phone_number}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-indigo-400"><Mail size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Email</p>
                                    <p className="text-sm font-bold">{siteData.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-indigo-400"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Studio</p>
                                    <p className="text-sm font-bold leading-relaxed">{siteData.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COPYRIGHT */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} {siteData.site_name}. All Rights Reserved.</p>
                    <p>Powered by <span className="text-white">RAKVH Solutions</span></p>
                </div>
            </div>
        </footer>
    );
}