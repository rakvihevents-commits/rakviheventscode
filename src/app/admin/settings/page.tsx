"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { useRouter } from 'next/navigation'; // Added for logout redirect
import { 
  Save, Globe, Phone, Share2, Loader2, 
  CheckCircle, Camera, Trash2, Layout, LogOut // Added LogOut
} from 'lucide-react';

export default function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [settings, setSettings] = useState({
    site_name: '',
    tag_line: '',
    description: '',
    email: '',
    phone_number: '',
    address: '',
    instagram_url: '',
    whatsapp_channel: '',
    facebook_url: '',
    logo_url: '' // Added logo_url
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  // --- LOGO UPLOAD HANDLER ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      // Upload to your existing bucket (e.g., 'home-banners' or create a new one called 'site-assets')
      const { error: uploadError } = await supabase.storage
        .from('home-banners') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('home-banners').getPublicUrl(filePath);

      // Update state and immediately save to DB
      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      await supabase.from('site_settings').update({ logo_url: publicUrl }).eq('id', 1);
      
      setMessage("Logo updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/adminlogin");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('site_settings').update(settings).eq('id', 1);
    if (!error) {
      setMessage("Settings Saved");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  };

  const inputStyle = "w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-black/5 focus:border-black focus:bg-white transition-all font-bold text-black outline-none placeholder:text-slate-300";
  const sectionHeading = "font-black uppercase tracking-[0.2em] text-sm text-black mb-1";

  if (loading) return <div className="flex h-[70vh] items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Loading System...</div>;

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700 p-4">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
             {settings.logo_url ? (
               <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
             ) : (
               <Layout className="text-slate-300" />
             )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase">Control Center</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Global Site & Brand Assets</p>
          </div>
        </div>
        {message && (
          <div className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 animate-bounce">
            <CheckCircle size={16} /> {message}
          </div>
        )}
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: BRAND & LOGO */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black text-white rounded-2xl"><Camera size={20}/></div>
              <h2 className={sectionHeading}>Visual Identity</h2>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative group w-full aspect-video bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img src={settings.logo_url} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                ) : (
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center px-6">Upload Site Logo <br/> (PNG/SVG Preferred)</p>
                )}
                
                <label className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center flex-col gap-2">
                   <div className="bg-white p-4 rounded-full text-black"><Camera size={24}/></div>
                   <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Logo</span>
                   <input type="file" hidden onChange={handleLogoUpload} accept="image/*" disabled={uploading} />
                </label>
              </div>
              {uploading && <p className="text-[10px] font-black text-indigo-600 animate-pulse tracking-[0.2em] uppercase">Uploading Logo...</p>}
            </div>
          </div>

          {/* SOCIALS */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200"><Share2 size={20}/></div>
              <h2 className={sectionHeading}>Connect</h2>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Instagram URL" value={settings.instagram_url} onChange={(e) => setSettings({...settings, instagram_url: e.target.value})} className={inputStyle + " text-xs"} />
              <input type="text" placeholder="WhatsApp Link" value={settings.whatsapp_channel} onChange={(e) => setSettings({...settings, whatsapp_channel: e.target.value})} className={inputStyle + " text-xs"} />
              <input type="text" placeholder="Facebook URL" value={settings.facebook_url} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} className={inputStyle + " text-xs"} />
            </div>
          </div>
        </div>

        {/* RIGHT: TEXT CONTENT */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Globe size={20}/></div>
              <h2 className={sectionHeading}>Website Meta Data</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Site Name</label>
                <input type="text" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} className={inputStyle} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Global Tagline</label>
                <input type="text" value={settings.tag_line} onChange={(e) => setSettings({...settings, tag_line: e.target.value})} className={inputStyle} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">SEO Description</label>
              <textarea rows={4} value={settings.description} onChange={(e) => setSettings({...settings, description: e.target.value})} className={inputStyle + " resize-none"} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl"><Phone size={20}/></div>
              <h2 className={sectionHeading}>Business Contact Info</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input type="email" placeholder="Email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className={inputStyle} />
              <input type="text" placeholder="Phone" value={settings.phone_number} onChange={(e) => setSettings({...settings, phone_number: e.target.value})} className={inputStyle} />
            </div>
            <input type="text" placeholder="Address" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className={inputStyle} />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-black text-white p-10 rounded-[3rem] font-black uppercase tracking-[0.5em] text-[10px] shadow-2xl hover:bg-zinc-800 transition-all flex flex-col items-center gap-4"
          >
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={24}/> Update All Global Settings</>}
          </button>
        </div>

      </form>
    </div>
  );
}