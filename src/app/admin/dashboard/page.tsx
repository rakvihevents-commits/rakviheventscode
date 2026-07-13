"use client";
import React from 'react';
import { Users, CalendarCheck, IndianRupee, TrendingUp, Clock } from 'lucide-react';

export default function AdminDashboard() {
  // Mock data for the "Normal" view
  const stats = [
    { id: 1, name: 'Total Bookings', value: '128', icon: <CalendarCheck className="text-blue-600" />, change: '+12%', color: 'bg-blue-50' },
    { id: 2, name: 'Total Revenue', value: '₹4,50,000', icon: <IndianRupee className="text-green-600" />, change: '+8%', color: 'bg-green-50' },
    { id: 3, name: 'New Users', value: '42', icon: <Users className="text-purple-600" />, change: '+18%', color: 'bg-purple-50' },
    { id: 4, name: 'Active Events', value: '15', icon: <TrendingUp className="text-orange-600" />, change: 'Steady', color: 'bg-orange-50' },
  ];

  const recentBookings = [
    { id: "BK-101", customer: "Rahul Sharma", event: "Wedding Decor", date: "2026-03-28", status: "Confirmed" },
    { id: "BK-102", customer: "Anjali Gupta", event: "Birthday Party", date: "2026-04-02", status: "Pending" },
    { id: "BK-103", customer: "Vikram Singh", event: "Corporate Meet", date: "2026-03-25", status: "Completed" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">Welcome back! Here is what's happening with Rakvih Events today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
              <h3 className="text-2xl font-bold text-slate-800">{item.value}</h3>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section: Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Bookings</h3>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600">{booking.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{booking.customer}</td>
                    <td className="px-6 py-4">{booking.event}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        booking.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 
                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">System Status</h3>
            <p className="text-indigo-200 text-sm mb-6">Database and Server are running smoothly.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                <Clock size={18} className="text-indigo-300" />
                <span className="text-sm">Last Backup: 2 hours ago</span>
              </div>
            </div>
          </div>
          
          <button className="mt-8 w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors">
            Generate Reports
          </button>
        </div>

      </div>
    </div>
  );
}