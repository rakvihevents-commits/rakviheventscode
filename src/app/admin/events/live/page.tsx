"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import {
  Plus, X, Upload, Trash2, Edit2, Eye,
  Calendar, CheckCircle2, IndianRupee, Users2, MapPin, Clock
} from 'lucide-react';

export default function ManageLiveEvents() {
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Packages now carry their own people_count (how many the
  // VIP/table package admits), separate from general admission counting.
  type PackageForm = { name: string; price: string; requirements: string; peopleCount: string };
  const [packages, setPackages] = useState<PackageForm[]>([]);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Club Night");
  const [coverCharge, setCoverCharge] = useState("");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState("");
  const [capacity, setCapacity] = useState("150");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Minimum group size for GENERAL ADMISSION bookings only.
  // This does not apply to VIP packages, which use their own peopleCount.
  const [minGroupSize, setMinGroupSize] = useState("1");

  // Media files configuration
  const [imageFiles, setImageFiles] = useState<{ file: File, id: string }[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const fetchData = async () => {
    const { data: liveData } = await supabase.from('live_events').select('*').order('start_date', { ascending: true });
    const { data: catData } = await supabase.from('categories').select('name');
    if (liveData) setLiveEvents(liveData);
    if (catData) setCategories(catData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleEditClick = async (event: any) => {
    setEditId(event.id);
    setTitle(event.title);
    setCategory(event.category || "Club Night");
    setCoverCharge(event.cover_charge?.toString() || "");
    setStatus(event.status || "Active");
    setDescription(event.description || "");
    setPerks(event.perks?.join(", ") || "");
    setCapacity(event.capacity?.toString() || "150");
    setLocation(event.location || "");
    setMinGroupSize(event.min_group_size?.toString() || "1");

    if (event.start_date) {
      setStartDate(new Date(event.start_date).toISOString().slice(0, 16));
    }
    if (event.end_date) {
      setEndDate(new Date(event.end_date).toISOString().slice(0, 16));
    }

    setExistingImages(Array.isArray(event.image_urls) ? event.image_urls : []);

    const { data: pkgData } = await supabase
      .from('live_event_packages')
      .select('*')
      .eq('live_event_id', event.id);

    if (pkgData) {
      setPackages(pkgData.map(p => ({
        name: p.package_name || "",
        price: p.price?.toString() || "",
        requirements: Array.isArray(p.requirements) ? p.requirements.join(", ") : "",
        peopleCount: p.people_count?.toString() || "1",
      })));
    } else {
      setPackages([]);
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

      // Upload newly added files to Storage
      for (const item of imageFiles) {
        const fileName = `${Date.now()}-${item.file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('live-event-images')
          .upload(fileName, item.file);

        if (uploadErr) {
          console.error("Image upload failed:", item.file.name, uploadErr);
          continue;
        }

        const { data: pUrl } = supabase.storage.from('live-event-images').getPublicUrl(fileName);
        final_image_urls.push(pUrl.publicUrl);
      }

      const eventPayload = {
        title,
        category,
        cover_charge: parseFloat(coverCharge) || 0,
        description,
        status,
        perks: perks.split(",").map(s => s.trim()).filter(Boolean),
        image_urls: final_image_urls,
        capacity: parseInt(capacity) || 150,
        location,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        min_group_size: parseInt(minGroupSize) || 1,
      };

      let liveEventId = editId;

      if (editId) {
        const { error: updateErr } = await supabase
          .from('live_events')
          .update(eventPayload)
          .eq('id', editId);
        if (updateErr) throw updateErr;
      } else {
        const { data: insertedData, error: insertErr } = await supabase
          .from('live_events')
          .insert([eventPayload])
          .select()
          .single();

        if (insertErr) throw insertErr;
        liveEventId = insertedData.id;
      }

      if (liveEventId) {
        // Clear old packages first
        await supabase.from('live_event_packages').delete().eq('live_event_id', liveEventId);

        // Safely declare and structure payloads
        const packagePayload = packages
          .filter(pkg => pkg.name.trim() !== "")
          .map(pkg => ({
            live_event_id: liveEventId,
            package_name: pkg.name,
            price: parseFloat(pkg.price) || 0,
            requirements: pkg.requirements.split(",").map(r => r.trim()).filter(Boolean),
            people_count: parseInt(pkg.peopleCount) || 1,
          }));

        if (packagePayload.length > 0) {
          const { error: pkgErr } = await supabase.from('live_event_packages').insert(packagePayload);
          if (pkgErr) throw pkgErr;
        }
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      alert("Error saving live event data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setViewEvent(null);
    setEditId(null);
    setTitle("");
    setPackages([]);
    setCategory("Club Night");
    setCoverCharge("");
    setStatus("Active");
    setDescription("");
    setPerks("");
    setCapacity("150");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setMinGroupSize("1");
    setImageFiles([]);
    setExistingImages([]);
  };

  const handleDeleteEvent = async () => {
    if (!deleteId) return;
    setLoading(true);
    const { error } = await supabase.from('live_events').delete().eq('id', deleteId);
    if (!error) {
      setDeleteId(null);
      fetchData();
    } else {
      alert("Deletion error: " + error.message);
    }
    setLoading(false);
  };

  const handleViewClick = async (event: any) => {
    setLoading(true);
    try {
      const { data: pkgData, error } = await supabase
        .from('live_event_packages')
        .select('*')
        .eq('live_event_id', event.id);

      if (error) throw error;

      setViewEvent({
        ...event,
        packages: pkgData || []
      });
    } catch (err: any) {
      setViewEvent({ ...event, packages: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-black bg-slate-50 min-h-screen p-8">
      {/* PANEL CONTROL HEADER */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Calendar size={16} />
            <span className="text-xs font-black uppercase tracking-widest text-red-600">Active Stage Management</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Live Venue Events</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg">
          <Plus size={20} /> Deploy Live Event
        </button>
      </div>

      {/* CORE DATA DISPLAY TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Media Covers</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Gigs, Location & Timings</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Allowed Capacity</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Min Group Size</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cover Charges</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stage Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {liveEvents.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center -space-x-3">
                    {event.image_urls && event.image_urls.length > 0 ? (
                      event.image_urls.slice(0, 3).map((url: string, index: number) => (
                        <div key={index} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-sm shrink-0">
                          <img src={url} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      ))
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">NO COVS</div>
                    )}
                  </div>
                </td>

                <td className="px-8 py-5">
                  <p className="font-bold text-base leading-tight">{event.title}</p>
                  <div className="flex flex-col gap-1 mt-1 text-slate-400">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      <MapPin size={10} /> {event.location}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-medium text-slate-400">
                      <Clock size={10} /> {new Date(event.start_date).toLocaleString()}
                    </span>
                  </div>
                </td>

                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                      <Users2 size={14} />
                    </div>
                    <div>
                      <p className="font-black text-base">{event.capacity}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Max Guests</p>
                    </div>
                  </div>
                </td>

                {/* Min Group Size column */}
                <td className="px-8 py-5">
                  <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase">
                    {event.min_group_size ?? 1}+ per booking
                  </span>
                </td>

                <td className="px-8 py-5 font-black text-base text-zinc-900">₹{event.cover_charge}</td>

                <td className="px-8 py-5 text-xs">
                  <span className={`px-3 py-1 rounded-lg font-black uppercase text-[10px] border ${event.status === 'Active' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    {event.status}
                  </span>
                </td>

                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleViewClick(event)} className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600"><Eye size={16} /></button>
                    <button onClick={() => handleEditClick(event)} className="p-3 bg-white hover:bg-black hover:text-white rounded-xl border border-slate-200 text-slate-400"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(event.id)} className="p-3 hover:bg-rose-50 text-slate-400 hover:text-red-600 rounded-xl"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HORIZONTAL MULTI-COLUMN INTERFACE FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col md:flex-row h-[680px]">

              {/* LEFT SIDE: Active Media Panel */}
              <div className="md:w-1/4 bg-slate-50 p-6 border-r border-slate-100 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-black text-black uppercase tracking-tight mb-4">
                    {editId ? 'Modify Live Config' : 'Create Gig'}
                  </h2>

                  <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Images Cover Tray</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
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
                          <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover" alt="new" />
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
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Room Status</label>
                  <div className="flex gap-1">
                    {['Active', 'Sold Out', 'Cancelled'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${status === s ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Complete Event Information Form */}
              <div className="md:w-3/4 p-6 relative flex flex-col justify-between">
                <button onClick={closeModal} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>

                <form onSubmit={handleSaveEvent} className="flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide h-[520px]">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Live Show Title / Gig Name</label>
                        <input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                          placeholder="e.g. Neon Saturdays Night Out"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Base Entry Cover (₹)</label>
                        <input
                          type="number"
                          value={coverCharge}
                          onChange={e => setCoverCharge(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                          placeholder="₹1500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Perform Floor / Club Location</label>
                        <input
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                          placeholder="e.g. VIP Club Stage A"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Allowed Capacity</label>
                        <input
                          type="number"
                          value={capacity}
                          onChange={e => setCapacity(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                        >
                          <option value="Club Night">Club Night</option>
                          <option value="DJ Gig">DJ Gig</option>
                          <option value="Live Lounge">Live Lounge</option>
                          <option value="Karaoke Special">Karaoke Special</option>
                        </select>
                      </div>
                    </div>

                    {/* Min Group Size (general admission only) */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                          Min Group Size (General Entry)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={minGroupSize}
                          onChange={e => setMinGroupSize(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                          placeholder="e.g. 4"
                        />
                        <p className="text-[8px] text-slate-400 font-medium leading-tight pt-1">
                          Minimum people required per general-entry booking. Does not apply to VIP/table packages below — those set their own headcount.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Gate Opens (Start Time)</label>
                        <input
                          type="datetime-local"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          required
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Gate Closes (End Time)</label>
                        <input
                          type="datetime-local"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Included Perks / Access Benefits (CSV)</label>
                      <input
                        value={perks}
                        onChange={e => setPerks(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-black outline-none"
                        placeholder="Free Drink Inclusions, VIP Floor Pass, Access to Pools..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Show Details & Entry Policies</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium text-black outline-none resize-none"
                        placeholder="Detail dress-codes, minimum age limit, staging guidelines, entry policies..."
                      />
                    </div>

                    {/* VIP Tables Packages Subform — now with per-package headcount */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-500">
                          <IndianRupee size={10} /> Exclusive VIP Tables / Bottle Packages
                        </h3>
                        <button
                          type="button"
                          onClick={() => setPackages([...packages, { name: "", price: "", requirements: "", peopleCount: "1" }])}
                          className="text-[9px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          + Add VIP Table Package
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {packages.map((pkg, index) => (
                          <div key={index} className="min-w-[240px] p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => setPackages(packages.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                            <input
                              placeholder="Name (e.g. VIP Table for 5)"
                              className="w-full p-2 bg-white rounded-lg text-[10px] font-bold text-black outline-none border border-slate-100"
                              value={pkg.name}
                              onChange={(e) => {
                                const newPkgs = [...packages];
                                newPkgs[index] = { ...newPkgs[index], name: e.target.value };
                                setPackages(newPkgs);
                              }}
                            />
                            <div className="flex gap-2">
                              <input
                                placeholder="Price (₹)"
                                type="number"
                                className="w-1/2 p-2 bg-white rounded-lg text-[10px] font-bold text-black outline-none border border-slate-100"
                                value={pkg.price}
                                onChange={(e) => {
                                  const newPkgs = [...packages];
                                  newPkgs[index] = { ...newPkgs[index], price: e.target.value };
                                  setPackages(newPkgs);
                                }}
                              />
                              {/* This package's own headcount, independent
                                  of general admission's min_group_size */}
                              <input
                                placeholder="People Count"
                                type="number"
                                min={1}
                                className="w-1/2 p-2 bg-white rounded-lg text-[10px] font-bold text-black outline-none border border-slate-100"
                                value={pkg.peopleCount}
                                onChange={(e) => {
                                  const newPkgs = [...packages];
                                  newPkgs[index] = { ...newPkgs[index], peopleCount: e.target.value };
                                  setPackages(newPkgs);
                                }}
                              />
                            </div>
                            <p className="text-[7px] text-slate-400 font-medium leading-tight">
                              People Count = how many guests this specific package admits (e.g. a table for 5 admits 5, regardless of the event's general min group size).
                            </p>
                            <textarea
                              placeholder="Inclusions (e.g. 1 Vodka, Mixers Included) CSV"
                              className="w-full p-2 bg-white rounded-lg text-[9px] text-black outline-none border border-slate-100 resize-none"
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
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {loading ? "Deploying Active Stage config..." : "Save Live Event Deployment"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="relative h-64 shrink-0">
              <img
                src={viewEvent.image_urls && viewEvent.image_urls[0] ? viewEvent.image_urls[0] : '/placeholder.png'}
                className="w-full h-full object-cover"
                alt="Event cover"
              />
              <button onClick={() => setViewEvent(null)} className="absolute top-6 right-6 bg-white p-2 rounded-full shadow-lg"><X size={20} /></button>
              <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent w-full">
                <span className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">{viewEvent.category}</span>
                <h2 className="text-3xl font-black text-white uppercase">{viewEvent.title}</h2>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto text-black">
              <div className="grid grid-cols-4 gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Pass</p>
                  <p className="text-lg font-black mt-1">₹{viewEvent.cover_charge}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room Capacity</p>
                  <p className="text-sm font-bold mt-1 flex items-center gap-1"><Users2 size={14} className="text-blue-500" />{viewEvent.capacity} Guests</p>
                </div>
                {/* Min group size shown in view modal */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Group (General)</p>
                  <p className="text-sm font-bold mt-1 flex items-center gap-1"><Users2 size={14} className="text-emerald-500" />{viewEvent.min_group_size ?? 1}+ people</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="text-sm font-bold mt-1 flex items-center gap-1 truncate"><MapPin size={14} className="text-red-500" />{viewEvent.location}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-500" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Timing Setup</p>
                    <p className="text-xs font-bold text-black mt-0.5">
                      {new Date(viewEvent.start_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{viewEvent.status}</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{viewEvent.description || "No specific guidelines specified."}</p>
              </div>

              {viewEvent.perks && viewEvent.perks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pass Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewEvent.perks.map((perk: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-50 border rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewEvent.packages && viewEvent.packages.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">VIP Table Structures</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {viewEvent.packages.map((pkg: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold uppercase">{pkg.package_name}</p>
                          <p className="text-xs font-black text-red-600">₹{pkg.price}</p>
                        </div>
                        {/* Package-specific headcount shown here */}
                        <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                          <Users2 size={11} className="text-blue-500" /> Admits {pkg.people_count ?? 1} {pkg.people_count === 1 ? 'person' : 'people'}
                        </p>
                        {pkg.requirements && pkg.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pkg.requirements.map((req: string, rIdx: number) => (
                              <span key={rIdx} className="bg-white px-2 py-1 border rounded-lg text-[8px] font-bold text-slate-500 uppercase">
                                {req}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}