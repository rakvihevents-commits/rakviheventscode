"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { 
  Plus, X, Upload, Trash2, Edit2, Eye, 
  MoreVertical, AlertCircle, Layers, Calendar 
} from 'lucide-react';

export default function ManageCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const fetchData = async () => {
    const { data: catData } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    const { data: eventData } = await supabase.from('events').select('category');

    if (catData) {
      const formatted = catData.map(cat => ({
        ...cat,
        eventCount: eventData?.filter(e => e.category === cat.name).length || 0
      }));
      setCategories(formatted);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Open modal for Editing
  const handleEditClick = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setExistingImageUrl(cat.image_url || "");
    setIsModalOpen(true);
  };

  // Close modal and reset
  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setName("");
    setDescription("");
    setImageFile(null);
    setExistingImageUrl("");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let image_url = existingImageUrl;

    // Handle Image Upload
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data: uploadData } = await supabase.storage.from('category-images').upload(fileName, imageFile);
      if (uploadData) {
        const { data: pUrl } = supabase.storage.from('category-images').getPublicUrl(fileName);
        image_url = pUrl.publicUrl;
      }
    }

    if (editId) {
      // UPDATE EXISTING
      const { error } = await supabase.from('categories')
        .update({ name, description, image_url })
        .eq('id', editId);
      if (error) alert(error.message);
    } else {
      // CREATE NEW
      const { error } = await supabase.from('categories')
        .insert([{ name, description, image_url }]);
      if (error) alert(error.message);
    }

    setLoading(false);
    closeModal();
    fetchData();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('categories').delete().eq('id', deleteId);
      if (error) {
        alert("Error deleting: " + error.message);
      } else {
        setDeleteId(null);
        fetchData();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Layers size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Inventory Management</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight">CATEGORIES</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
        >
          <Plus size={20} /> Add New Category
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Preview</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Events</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={cat.image_url || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="font-bold text-black text-lg">{cat.name}</p>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{cat.description}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-black text-black">
                      {cat.eventCount}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Listed Events</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(cat)} className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-black transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(cat.id)} className="p-3 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COMPACT CREATE / EDIT MODAL */}
{isModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-100">
      <div className="p-6 space-y-6">
        
        {/* SMALLER HEADER */}
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase ">
              {editId ? 'Edit Category' : 'New Category'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {editId ? 'Modify existing record' : 'Add to inventory'}
            </p>
          </div>
          <button 
            onClick={closeModal} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveCategory} className="space-y-4">
          {/* COMPACT TITLE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Category Title
            </label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:border-black focus:bg-white text-black font-bold text-sm outline-none transition-all" 
              placeholder="e.g. Wedding" 
            />
          </div>

          {/* COMPACT DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Description
            </label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={2} 
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:border-black focus:bg-white text-black font-medium text-sm outline-none transition-all resize-none" 
              placeholder="Short details..." 
            />
          </div>
          
          {/* MINI IMAGE UPLOAD */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Banner Image</label>
            <div className="relative border border-dashed border-slate-200 rounded-xl p-3 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} 
              />
              
              {/* MINI PREVIEW */}
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" alt="preview" />
                ) : existingImageUrl ? (
                  <img src={existingImageUrl} className="w-full h-full object-cover" alt="existing" />
                ) : (
                  <Upload size={16} className="text-slate-300" />
                )}
              </div>

              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-black truncate w-40">
                  {imageFile ? imageFile.name : (editId ? "Update Image" : "Select File")}
                </p>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Click to browse</p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button 
            disabled={loading} 
            className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Processing..." : (editId ? "Update Category" : "Save Category")}
          </button>
        </form>
      </div>
    </div>
  </div>
)}

      {/* DELETE CONFIRMATION POPUP */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] max-w-sm w-full text-center space-y-6 shadow-2xl border border-slate-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-black tracking-tight uppercase">Are you sure?</h3>
              <p className="text-slate-500 text-sm mt-2">This action cannot be undone. All events in this category will become unorganized.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-black transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all uppercase text-xs tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}