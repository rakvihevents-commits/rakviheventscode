"use client";

// Save this as: app/site/scan/page.tsx (or wherever your staff area lives)

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/utils/supabase";
import { CheckCircle2, XCircle, Users2 } from "lucide-react";

type Result = {
  success: boolean;
  message: string;
  booking_id: string | null;
  event_title: string | null;
  number_of_people: number | null;
  already_checked_in_at: string | null;
};

export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const lastCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const el = "reader";
    const scanner = new Html5Qrcode(el);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScan(decodedText),
        () => {} // ignore per-frame decode misses
      )
      .catch((err) => console.error("Camera start failed:", err));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  const handleScan = async (ticketCode: string) => {
    // Debounce repeated frames of the same code while camera stays pointed at it
    if (busy || lastCodeRef.current === ticketCode) return;
    lastCodeRef.current = ticketCode;
    setBusy(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase.rpc("check_in_ticket", {
      p_ticket_code: ticketCode,
      p_scanned_by: session?.user?.id ?? null,
    });

    if (error) {
      setResult({
        success: false,
        message: "Scan failed — try again",
        booking_id: null,
        event_title: null,
        number_of_people: null,
        already_checked_in_at: null,
      });
    } else {
      setResult(data?.[0] ?? null);
    }

    setBusy(false);
    // allow re-scanning the same code again after a short cooldown
    setTimeout(() => (lastCodeRef.current = null), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-black uppercase tracking-widest">Entry Scanner</h1>

      <div id="reader" className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/10" />

      {result && (
        <div
          className={`w-full max-w-sm p-6 rounded-3xl border flex items-center gap-4 ${
            result.success
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={28} />
          ) : (
            <XCircle className="text-red-400 shrink-0" size={28} />
          )}
          <div>
            <p className="font-black uppercase text-sm">{result.message}</p>
            {result.event_title && (
              <p className="text-xs text-white/60">{result.event_title}</p>
            )}
            {result.number_of_people && (
              <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                <Users2 size={12} /> {result.number_of_people} people
              </p>
            )}
            {result.already_checked_in_at && (
              <p className="text-[10px] text-white/40 mt-1">
                Checked in at {new Date(result.already_checked_in_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}