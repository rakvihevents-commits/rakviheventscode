"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { 
  Plus, X, Upload, Trash2, Edit2, Eye, Layers ,
  Film, ImageIcon, ChevronRight, Loader2, PlayCircle 
} from 'lucide-react';

export default function ManageGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [files, setFiles] = useState<{file: File, type: string}[]>([]);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: galleryData } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    const { data: eventData } = await supabase.from('events').select('id, title, category');
    const { data: catData } = await supabase.from('categories').select('name');
    
    if (galleryData) setItems(galleryData);
    if (eventData) setAllEvents(eventData);
    if (catData) setCategories(catData);
  };

  useEffect(() => { fetchData(); }, []);

  // Filter Events based on Category
  useEffect(() => {
    if (selectedCat) {
      setFilteredEvents(allEvents.filter(e => e.category === selectedCat));
    } else {
      setFilteredEvents([]);
    }
  }, [selectedCat, allEvents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        type: file.type.startsWith('video') ? 'video' : 'image'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

 // IMPROVED: Handle Edit
  const handleEdit = (item: any) => {
    setEditId(item.id);
    setTitle(item.title);
    setDescription(item.description || "");
    setSelectedCat(item.category_name || "");
    // Important: Set event after category so the filtered list is ready
    setSelectedEvent(item.event_id || "");
    setExistingMedia(item.media || []);
    setFiles([]); // Clear any new files selected previously
    setIsModalOpen(true);
  };

  // IMPROVED: Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && existingMedia.length === 0) {
      return alert("Please add at least one image or video.");
    }

    setLoading(true);
    let finalMedia = [...existingMedia];

    try {
      // 1. Upload new files
      for (const item of files) {
        // Create a unique path: folder/timestamp-name
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error: uploadErr } = await supabase.storage
          .from('gallery')
          .upload(fileName, item.file);

        if (uploadErr) throw uploadErr;

        const { data: pUrl } = supabase.storage.from('gallery').getPublicUrl(fileName);
        finalMedia.push({ url: pUrl.publicUrl, type: item.type });
      }

      // 2. Prepare payload
      const payload = {
        title,
        description,
        category_name: selectedCat,
        event_id: selectedEvent || null,
        media: finalMedia, // Now contains both old and new media
      };

      // 3. Database operation
      const { error: dbError } = editId 
        ? await supabase.from('gallery').update(payload).eq('id', editId)
        : await supabase.from('gallery').insert([payload]);

      if (dbError) throw dbError;

      closeModal();
      fetchData();
    } catch (err: any) {
      console.error("Critical Error:", err.message);
      alert("Error saving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setTitle(""); setDescription(""); setSelectedCat(""); 
    setSelectedEvent(""); setFiles([]); setExistingMedia([]);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 ">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h1 className="text-3xl font-black text-black uppercase">Mixed Media Gallery</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all">
          <Plus size={20} /> New Album
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-8 py-5">Preview</th>
              <th className="px-8 py-5">Title</th>
              <th className="px-8 py-5">Category </th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex -space-x-4">
                    {item.media?.slice(0, 3).map((m: any, i: number) => (
                      <div key={i} className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden bg-slate-200 shadow-sm relative">
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900"><Film size={12} className="text-white"/></div>
                        ) : (
                          <img src={m.url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                    {item.media?.length > 3 && (
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">+{item.media.length - 3}</div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 font-bold text-black">{item.title}</td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">{item.category_name}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setViewItem(item)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Eye size={16}/></button>
                    <button onClick={() => handleEdit(item)} className="p-3 text-slate-400 hover:text-black hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Edit2 size={16}/></button>
                    <button onClick={async () => { if(confirm("Delete?")) { await supabase.from('gallery').delete().eq('id', item.id); fetchData(); } }} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HORIZONTAL MIXED MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] animate-in zoom-in duration-300">
            
            {/* LEFT: Mixed Media Wall */}
            <div className="md:w-1/2 bg-slate-50 p-10 flex flex-col h-full border-r border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                <Layers size={14}/> Mixed Media Tray
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 gap-3">
                {/* Existing Media (on Edit) */}
                {existingMedia.map((m, i) => (
                  <div key={`ex-${i}`} className="relative aspect-square rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                    {m.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center"><PlayCircle className="text-white"/></div> : <img src={m.url} className="w-full h-full object-cover" />}
                    <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg"><X size={12}/></button>
                  </div>
                ))}

                {/* New Files Preview */}
                {files.map((f, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-2xl bg-white border-2 border-blue-100 overflow-hidden shadow-sm">
                    {f.type === 'video' ? <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="text-white"/></div> : <img src={URL.createObjectURL(f.file)} className="w-full h-full object-cover" />}
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black text-white p-1 rounded-lg"><X size={12}/></button>
                  </div>
                ))}

                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-black transition-all group">
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  <Upload className="text-slate-300 group-hover:text-black transition-colors"/>
                  <span className="text-[8px] font-black uppercase mt-2 text-slate-400">Add More</span>
                </label>
              </div>
            </div>

            {/* RIGHT: Linked Selectors */}
            <div className="md:w-1/2 p-12 bg-white flex flex-col">
              <div className="flex-1 space-y-6">
                 <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-black uppercase tracking-tighter">{editId ? 'Edit Album' : 'New Gallery Entry'}</h2><button onClick={closeModal} className="text-slate-300 hover:text-black"><X/></button></div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">1. Choose Category</label>
                      <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm text-black focus:ring-2 ring-black appearance-none">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                   
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Gallery Title</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm text-black focus:ring-2 ring-black" placeholder="Main Highlight Title" />
                    </div>
                 </div>
              </div>

              <button disabled={loading} onClick={handleSave} className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin"/> : (editId ? "Update Gallery" : "Create Gallery")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW MODAL (Eye Icon Click) */}
      {viewItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
          <div className="w-full max-w-6xl h-full flex flex-col">
            <div className="flex justify-between items-center py-6">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{viewItem.title}</h2>
              <button onClick={() => setViewItem(null)} className="p-3 bg-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all"><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 pb-12">
              {viewItem.media?.map((m: any, i: number) => (
                <div key={i} className="aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10 group relative">
                  {m.type === 'video' ? (
                    <video src={m.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}