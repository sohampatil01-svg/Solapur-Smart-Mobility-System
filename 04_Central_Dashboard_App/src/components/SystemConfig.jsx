import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Navigation, MapPin, AlertTriangle, CheckCircle, Truck, Calendar } from 'lucide-react';

const SystemConfig = ({ cityMeta }) => {
  const [routeResult, setRouteResult] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeEvent, setActiveEvent] = useState(cityMeta?.event_mode || 'Normal Flow');

  // 1. Handle Event Mode Change
  const handleEventChange = async (e) => {
    const newEvent = e.target.value;
    setActiveEvent(newEvent);
    try {
      await axios.post('http://localhost:5001/set-event', { event: newEvent });
      alert(`City Mode updated to: ${newEvent}`);
    } catch (err) {
      console.error("Failed to set event", err);
      alert("Error: Could not update city mode.");
    }
  };

  // 2. Handle Route Optimization
  const handleFindRoute = async (e) => {
    e.preventDefault();
    setLoadingRoute(true);
    setRouteResult(null);

    const start = e.target.start.value;
    const end = e.target.end.value;

    try {
      const res = await axios.post('http://localhost:5001/optimize-route', { start, end });
      setRouteResult(res.data);
    } catch (err) {
      console.error("Route API Error", err);
      setRouteResult({ error: "Could not calculate route. Server offline?" });
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600/20 rounded-xl">
            <Settings className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-100">System Configuration</h2>
            <p className="text-slate-400">Manage city-wide traffic rules and algorithms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CARD 1: Event Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/50">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-200">City Event Mode</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
                Override adaptive algorithms for special scenarios.
            </p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Active Scenario</label>
                <select 
                    value={activeEvent}
                    onChange={handleEventChange}
                    className="w-full bg-slate-800 text-white p-3 rounded-lg outline-none border border-slate-700 focus:border-indigo-500 transition-all"
                >
                    <option value="Normal Flow">🟢 Normal Traffic Flow</option>
                    <option value="VIP Movement">🚓 VIP Movement (Green Corridor)</option>
                    <option value="Religious Procession">🚩 Religious Procession (Block Central)</option>
                    <option value="School Hours">🚌 School Hours (Safety Mode)</option>
                </select>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                    <Truck className="w-4 h-4" />
                    <span>Current Simulated Hour: <span className="text-emerald-400 font-mono text-sm">{cityMeta?.simulated_hour || '--'}:00</span></span>
                </div>
            </div>
          </div>

          {/* CARD 2: Route Optimizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/50">
            <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-slate-200">Smart Route Finder</h3>
            </div>

            <form onSubmit={handleFindRoute} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Start Location</label>
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                            <MapPin className="w-4 h-4 text-slate-500 mr-2" />
                            <input name="start" defaultValue="Market Yard" className="bg-transparent w-full text-sm text-white outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Destination</label>
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-2">
                            <MapPin className="w-4 h-4 text-slate-500 mr-2" />
                            <input name="end" defaultValue="Railway Station" className="bg-transparent w-full text-sm text-white outline-none" />
                        </div>
                    </div>
                </div>

                <button 
                    disabled={loadingRoute}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all flex justify-center items-center gap-2"
                >
                    {loadingRoute ? 'Calculating...' : 'Find Fastest Route'}
                </button>
            </form>

            {/* Results Display */}
            {routeResult && (
                <div className={`mt-4 p-4 rounded-lg border animate-in slide-in-from-top-2 ${routeResult.error ? 'bg-rose-900/20 border-rose-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
                    {routeResult.error ? (
                        <p className="text-rose-400 text-sm">{routeResult.error}</p>
                    ) : (
                        <>
                            <div className="flex items-start gap-3">
                                {routeResult.reason.includes("Avoided") ? (
                                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                )}
                                <div>
                                    <h4 className="font-semibold text-slate-200 text-sm">Optimization Result</h4>
                                    <p className="text-xs text-slate-400 mt-1 mb-2">{routeResult.reason}</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {routeResult.optimized_route.map((step, idx) => (
                                            <span key={idx} className="flex items-center text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">
                                                {step}
                                                {idx < routeResult.optimized_route.length - 1 && <span className="ml-2 text-slate-600">→</span>}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-emerald-400 mt-2 font-mono">Est. Time: {routeResult.estimated_time}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
          </div>

      </div>
    </div>
  );
};

export default SystemConfig;
