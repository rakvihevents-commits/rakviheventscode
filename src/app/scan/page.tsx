"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { supabase } from "@/utils/supabase";
import {
  CheckCircle2,
  XCircle,
  Users2,
  Lock,
  ShieldCheck,
  User,
  Mail,
  LogOut,
} from "lucide-react";

type AdditionalGuest = {
  name: string;
  email?: string;
  entered?: boolean;
};

interface GuestEntry {
  name: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
  entered: boolean;
  index: number;
}

type TicketInfo = {
  found: boolean;
  booking_id: string | null;
  event_title: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  number_of_people: number | null;
  payment_status: string | null;
  entered_count: number | null;
  is_checked_in: boolean | null;
  checked_in_at: string | null;
  additional_guests: string | AdditionalGuest[] | null;
};

type CheckInResult = {
  success: boolean;
  message: string;
  booking_id: string | null;
  event_title: string | null;
  number_of_people: number | null;
  entered_count: number | null;
  already_checked_in_at: string | null;
};

const SESSION_KEY = "scanner_authed";

export default function ScannerPage() {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  const handleUnlock = async () => {
    setAuthBusy(true);
    setAuthError(null);
    const { data, error } = await supabase.rpc("verify_scanner_password", {
      p_password: passwordInput,
    });
    setAuthBusy(false);

    if (error || data !== true) {
      setAuthError("Incorrect password");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setAuthed(true);
  };

  // ✅ NEW — logout clears the session flag and drops back to the password screen
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPasswordInput("");
    setAuthError(null);
    setAuthed(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-5">
          {/* ✅ NEW — logo */}
          <img
            src="/logo.jpeg"
            alt="Rakvih Events"
            className="w-20 h-20 object-contain mb-1"
          />

          <Lock size={28} className="text-brand-yellow" />
          <h1 className="text-lg font-black uppercase tracking-widest text-center">
            Staff Access Only
          </h1>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter security password"
            className="w-full px-4 py-3 rounded-2xl bg-zinc-800 border border-white/10 text-sm outline-none focus:border-brand-yellow"
          />
          {authError && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">
              {authError}
            </p>
          )}
          <button
            onClick={handleUnlock}
            disabled={authBusy || !passwordInput}
            className="w-full py-3 rounded-2xl bg-brand-yellow text-brand-green font-black uppercase text-xs tracking-widest disabled:opacity-50"
          >
            {authBusy ? "Checking..." : "Unlock Scanner"}
          </button>
        </div>
      </div>
    );
  }

  return <Scanner onLogout={handleLogout} />;
}

function Scanner({ onLogout }: { onLogout: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);
  const [paused, setPaused] = useState(false);

  const [pendingTicket, setPendingTicket] = useState<{ code: string; info: TicketInfo } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lookupBusy, setLookupBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [result, setResult] = useState<CheckInResult | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;
    let mounted = true;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScan(decodedText),
        () => {}
      )
      .then(() => {
        if (mounted) isRunningRef.current = true;
      })
      .catch((err) => console.error("Camera start failed:", err));

    return () => {
      mounted = false;
      safeStop();
    };
  }, []);

  const safeStop = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (
        state === Html5QrcodeScannerState.SCANNING ||
        state === Html5QrcodeScannerState.PAUSED
      ) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn("Scanner stop skipped:", err);
    }
    isRunningRef.current = false;
  };

  const pauseCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !isRunningRef.current) return;
    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        scanner.pause(true);
        setPaused(true);
      }
    } catch (err) {
      console.warn("Scanner pause skipped:", err);
    }
  };

  const resumeCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !isRunningRef.current) {
      setPaused(false);
      return;
    }
    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.PAUSED) {
        scanner.resume();
      }
    } catch (err) {
      console.warn("Scanner resume skipped:", err);
    }
    setPaused(false);
  };

  const buildManifest = (info: TicketInfo): GuestEntry[] => {
    const { name, email, phone, additional_guests, is_checked_in } = info;
    const list: GuestEntry[] = [];

    list.push({
      name: name || "Primary Booker",
      email: email || "",
      phone: phone || undefined,
      isPrimary: true,
      entered: !!is_checked_in,
      index: 0,
    });

    let additionalParsed: AdditionalGuest[] = [];
    if (Array.isArray(additional_guests)) {
      additionalParsed = additional_guests;
    } else if (additional_guests) {
      try {
        additionalParsed = JSON.parse(additional_guests);
      } catch {
        additionalParsed = [];
      }
    }

    additionalParsed.forEach((g, i) => {
      if (g && g.name) {
        list.push({
          name: g.name,
          email: g.email || "",
          isPrimary: false,
          entered: !!g.entered,
          index: i + 1,
        });
      }
    });

    return list;
  };

  const lookupTicket = async (rawCode: string) => {
    const ticketCode = rawCode.trim();
    if (!ticketCode) return;

    setLookupBusy(true);
    setResult(null);

    const { data, error } = await supabase.rpc("get_ticket_info", {
      p_ticket_code: ticketCode,
    });
    setLookupBusy(false);

    const info: TicketInfo | undefined = data?.[0];

    if (error || !info?.found) {
      setResult({
        success: false,
        message: "Invalid ticket code",
        booking_id: null,
        event_title: null,
        number_of_people: null,
        entered_count: null,
        already_checked_in_at: null,
      });
      return;
    }

    const remaining = (info.number_of_people ?? 0) - (info.entered_count ?? 0);

    if (remaining <= 0) {
      setResult({
        success: false,
        message: "All paid guests on this ticket have already entered",
        booking_id: info.booking_id,
        event_title: info.event_title,
        number_of_people: info.number_of_people,
        entered_count: info.entered_count,
        already_checked_in_at: info.checked_in_at,
      });
      return;
    }

    if (info.payment_status !== "paid") {
      setResult({
        success: false,
        message: "Payment not completed for this ticket",
        booking_id: info.booking_id,
        event_title: info.event_title,
        number_of_people: info.number_of_people,
        entered_count: info.entered_count,
        already_checked_in_at: null,
      });
      return;
    }

    const manifest = buildManifest(info);
    const notEntered = new Set(manifest.filter((g) => !g.entered).map((g) => g.index));
    setSelectedIndices(notEntered);
    setPendingTicket({ code: ticketCode, info });
  };

  const handleScan = async (ticketCode: string) => {
    const trimmed = ticketCode.trim();
    if (paused || lookupBusy || lastCodeRef.current === trimmed) return;
    lastCodeRef.current = trimmed;

    await pauseCamera();
    await lookupTicket(trimmed);
    await resumeCamera();
    lastCodeRef.current = null;
  };

  const cancelPending = async () => {
    setPendingTicket(null);
    setSelectedIndices(new Set());
    lastCodeRef.current = null;
    await resumeCamera();
  };

  const toggleGuest = (index: number, entered: boolean) => {
    if (entered) return;
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const confirmCheckIn = async () => {
    if (!pendingTicket || selectedIndices.size === 0) return;

    setConfirmBusy(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase.rpc("check_in_ticket_selected", {
      p_ticket_code: pendingTicket.code,
      p_scanned_by: session?.user?.id ?? null,
      p_guest_indices: Array.from(selectedIndices),
    });

    setConfirmBusy(false);
    setPendingTicket(null);
    setSelectedIndices(new Set());
    lastCodeRef.current = null;
    await resumeCamera();

    if (error) {
      setResult({
        success: false,
        message: "Scan failed — try again",
        booking_id: null,
        event_title: null,
        number_of_people: null,
        entered_count: null,
        already_checked_in_at: null,
      });
      return;
    }

    setResult(data?.[0] ?? null);
  };

  const remainingForPending = pendingTicket
    ? (pendingTicket.info.number_of_people ?? 0) - (pendingTicket.info.entered_count ?? 0)
    : 0;

  const fullGuestManifest = pendingTicket ? buildManifest(pendingTicket.info) : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center gap-6">
      {/* ✅ Header with logo + logout */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-brand-yellow" />
          <h1 className="text-xl font-black uppercase tracking-widest">Entry Scanner</h1>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>

      <div
        id="reader"
        className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/10"
      />

      {lookupBusy && (
        <p className="text-xs font-black uppercase tracking-widest text-white/40">
          Looking up ticket...
        </p>
      )}

      {pendingTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 my-8">
            <div className="text-center">
              <p className="text-lg font-black uppercase tracking-tighter">
                {pendingTicket.info.event_title}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                {pendingTicket.info.entered_count ?? 0} of {pendingTicket.info.number_of_people} entered — {remainingForPending} remaining
              </p>
            </div>

            <div className="bg-zinc-950/50 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 max-h-72 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/45 border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Users2 size={12} className="text-brand-yellow" /> Select who's entering
              </p>

              {fullGuestManifest.map((guest) => {
                const checked = selectedIndices.has(guest.index);
                return (
                  <button
                    key={guest.index}
                    type="button"
                    onClick={() => toggleGuest(guest.index, guest.entered)}
                    disabled={guest.entered}
                    className={`flex items-center justify-between gap-2 p-3 rounded-2xl border text-left transition-all ${
                      guest.entered
                        ? "bg-emerald-500/10 border-emerald-500/30 opacity-70 cursor-not-allowed"
                        : checked
                        ? "bg-brand-yellow/10 border-brand-yellow/40"
                        : "bg-zinc-800/40 border-white/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <User
                          size={13}
                          className={guest.isPrimary ? "text-brand-yellow" : "text-white/40"}
                        />
                        <span
                          className={`text-xs font-black uppercase tracking-tight truncate ${
                            guest.isPrimary ? "text-brand-yellow" : "text-white/90"
                          }`}
                        >
                          {guest.name}
                        </span>
                        {guest.isPrimary && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded-md border border-brand-yellow/30 shrink-0">
                            Primary
                          </span>
                        )}
                      </div>

                      {guest.email && (
                        <div className="flex items-center gap-1.5 pl-4.5 min-w-0 mt-0.5">
                          <Mail size={11} className="text-white/40 shrink-0" />
                          <span className="text-[11px] text-white/50 truncate">
                            {guest.email}
                          </span>
                        </div>
                      )}

                      {guest.isPrimary && guest.phone && (
                        <div className="text-[10px] text-white/45 pl-4.5 mt-0.5 font-medium tracking-wider">
                          📱 {guest.phone}
                        </div>
                      )}
                    </div>

                    {guest.entered ? (
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 shrink-0">
                        Entered ✓
                      </span>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          checked ? "bg-brand-yellow border-brand-yellow" : "border-white/20"
                        }`}
                      >
                        {checked && <CheckCircle2 size={14} className="text-zinc-950" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelPending}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 border border-white/10 font-black uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckIn}
                disabled={confirmBusy || selectedIndices.size === 0}
                className="flex-1 py-3 rounded-2xl bg-brand-yellow text-brand-green font-black uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {confirmBusy
                  ? "Checking in..."
                  : `Check In (${selectedIndices.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {result.entered_count != null && (
              <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                <Users2 size={12} /> {result.entered_count} entered
                {result.number_of_people != null && ` / ${result.number_of_people} paid`}
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