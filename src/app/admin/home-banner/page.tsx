"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { 
  Trash2, Film, Image as ImageIcon, 
  Plus, Power, Eye, X, Maximize2 
} from 'lucide-react';

export default function HomeBannerManage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null); // State for the Popup

  useEffect(() => { fetchSliders(); }, []);

  const fetchSliders = async () => {
    const { data } = await supabase
      .from('home_sliders')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setFiles(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('home-banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('home-banners').getPublicUrl(filePath);

      const fileType = file.type.startsWith('video') ? 'video' : 'image';
      await supabase.from('home_sliders').insert([
        { file_url: publicUrl, file_type: fileType, title: file.name, active_status: true }
      ]);

      fetchSliders();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('home_sliders').update({ active_status: !currentStatus }).eq('id', id);
    if (!error) setFiles(files.map(f => f.id === id ? { ...f, active_status: !currentStatus } : f));
  };

  const deleteSlider = async (id: string, url: string) => {
    if (!confirm("Delete this media?")) return;
    const path = url.split('home-banners/').pop();
    if (path) await supabase.storage.from('home-banners').remove([path]);
    await supabase.from('home_sliders').delete().eq('id', id);
    fetchSliders();
  };

  return (
    <div className="relative  pb-20 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tighter uppercase leading-tight">Banner Gallery</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ">Click any image to expand view</p>
        </div>
        <label className="bg-black text-white px-10 py-5 rounded-2xl font-black cursor-pointer hover:bg-zinc-800 transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest shadow-xl active:scale-95">
          {uploading ? <span className="animate-pulse">Uploading...</span> : <><Plus size={18}/> Add Media</>}
          <input type="file" hidden onChange={handleUpload} accept="image/*,video/*" disabled={uploading} />
        </label>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {files.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-500">
            
            {/* MEDIA PREVIEW (CLICKABLE) */}
            <div 
              onClick={() => setSelectedMedia(item)} 
              className="h-60 bg-slate-50 relative overflow-hidden cursor-zoom-in group/media"
            >
              {item.file_type === 'video' ? (
                <video src={item.file_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={item.file_url} className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700" alt="" />
              )}
              
              {/* HOVER ICON */}
              <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                 <Maximize2 className="text-white" size={32} />
              </div>

              <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-xl text-white">
                {item.file_type === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
              </div>
            </div>
            
            {/* ACTIONS */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center gap-4">
                <button 
                  onClick={() => toggleStatus(item.id, item.active_status)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                    item.active_status ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-100 hover:text-black hover:border-black'
                  }`}
                >
                  <Power size={14} strokeWidth={3} />
                  {item.active_status ? 'Live' : 'Hidden'}
                </button>
                <button onClick={() => deleteSlider(item.id, item.file_url)} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- POPUP MODAL (LIGHTBOX) --- */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setSelectedMedia(null)} 
          />
          
          {/* Close Button */}
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 z-[110] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>

          {/* Media Content */}
          <div className="relative z-[105] max-w-5xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
            {selectedMedia.file_type === 'video' ? (
              <video 
                src={selectedMedia.file_url} 
                controls 
                autoPlay 
                className="rounded-3xl shadow-2xl max-h-[80vh] w-auto border border-white/10" 
              />
            ) : (
              <img 
                src={selectedMedia.file_url} 
                className="rounded-3xl shadow-2xl max-h-[80vh] w-auto object-contain border border-white/10" 
                alt="Full Preview"
              />
            )}
            
            <div className="absolute -bottom-12 left-0 right-0 text-center">
               <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] opacity-60">
                 {selectedMedia.file_type} Preview • {selectedMedia.title}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}