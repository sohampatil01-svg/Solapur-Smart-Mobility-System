import React from 'react';
import axios from 'axios';
import { Siren, Activity } from 'lucide-react';

const TrafficCard = ({ trafficData }) => {
  const [triggering, setTriggering] = React.useState(null);

  const handleEmergency = async (junctionName) => {
    setTriggering(junctionName);
    try {
      await axios.post('http://localhost:5001/emergency', { junction: junctionName });
    } catch (err) {
      console.error("Failed to trigger emergency:", err);
    } finally {
      setTimeout(() => setTriggering(null), 1000);
    }
  };

  if (!trafficData || !trafficData.junctions) return <div className="p-4 text-slate-400 animate-pulse">Waiting for sensor data...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
      {Object.entries(trafficData.junctions).map(([name, data]) => (
        <div key={name} className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-lg shadow-black/20">
          
          {/* Signal Indicator Strip */}
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${data.signal.includes('GREEN') ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`} />
          
          <div className="flex justify-between items-start mb-4 pl-3">
            <div>
              <h3 className="text-slate-100 font-semibold text-lg">{name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <Activity className="w-3 h-3" />
                <span>Density: {data.density}%</span>
              </div>
            </div>
            
            {/* Traffic Light Graphic */}
            <div className="bg-slate-950 p-2 rounded-lg flex flex-col gap-2 border border-slate-800">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${data.signal === 'RED' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-slate-800'}`} />
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${data.signal.includes('GREEN') ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-800'}`} />
            </div>
          </div>

          <div className="flex items-end justify-between pl-3">
            <div className="text-center">
               <span className="text-2xl font-mono font-bold text-slate-200">{data.timer}s</span>
               <p className="text-[10px] uppercase tracking-wider text-slate-500">Timer</p>
            </div>
            
            <button 
              onClick={() => handleEmergency(name)}
              disabled={triggering === name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
                ${triggering === name 
                  ? 'bg-rose-500/20 text-rose-500 cursor-wait' 
                  : 'bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white'
                }`}
            >
              <Siren className="w-4 h-4" />
              {triggering === name ? 'Sending...' : 'EMERGENCY'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrafficCard;