"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase";
import {
  LayoutDashboard, Calendar, Layers, BookOpen, Users,
  Image as ImageIcon, MessageSquare, BarChart3, Settings,
  LogOut, Menu, X, User, Camera, AppWindow, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Radio, CalendarDays } from 'lucide-react';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [siteData, setSiteData] = useState({ name: '', logo: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('site_name, logo_url')
        .eq('id', 1)
        .single();

      if (data) {
        setSiteData({
          name: data.site_name || 'Admin',
          logo: data.logo_url || ''
        });
      }
      setLoading(false);
    };
    fetchBranding();
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin/dashboard' },
    { name: 'Categories', icon: <Layers size={18} />, path: '/admin/categories' },
    { name: 'Events', icon: <Calendar size={18} />, path: '/admin/events' },
{ name: 'Nightlife Events', icon: <Radio size={18} className="text-emerald-500 animate-pulse" />, path: '/admin/events/live' },
{ name: 'Nightlife Events Booking', icon: <CalendarDays size={18} />, path: '/admin/livebooking' },
  { name: 'Event Bookings', icon: <BookOpen size={18} />, path: '/admin/bookings' },
    { name: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { name: 'About Us', icon: <Info size={18} />, path: '/admin/about-us' },
    { name: 'Home Banner', icon: <AppWindow size={18} />, path: '/admin/home-banner' },
    { name: 'Instagram', icon: <Camera size={18} />, path: '/admin/instagram' },
    { name: 'Gallery', icon: <ImageIcon size={18} />, path: '/admin/gallery' },
    { name: 'Reviews', icon: <MessageSquare size={18} />, path: '/admin/reviews' },
    // { name: 'Reports', icon: <BarChart3 size={18} />, path: '/admin/reports' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/adminlogin");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white text-black transition-all duration-300 ease-in-out flex flex-col fixed h-full z-50 border-r border-slate-200 shadow-sm`}>

        {/* Dynamic Logo Section */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 min-h-[80px]">
          {isSidebarOpen ? (
            <div className="flex items-center w-full pr-6 animate-in fade-in duration-500">
              {siteData.logo ? (
                <div className="h-10 w-auto flex items-center justify-start overflow-hidden">
                  <img 
                    src={siteData.logo} 
                    alt="Rakvih Solutions Private Limited Logo" 
                    className="h-full w-auto object-contain" 
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-sm font-black text-black tracking-tight truncate w-32">
                    {loading ? '...' : siteData.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admin</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center w-full">
              {siteData.logo ? (
                /* Focused crop of the logo's main icon mark when sidebar is collapsed */
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5">
                  <img 
                    src={siteData.logo} 
                    alt="Logo Icon" 
                    className="h-full max-w-none object-cover scale-150 -translate-x-[2px]" 
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {siteData.name ? siteData.name[0] : 'R'}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`absolute ${isSidebarOpen ? 'right-2' : 'right-[-12px] top-8'} p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-black transition-colors z-50 shadow-sm`}
          >
            {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Navigation Links - SCROLLABLE & COMPACT */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 px-3 space-y-0.5 custom-scrollbar">
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex items-center p-2.5 rounded-xl hover:bg-black hover:text-white cursor-pointer transition-all duration-200 group relative"
            >
              <div className="text-slate-400 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              {isSidebarOpen && (
                <span className="ml-3 font-bold text-xs tracking-tight">{item.name}</span>
              )}

              {!isSidebarOpen && (
                <div className="absolute left-16 bg-black text-white px-3 py-1.5 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2.5 rounded-xl hover:bg-red-600 hover:text-white text-slate-500 transition-all duration-200 group"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="ml-3 font-bold text-xs tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-3">
             <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
             <h2 className="text-[11px] font-black text-black uppercase tracking-[0.2em]">
               {siteData.name} <span className="text-slate-300 font-light mx-1">/</span> <span className="text-slate-400">Command Center</span>
             </h2>
           </div>
           
           <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                <LogOut size={18} />
             </button>
             <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                <User size={16} />
             </div>
           </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}