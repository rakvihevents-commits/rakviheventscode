"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase"; 
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dynamic Branding State
  const [branding, setBranding] = useState({ name: "RAKVIH", logo: "" });
  const router = useRouter();

  // Fetch Site Branding on Load
  useEffect(() => {
    async function getBranding() {
      const { data } = await supabase
        .from('site_settings')
        .select('site_name, logo_url')
        .eq('id', 1)
        .single();
      if (data) {
        setBranding({ 
          name: data.site_name || "RAKVIH", 
          logo: data.logo_url || "" 
        });
      }
    }
    getBranding();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("admins")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (dbError || !data) {
        setError("Access Denied: Invalid Admin Credentials");
      } else {
        localStorage.setItem("admin_token", "rakvih_authenticated");
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* DYNAMIC LOGO & TITLE */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            {branding.logo ? (
              <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 p-2 border border-slate-100 shadow-sm">
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                <ShieldCheck size={32} />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-black text-black tracking-tighter uppercase">
            {branding.name}
          </h1>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-[0.4em]">
            Secure Admin Gateway
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-6 py-4 text-black font-bold rounded-2xl bg-slate-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all placeholder:text-slate-300"
              placeholder="Enter Admin ID"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-6 py-4 text-black font-bold rounded-2xl bg-slate-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-zinc-800 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4 tracking-[0.2em] text-xs uppercase"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Authorize Access"}
          </button>
        </form>
      </div>
    </div>
  );
}