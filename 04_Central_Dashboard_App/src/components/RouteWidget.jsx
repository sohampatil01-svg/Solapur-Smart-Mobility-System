import React, { useState } from 'react';
import axios from 'axios';
import { Navigation, MapPin, Clock, Info } from 'lucide-react';

const RouteWidget = () => {
  const [start, setStart] = useState('Railway Station');
  const [end, setEnd] = useState('SMC Office');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const locations = [
    "Railway Station", "Seven Star", "Market Yard", "Mechanic Chowk", 
    "Saat Rasta", "SMC Office", "Bypass", "Shivaji Chowk"
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/optimize-route', { start, end });
      setRoute(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Navigation size={20} className="text-indigo-400" />
        </div>
        <h3 className="text-white font-bold">Smart Route Finder</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Origin</label>
                <select 
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Destination</label>
                <select 
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
        </div>

        <button 
            onClick={handleSearch}
            disabled={loading || start === end}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
        >
            {loading ? 'Analyzing Sensors...' : 'Calculate Fastest Path'}
        </button>
      </div>

      {route && (
        <div className="flex-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">OPTIMIZED</span>
                <div className="flex items-center gap-1 text-white text-sm font-bold">
                    <Clock size={12} className="text-indigo-400" />
                    {route.estimated_time}
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {route.optimized_route.map((step, i) => (
                    <div key={i} className="flex items-center text-[10px] font-mono text-slate-300">
                        {step}
                        {i < route.optimized_route.length - 1 && <span className="mx-1 text-slate-600">→</span>}
                    </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-800/50 flex items-start gap-2">
                <Info size={12} className="text-indigo-400 mt-0.5" />
                <p className="text-[9px] text-slate-500 leading-relaxed italic">
                    {route.reason}
                </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default RouteWidget;
