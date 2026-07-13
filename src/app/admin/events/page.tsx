"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import {
  Plus, X, Upload, Trash2, Edit2, Eye,
  Calendar, CheckCircle2, AlertCircle, IndianRupee, ListPlus
} from 'lucide-react';

export default function ManageEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // State for the packages list within the form
  const [packages, setPackages] = useState<{ name: string, price: string, requirements: string }[]>([]);


  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");

  const fetchData = async () => {
    const { data: eventData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    const { data: catData } = await supabase.from('categories').select('name');
    if (eventData) setEvents(eventData);
    if (catData) setCategories(catData);
  };

  useEffect(() => { fetchData(); }, []);

  // NEW: Updated Form State for Multiple Files
  const [imageFiles, setImageFiles] = useState<{ file: File, id: string }[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Update handleEditClick to handle multiple images
  // 1. Add 'async' here
  const handleEditClick = async (event: any) => {
    setEditId(event.id);
    setTitle(event.title);
    setCategory(event.category);
    setPrice(event.price.toString());
    setStatus(event.status || "Active");
    setDescription(event.description || "");
    setServices(event.services_included?.join(", ") || "");

    setExistingImages(Array.isArray(event.image_url) ? event.image_url : [event.image_url].filter(Boolean));

    // 2. This 'await' now works because the function is async
    const { data: pkgData } = await supabase
      .from('event_packages')
      .select('*')
      .eq('event_id', event.id);

    if (pkgData) {
      const formattedPackages = pkgData.map(p => ({
        name: p.package_name || "",
        price: p.price?.toString() || "",
        // Ensures requirements is always a string for the textarea
        requirements: Array.isArray(p.requirements)
          ? p.requirements.join(", ")
          : (p.requirements || "")
      }));
      setPackages(formattedPackages);
    } else {
      setPackages([]); // Clear packages if none found
    }

    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let final_image_urls = [...existingImages];

      // 1. Upload new images
      for (const item of imageFiles) {
        const fileName = `${Date.now()}-${item.file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('event-images')
          .upload(fileName, item.file);

        if (uploadErr) {
          console.error("Upload failed for:", item.file.name, uploadErr);
          continue;
        }

        const { data: pUrl } = supabase.storage.from('event-images').getPublicUrl(fileName);
        final_image_urls.push(pUrl.publicUrl);
      }

      const eventPayload = {
        title,
        category,
        price: parseFloat(price) || 0,
        description,
        status,
        services_included: services.split(",").map(s => s.trim()).filter(Boolean),
        image_url: final_image_urls
      };

      // 2. Save/Update Event
      let eventId = editId;

      if (editId) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editId);
        if (updateErr) throw updateErr;
      } else {
        // Insert new - crucial to use .select() to get the generated ID back
        const { data: insertedData, error: insertErr } = await supabase
          .from('events')
          .insert([eventPayload])
          .select()
          .single();

        if (insertErr) throw insertErr;
        eventId = insertedData.id; // Assign the new ID
      }

      // 3. Handle Packages
      if (eventId) {
        // Always clear existing packages for this ID first (Standardizes Insert vs Update)
        await supabase.from('event_packages').delete().eq('event_id', eventId);

        const packagePayload = packages
          .filter(pkg => pkg.name.trim() !== "")
          .map(pkg => ({
            event_id: eventId, // Use the guaranteed eventId
            package_name: pkg.name,
            price: parseFloat(pkg.price) || 0,
            requirements: pkg.requirements.split(",").map(r => r.trim()).filter(Boolean)
          }));

        if (packagePayload.length > 0) {
          const { error: pkgErr } = await supabase.from('event_packages').insert(packagePayload);
          if (pkgErr) throw pkgErr;
        }
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      alert("Save Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setViewEvent(null);
    setEditId(null);
    setTitle(""); setPackages([]);
    setCategory("");
    setPrice("");
    setStatus("Active");
    setDescription("");
    setServices("");

    // 1. Clear the NEW multiple image states (Correct)
    setImageFiles([]);
    setExistingImages([]);

    // 2. REMOVED the lines causing the ReferenceError:
    // setImageFile(null);          <-- Gone
    // setExistingImageUrl("");     <-- Gone

    // 3. Clear the native file input value
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => { input.value = ''; });
  };
  const handleDeleteEvent = async () => {
    if (!deleteId) return;

    setLoading(true);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', deleteId);

    if (!error) {
      setDeleteId(null);
      fetchData(); // Refresh the list
    } else {
      alert("Delete Error: " + error.message);
    }
    setLoading(false);
  };

  const handleViewClick = async (event: any) => {
    setLoading(true);
    try {
      const { data: pkgData, error } = await supabase
        .from('event_packages')
        .select('*')
        .eq('event_id', event.id);

      if (error) throw error;

      // This state update is what triggers the view modal to show
      setViewEvent({
        ...event,
        packages: pkgData || []
      });
    } catch (err: any) {
      console.error("Error:", err.message);
      setViewEvent({ ...event, packages: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Calendar size={16} />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Event Management</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight  uppercase">Event List</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200">
          <Plus size={20} /> Add Event
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Preview</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Title & Category</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-black">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center -space-x-4">
                    {Array.isArray(event.image_url) && event.image_url.length > 0 ? (
                      <>
                        {/* Show up to 2 images stacked */}
                        {event.image_url.slice(0, 2).map((url: string, index: number) => (
                          <div
                            key={index}
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm relative shrink-0"
                            style={{ zIndex: 10 - index }}
                          >
                            <img src={url} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        ))}

                        {/* If there are more than 2, show the +X count */}
                        {event.image_url.length > 2 && (
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white flex items-center justify-center z-0 -ml-2 shrink-0 shadow-sm">
                            <span className="text-[10px] font-black text-white">
                              +{event.image_url.length - 2}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback for single string or empty */
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm">
                        <img
                          src={typeof event.image_url === 'string' ? event.image_url : '/placeholder.png'}
                          className="w-full h-full object-cover"
                          alt="Placeholder"
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="font-bold text-lg">{event.title}</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{event.category}</p>
                </td>
                <td className="px-8 py-5 font-black text-lg">₹{event.price.toLocaleString()}</td>
                <td className="px-8 py-5 text-xs">
                  <span className={`px-3 py-1 rounded-lg font-black uppercase border ${event.status === 'Active' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleViewClick(event)} className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all text-slate-400 hover:text-blue-600"><Eye size={16} /></button>
                    <button onClick={() => handleEditClick(event)} className="p-3 bg-white hover:bg-black hover:text-white rounded-xl border border-slate-200 transition-all text-slate-400"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(event.id)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HORIZONTAL ADD/EDIT MODAL */}
      {/* CONDENSED HORIZONTAL ADD/EDIT MODAL */}
      {/* CONDENSED HORIZONTAL ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black">
          <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
            <div className="flex flex-col md:flex-row h-[600px]"> {/* Adjusted height for better visibility */}

              {/* LEFT SIDE: Compact Media Tray (Narrower) */}
              <div className="md:w-1/4 bg-slate-50 p-5 border-r border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-black text-black uppercase tracking-tight">
                    {editId ? 'Edit' : 'Create'} Event
                  </h2>
                  <button onClick={closeModal} className="md:hidden text-slate-400"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Media Tray</label>
                  <div className="grid grid-cols-2 gap-2">
                    {existingImages.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} className="w-full h-full object-cover" alt="preview" />
                        <button
                          type="button"
                          onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {imageFiles.map((item) => (
                      <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-400">
                        <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover opacity-70" alt="new" />
                        <button
                          type="button"
                          onClick={() => setImageFiles(prev => prev.filter(f => f.id !== item.id))}
                          className="absolute top-1 right-1 bg-black text-white p-1 rounded-md"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-black transition-all">
                      <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" />
                      <Upload size={16} className="text-slate-300" />
                      <span className="text-[7px] font-black uppercase mt-1 text-slate-400">Add</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex gap-1">
                    {['Active', 'Inactive'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${status === s ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Compact Multi-Column Form */}
              <div className="md:w-3/4 p-6 relative flex flex-col">
                <button onClick={closeModal} className="hidden md:block absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>

                <form onSubmit={handleSaveEvent} className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">

                    {/* Basic Info Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Title</label>
                        <input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black placeholder:text-slate-300 outline-none ring-black focus:ring-1"
                          placeholder="Event Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Starting Price</label>
                        <input
                          type="number"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black placeholder:text-slate-300 outline-none ring-black focus:ring-1"
                          placeholder="₹"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none ring-black focus:ring-1 appearance-none"
                        >
                          <option value="" className="text-slate-400">Select...</option>
                          {categories.map(cat => (
                            <option key={cat.name} value={cat.name} className="text-black">{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Services (CSV)</label>
                        <input
                          value={services}
                          onChange={e => setServices(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black placeholder:text-slate-300 outline-none ring-blue-500 focus:ring-1"
                          placeholder="Catering, Decor..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium text-black placeholder:text-slate-300 outline-none ring-black focus:ring-1 resize-none"
                        placeholder="Details..."
                      />
                    </div>

                    {/* Packages Row - Horizontal Scrollable */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-500">
                          <IndianRupee size={10} /> Packages
                        </h3>
                        <button
                          type="button"
                          onClick={() => setPackages([...packages, { name: "", price: "", requirements: "" }])}
                          className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          + Add Package
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                        {packages.map((pkg, index) => (
                          <div key={index} className="min-w-[240px] p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 relative shadow-sm">
                            <button
                              type="button"
                              onClick={() => setPackages(packages.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                            <input
                              placeholder="Package Name"
                              className="w-full p-2 bg-white rounded-lg text-[10px] font-bold text-black outline-none border border-slate-100 focus:border-blue-400"
                              value={pkg.name}
                              onChange={(e) => {
                                const newPkgs = [...packages];
                                newPkgs[index] = { ...newPkgs[index], name: e.target.value };
                                setPackages(newPkgs);
                              }}
                            />
                            <input
                              placeholder="Package Price"
                              type="number"
                              className="w-full p-2 bg-white rounded-lg text-[10px] font-bold text-black outline-none border border-slate-100 focus:border-blue-400"
                              value={pkg.price}
                              onChange={(e) => {
                                const newPkgs = [...packages];
                                newPkgs[index] = { ...newPkgs[index], price: e.target.value };
                                setPackages(newPkgs);
                              }}
                            />
                            <textarea
                              placeholder="Requirements (CSV)..."
                              className="w-full p-2 bg-white rounded-lg text-[9px] text-black font-medium outline-none border border-slate-100 focus:border-blue-400 resize-none"
                              rows={2}
                              value={pkg.requirements}
                              onChange={(e) => {
                                const newPkgs = [...packages];
                                newPkgs[index] = { ...newPkgs[index], requirements: e.target.value };
                                setPackages(newPkgs);
                              }}
                            />
                          </div>
                        ))}
                        {packages.length === 0 && (
                          <div className="w-full py-8 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Packages Added</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 shrink-0">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Syncing System..." : (editId ? "Update Event Architecture" : "Deploy New Event")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl flex flex-col max-h-[90vh]">

            {/* HEADER IMAGE SECTION */}
            <div className="relative h-64 shrink-0">
              <img
                src={Array.isArray(viewEvent.image_url) ? viewEvent.image_url[0] : viewEvent.image_url}
                className="w-full h-full object-cover"
                alt="Event"
              />
              <button
                onClick={() => setViewEvent(null)}
                className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-xl hover:scale-110 transition-transform z-10"
              >
                <X size={20} className="text-black" />
              </button>
              <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent w-full">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">{viewEvent.category}</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{viewEvent.title}</h2>
              </div>
            </div>

            {/* CONTENT SECTION (SCROLLABLE) */}
            <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">

              {/* PRICE & STATUS */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">Starts at</span>
                  <p className="text-2xl font-black text-black">₹{viewEvent.price?.toLocaleString()}</p>
                </div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${viewEvent.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500'}`}>
                  {viewEvent.status}
                </span>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">About Event</h4>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{viewEvent.description || "No description provided."}</p>
              </div>

              {/* INCLUDED SERVICES */}
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard Services</h4>
                <div className="flex flex-wrap gap-2">
                  {viewEvent.services_included && viewEvent.services_included.length > 0 ? (
                    viewEvent.services_included.map((s: string, index: number) => (
                      <span key={index} className="px-3 py-2 bg-slate-50 text-black rounded-xl text-[10px] font-black uppercase border border-slate-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold italic">Standard event planning services included.</p>
                  )}
                </div>
              </div>

              {/* --- PACKAGES SECTION --- */}
              {viewEvent.packages && viewEvent.packages.length > 0 && (
                <div className="space-y-5 pt-6 border-t border-slate-100">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Packages</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewEvent.packages.map((pkg: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-black text-black text-xs uppercase tracking-tight">
                            {pkg.package_name || pkg.name}
                          </h5>
                          <span className="text-blue-600 font-black text-xs bg-blue-50 px-2 py-1 rounded-lg">
                            ₹{pkg.price?.toLocaleString()}
                          </span>
                        </div>

                        {/* Requirements/Details for Package */}
                        <div className="space-y-2">
                          {(Array.isArray(pkg.requirements)
                            ? pkg.requirements
                            : (pkg.requirements?.split(',') || [])
                          ).map((req: string, rIdx: number) => (
                            <div key={rIdx} className="flex items-start gap-2 text-[10px] text-slate-500 font-bold">
                              <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
                              <span className="leading-tight">{req.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER ACTION */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setViewEvent(null)}
                className="w-full py-4 bg-black text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL (READ ONLY) */}
      {/* Add this check: viewEvent && ... */}
      {viewEvent && viewEvent.packages && viewEvent.packages.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Packages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {viewEvent.packages.map((pkg: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-black text-sm uppercase">{pkg.package_name || pkg.name}</h5>
                  <span className="text-blue-600 font-black text-xs">₹{pkg.price?.toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  {(Array.isArray(pkg.requirements)
                    ? pkg.requirements
                    : pkg.requirements?.split(',') || []
                  ).map((req: string, rIdx: number) => (
                    <div key={rIdx} className="flex items-start gap-2 text-[10px] text-slate-500 font-bold">
                      <div className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                      <span>{req.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tighter">Are you sure?</h3>
              <p className="text-slate-400 text-xs font-bold mt-2">This event will be permanently removed from your portfolio.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={loading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}