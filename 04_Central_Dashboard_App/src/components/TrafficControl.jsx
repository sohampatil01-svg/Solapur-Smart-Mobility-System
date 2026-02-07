import React, { useState } from 'react';
import axios from 'axios';
import { Navigation, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const TrafficControl = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventStatus, setEventStatus] = useState("Normal Flow");

  // Route Optimization Handler
  const handleFindRoute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRoute(null);

    // Mock Payload (In real app, get from inputs)
    const payload = {
        start: "Lane 1",
        end: "Railway Station"
    };

    try {
        const res = await axios.post('http://localhost:5001/optimize-route', payload);
        setRoute(res.data);
    } catch (err) {
        console.error("API Error", err);
        // Fallback Mock Data if API is offline
        setRoute({
            route: ["Lane 1", "Bypass Road", "Railway Station"],
            estimated_time: "25 mins (Offline Mode)",
            note: "API Unreachable. Showing safe bypass."
        });
    } finally {
        setLoading(false);
    }
  };

  // Event Selection Handler
  const handleEventChange = async (e) => {
      const selectedEvent = e.target.value;
      setEventStatus(selectedEvent);
      
      const isActive = selectedEvent !== "Normal Flow";
      
      // Call Backend API
      try {
          await axios.post('http://localhost:5001/set-event', {
              active: isActive,
              name: selectedEvent,
              junctions: ["Lane 4", "Lane 3"] // Default affected zones
          });
          alert(`Traffic Logic Updated: ${selectedEvent} Mode Activated`);
      } catch (err) {
          console.error("Failed to set event", err);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Widget 1: Smart Route Finder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Navigation className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-slate-200 font-semibold">Smart Route Optimizer</h3>
            </div>

            <form onSubmit={handleFindRoute} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Start: Lane 1" disabled className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-400 cursor-not-allowed" />
                    <input type="text" placeholder="End: Railway Station" disabled className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-400 cursor-not-allowed" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded transition-colors">
                    {loading ? "Calculating..." : "Find Fastest Route"}
                </button>
            </form>

            {route && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-emerald-300 font-semibold">Recommended Route:</p>
                            <p className="text-xs text-slate-300 mt-1">{route.route.join(" ➝ ")}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">ETA: {route.estimated_time}</span>
                                {route.note && <span className="text-[10px] text-slate-400">{route.note}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Widget 2: Event Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-slate-200 font-semibold">Event Management</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
                Override traffic logic for special city events. This will force signals to RED/GREEN based on the event type.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Active Scenario</label>
                    <select 
                        value={eventStatus}
                        onChange={handleEventChange}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:border-indigo-500 outline-none"
                    >
                        <option value="Normal Flow">🟢 Normal Traffic Flow</option>
                        <option value="School Hours">🚌 School Hours (Priority to Buses)</option>
                        <option value="Religious Procession">🚩 Religious Procession (Block Central)</option>
                        <option value="VIP Movement">🚓 VIP Movement (Green Corridor)</option>
                    </select>
                </div>

                <div className={`p-3 rounded-lg border ${eventStatus === 'Normal Flow' ? 'bg-slate-800 border-slate-700' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                    <div className="flex items-center gap-2">
                        {eventStatus === 'Normal Flow' ? (
                            <CheckCircle className="w-4 h-4 text-slate-400" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-indigo-400" />
                        )}
                        <span className="text-xs text-slate-300">
                            Current Status: <span className="font-semibold">{eventStatus}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default TrafficControl;
