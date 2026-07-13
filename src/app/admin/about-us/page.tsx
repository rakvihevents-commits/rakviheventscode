"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import { 
  Save, Plus, Trash2, Users, Target, BookOpen, 
  BarChart, CheckCircle2, User as UserIcon, X, Edit2, ArrowUpNarrowWide
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function AboutUsAdmin() {
  const [activeTab, setActiveTab] = useState('story');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [story, setStory] = useState({ content: '' });
  const [mission, setMission] = useState({ content: '' });
  const [team, setTeam] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([
    { label: 'Events Completed', value: '0', icon_name: 'Calendar' },
    { label: 'Years Experience', value: '0', icon_name: 'Star' },
    { label: 'Client Satisfaction', value: '0%', icon_name: 'Smile' },
    { label: 'Team Members', value: '0', icon_name: 'Users' }
  ]);

  const [currentMember, setCurrentMember] = useState<any>({ 
    id: null, 
    name: '', 
    role: '', 
    bio: '', 
    priority: '' 
  });

  useEffect(() => { fetchAllData(); }, []);

const fetchAllData = async () => {
  setLoading(true);
  try {
    const { data: sections } = await supabase.from('about_sections').select('*');
    const { data: teamData } = await supabase.from('team_members').select('*').order('priority', { ascending: true });
    const { data: statsData } = await supabase.from('about_stats').select('*');

    sections?.forEach(s => {
      if (s.section_type === 'story') setStory(s);
      if (s.section_type === 'mission') setMission(s);
    });

    if (teamData) setTeam(teamData);

    // FIX: Merge database results with your 4 required placeholders
    if (statsData) {
      setStats(currentStats => 
        currentStats.map(placeholder => {
          const dbMatch = statsData.find(dbRow => dbRow.label === placeholder.label);
          // If found in DB, use the DB row (includes its ID), otherwise keep placeholder
          return dbMatch ? dbMatch : placeholder;
        })
      );
    }
  } catch (err) {
    console.error("Fetch error:", err);
  } finally {
    setLoading(false);
  }
};

const handleUpdateStat = async (idx: number) => {
  const stat = stats[idx];
  
  // We remove 'id' if it's null to let Supabase handle the serial ID
  const payload = { ...stat };
  if (!payload.id) delete payload.id;

  const { error } = await supabase
    .from('about_stats')
    .upsert(payload, { onConflict: 'label' });

  if (error) {
    console.error(error);
    toast.error("Failed to update stat");
  } else {
    toast.success(`${stat.label} updated!`);
    fetchAllData(); // Refresh to get the new IDs assigned by the DB
  }
};

  const openMemberModal = (member: any = null) => {
    if (member) {
      setCurrentMember({
        id: member.id,
        name: member.name || '',
        role: member.role || '',
        bio: member.bio || '',
        priority: member.priority?.toString() || ''
      });
    } else {
      setCurrentMember({ id: null, name: '', role: '', bio: '', priority: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveMember = async () => {
    // Validation
    if (!currentMember.name || !currentMember.role || !currentMember.priority) {
      return toast.error("Name, Role, and Rank are required");
    }

    setLoading(true);

    // Prepare payload: Remove ID if it's null so Supabase generates it
    const payload: any = {
      name: currentMember.name,
      role: currentMember.role,
      bio: currentMember.bio,
      priority: parseInt(currentMember.priority, 10)
    };

    if (currentMember.id) {
      payload.id = currentMember.id;
    }

    const { error } = await supabase.from('team_members').upsert(payload);
    
    if (error) {
      console.error("Supabase Error Details:", error);
      if (error.code === '23505') {
        toast.error(`Rank #${currentMember.priority} is already taken!`);
      } else {
        toast.error(error.message || "Error saving member");
      }
    } else {
      toast.success(currentMember.id ? "Member updated!" : "New member added!");
      setIsModalOpen(false);
      fetchAllData();
    }
    setLoading(false);
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (!error) {
      toast.info("Member removed");
      fetchAllData();
    }
  };

  async function handleSaveSection(type: string, content: string) {
    const { error } = await supabase.from('about_sections').upsert({ section_type: type, content }, { onConflict: 'section_type' });
    if (error) toast.error(`Failed to save ${type}`);
    else toast.success(`${type.toUpperCase()} saved!`);
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 p-4">
      <Toaster richColors position="top-center" />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-black uppercase">Company Profile</h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage your story and core team hierarchy.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
          {['story', 'mission', 'team', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-black'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm min-h-[500px]">
        {(activeTab === 'story' || activeTab === 'mission') && (
          <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <h3 className="text-2xl font-black uppercase tracking-tight">Our {activeTab}</h3>
            <textarea
              className="w-full h-80 p-8 border-2 border-slate-50 rounded-[2rem] bg-slate-50/50 focus:bg-white focus:border-black outline-none transition-all text-lg leading-relaxed shadow-inner"
              value={(activeTab === 'story' ? story.content : mission.content) || ''}
              onChange={(e) => activeTab === 'story' ? setStory({content: e.target.value}) : setMission({content: e.target.value})}
            />
            <button 
              onClick={() => {
                const content = activeTab === 'story' ? story.content : mission.content;
                handleSaveSection(activeTab, content);
              }}
              className="bg-black text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all shadow-xl"
            >
              SAVE CHANGES
            </button>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tight">The Core Team</h3>
              <button onClick={() => openMemberModal()} className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                <Plus size={18} /> ADD NEW MEMBER
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((m) => (
                <div key={m.id} className="group relative bg-slate-50 border border-slate-100 p-8 rounded-[2rem] hover:bg-white hover:shadow-2xl transition-all border-b-4 border-b-transparent hover:border-b-black">
                  <div className="absolute top-6 right-6 bg-white border border-slate-200 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                    RANK #{m.priority}
                  </div>
                  <div className="flex justify-between mb-4">
                    <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white">
                      <UserIcon size={28} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openMemberModal(m)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-blue-600 transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteMember(m.id)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h4 className="font-black text-xl mb-1">{m.name}</h4>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">{m.role}</p>
                  <p className="text-sm text-slate-500 line-clamp-3">"{m.bio}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-10 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 flex flex-col gap-6 group hover:border-black transition-colors">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{stat.label}</label>
                  <input 
                    className="w-full mt-4 p-0 bg-transparent font-black text-5xl focus:outline-none placeholder:text-slate-200" 
                    value={stat.value || ''} 
                    onChange={e => {
                      const newStats = [...stats]; newStats[idx].value = e.target.value; setStats(newStats);
                    }}
                  />
                </div>
                <button 
                  onClick={() => handleUpdateStat(idx)}
                  className="bg-zinc-200 text-black py-4 rounded-2xl font-black text-xs hover:bg-black hover:text-white transition-all uppercase tracking-widest"
                >
                  DEPLOY {stat.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-black transition-colors"><X size={24}/></button>
            
            <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-2">
              <ArrowUpNarrowWide size={24}/> Member Rank
            </h2>
            
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-1/3 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Rank #</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center focus:bg-white focus:border-black outline-none transition-all" 
                    value={currentMember.priority || ''} 
                    onChange={e => setCurrentMember({...currentMember, priority: e.target.value})} 
                    placeholder="1"
                  />
                </div>
                <div className="w-2/3 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Full Name</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-black outline-none transition-all" 
                    value={currentMember.name || ''} 
                    onChange={e => setCurrentMember({...currentMember, name: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Job Title</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-black outline-none transition-all" 
                  value={currentMember.role || ''} 
                  onChange={e => setCurrentMember({...currentMember, role: e.target.value})} 
                  placeholder="e.g. Founder & CEO"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Short Bio</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm h-28 focus:bg-white focus:border-black outline-none transition-all resize-none" 
                  value={currentMember.bio || ''} 
                  onChange={e => setCurrentMember({...currentMember, bio: e.target.value})} 
                  placeholder="Tell us what they do..."
                />
              </div>

              <button 
                disabled={loading}
                onClick={handleSaveMember} 
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm hover:bg-zinc-800 disabled:bg-slate-400 transition-all shadow-lg shadow-black/20 uppercase tracking-widest mt-4"
              >
                {loading ? "Saving..." : "Confirm Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}