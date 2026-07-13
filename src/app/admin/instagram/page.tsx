"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { 
  Camera, Plus, Trash2, ExternalLink, 
  AlertCircle, CheckCircle2, Link as LinkIcon, X 
} from 'lucide-react';

export default function InstagramManage() {
  const [links, setLinks] = useState<any[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing links
  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('instagram_feeds')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLinks(data);
  };

  useEffect(() => { fetchLinks(); }, []);

  const validateInstagramUrl = (url: string) => {
    // Regex to match posts, reels, or tv links and capture the main URL
    const regex = /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([^/?#&]+))/;
    const match = url.match(regex);
    return match ? match[1] : null; // Returns clean URL or null
  };

const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const cleanUrl = validateInstagramUrl(newUrl);

    if (!cleanUrl) {
      setError("Please enter a valid Instagram Post or Reel URL.");
      return;
    }

    setLoading(true);
    
    // Check if it already exists in your local state first to be sure
    const existsLocally = links.some(link => link.url === cleanUrl);
    if (existsLocally) {
      setError("This link is already in your list below.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('instagram_feeds')
      .insert([{ url: cleanUrl }]);

    if (insertError) {
      console.error("Supabase Error:", insertError);
      // This will tell us if it's a '42501' (Permission Denied) or '23505' (Unique Violation)
      setError(insertError.message || "Failed to add link.");
    } else {
      setNewUrl("");
      fetchLinks();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('instagram_feeds').delete().eq('id', id);
    if (!error) fetchLinks();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER & INPUT SECTION */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
            <Camera size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight uppercase">Instagram Feed</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your social gallery</p>
          </div>
        </div>

        <form onSubmit={handleAddLink} className="relative max-w-3xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <LinkIcon size={18} />
              </div>
              <input 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste Instagram Reel or Post link here..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-none focus:ring-2 ring-black font-bold text-sm text-black transition-all outline-none"
              />
            </div>
            <button 
              disabled={loading}
              className="bg-black text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add to Feed"}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live URL</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Added Date</th>
              <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {links.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                      <Camera size={16} />
                    </div>
                    <span className="font-bold text-sm text-black truncate max-w-md">{item.url}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-xs font-bold text-slate-400">
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:shadow-md transition-all"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-600 hover:shadow-md transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {links.length === 0 && (
              <tr>
                <td colSpan={3} className="px-10 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <Camera size={48} />
                    <p className="font-black uppercase tracking-widest text-xs">No feed links found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}