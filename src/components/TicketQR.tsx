"use client";

import { QRCodeSVG } from "qrcode.react";

// Place this on the live event booking DETAIL page (the one
// `detailHref: /site/events/live/${item.live_event_id}` points to,
// or a dedicated /site/bookings/live/[id] page).
//
// You need `ticket_code` on the booking row — it already comes through
// automatically since the bookings page does `select *`.

export function TicketQR({
  ticketCode,
  isCheckedIn,
}: {
  ticketCode: string;
  isCheckedIn?: boolean;
}) {
  if (isCheckedIn) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl shadow-lg border-2 border-emerald-200">
        <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
          Already checked in
        </p>
        <p className="text-[10px] uppercase font-black text-slate-400">
          This ticket has been used for entry
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl shadow-lg">
      <QRCodeSVG value={ticketCode} size={200} level="H" />
      <p className="text-xs font-mono tracking-widest text-slate-400">{ticketCode}</p>
      <p className="text-[10px] uppercase font-black text-slate-400 text-center">
        Show this at entry — single use only
      </p>
    </div>
  );
}