import React, { useState } from 'react';
import axios from 'axios';
import { Navigation, MapPin, Search, Clock, ChevronRight } from 'lucide-react';

const MapView = ({ trafficData }) => {
  const [start, setStart] = useState('Railway Station');
  const [end, setEnd] = useState('SMC Office');
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!trafficData) return null;

  const locations = [
    "Railway Station", "Seven Star", "Market Yard", "Mechanic Chowk", 
    "Saat Rasta", "SMC Office", "Bypass", "Shivaji Chowk"
  ];

  const markers = [
    { id: "Railway Station", x: "15%", y: "45%", label: "Hub" },
    { id: "Seven Star", x: "35%", y: "30%", label: "Junction" },
    { id: "Market Yard", x: "35%", y: "60%", label: "Market Yard" },
    { id: "Mechanic Chowk", x: "55%", y: "45%", label: "Mechanic Chowk" },
    { id: "SMC Office", x: "75%", y: "30%", label: "Govt Zone" },
    { id: "Saat Rasta", x: "55%", y: "75%", label: "Saat Rasta" },
    { id: "Bypass", x: "85%", y: "60%", label: "Exit" },
    { id: "Shivaji Chowk", x: "85%", y: "85%", label: "Shivaji Chowk" },
  ];

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/optimize-route', { start, end });
      setRouteResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[700px]">
        {/* Map Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {/* Fake Roads */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <path d="M 0 350 L 1200 350" stroke="#94a3b8" strokeWidth="40" fill="none" />
                <path d="M 450 0 L 450 800" stroke="#94a3b8" strokeWidth="40" fill="none" />
                <path d="M 700 0 L 700 800" stroke="#94a3b8" strokeWidth="40" fill="none" />
            </svg>

            {/* Path Highlight (Simplified) */}
            {routeResult && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Visualizing path would require more complex SVG logic, for now we just label the markers */}
                </div>
            )}

            {/* Location Markers */}
            {markers.map((m) => {
                const isInRoute = routeResult?.optimized_route?.includes(m.id);
                return (
                    <div 
                        key={m.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ${
                            isInRoute ? 'z-20 scale-110' : 'z-0 opacity-60'
                        }`}
                        style={{ left: m.x, top: m.y }}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl transition-all ${
                            isInRoute ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-slate-700'
                        }`}>
                            <MapPin size={18} className={isInRoute ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded bg-slate-900/90 border ${
                            isInRoute ? 'border-indigo-500 text-indigo-100 shadow-lg' : 'border-slate-800 text-slate-500'
                        }`}>
                            <p className="text-[10px] font-bold whitespace-nowrap">{m.id}</p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Route Planner Sidebar */}
        <div className="xl:w-80 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Navigation className="text-indigo-400" size={20} />
                    Route Optimizer
                </h3>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Start Location</label>
                        <select 
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            {locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Destination</label>
                        <select 
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            {locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={handleOptimize}
                        disabled={loading || start === end}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Analyzing...' : 'Find Fastest Route'}
                        <Search size={16} />
                    </button>
                </div>
            </div>

            {routeResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">OPTIMIZED</span>
                        <div className="flex items-center gap-1 text-slate-300">
                            <Clock size={14} className="text-indigo-400" />
                            <span className="text-sm font-bold">{routeResult.estimated_time}</span>
                        </div>
                    </div>

                    <div className="space-y-3 py-2">
                        {routeResult.optimized_route.map((stop, i) => (
                            <div key={stop} className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : i === routeResult.optimized_route.length -1 ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
                                    {i !== routeResult.optimized_route.length - 1 && <div className="w-0.5 h-6 bg-slate-800"></div>}
                                </div>
                                <span className="text-xs font-medium text-slate-300">{stop}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10px] text-indigo-300 leading-relaxed italic">
                        "{routeResult.reason}"
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default MapView;