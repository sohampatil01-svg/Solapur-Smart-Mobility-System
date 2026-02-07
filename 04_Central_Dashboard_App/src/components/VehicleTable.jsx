import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Truck, Car, Bike, AlertCircle } from 'lucide-react';

const VehicleTable = ({ trafficData }) => {
  // If parent passes data, use it. Otherwise we could fetch internally, 
  // but efficient React patterns suggest using the parent's already-fetched data.
  
  if (!trafficData || !trafficData.junctions) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20 animate-in slide-in-from-bottom-8 duration-700">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-slate-100 font-semibold text-lg">Live Traffic Breakdown</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 animate-pulse">
              ● LIVE DATA
          </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium border-b border-slate-800">Junction / Lane</th>
              <th className="p-4 font-medium border-b border-slate-800 text-center text-indigo-400"><Car className="w-4 h-4 mx-auto mb-1"/> Cars</th>
              <th className="p-4 font-medium border-b border-slate-800 text-center text-amber-400"><Bike className="w-4 h-4 mx-auto mb-1"/> Bikes</th>
              <th className="p-4 font-medium border-b border-slate-800 text-center text-rose-400"><Truck className="w-4 h-4 mx-auto mb-1"/> Heavy</th>
              <th className="p-4 font-medium border-b border-slate-800 text-center text-white">Total Load</th>
              <th className="p-4 font-medium border-b border-slate-800 text-right">Signal Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {Object.entries(trafficData.junctions).map(([name, data]) => {
                const heavyCount = (data.counts?.bus || 0) + (data.counts?.truck || 0);
                const isGreen = data.signal && data.signal.includes("GREEN");

                return (
                  <tr key={name} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 text-sm font-medium text-slate-200 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isGreen ? 'text-emerald-500 bg-emerald-500' : 'text-rose-500 bg-rose-500'}`}></div>
                        {name}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-300 font-mono group-hover:text-white transition-colors">
                        {data.counts?.car || 0}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-300 font-mono group-hover:text-white transition-colors">
                        {data.counts?.bike || 0}
                    </td>
                    <td className="p-4 text-sm text-center font-mono font-bold text-rose-400">
                        {heavyCount}
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{data.total || 0}</span>
                            <span className="text-xs text-slate-500">({data.density}%)</span>
                        </div>
                    </td>
                    <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            isGreen 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {isGreen ? 'GO (GREEN)' : 'STOP (RED)'}
                        </span>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleTable;