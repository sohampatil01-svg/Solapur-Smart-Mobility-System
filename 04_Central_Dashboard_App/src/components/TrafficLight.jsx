import React from 'react';

const TrafficLight = ({ signal }) => {
  // Normalize signal input
  const status = signal ? signal.toUpperCase() : "RED"; 

  // Determine active light
  const isRed = status.includes("RED");
  const isYellow = status.includes("YELLOW"); // Setup for future use
  const isGreen = status.includes("GREEN");

  return (
    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3 w-16 items-center">
        {/* RED LIGHT */}
        <div className={`w-10 h-10 rounded-full transition-all duration-300 ${isRed 
            ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)] border-2 border-red-400' 
            : 'bg-red-900/30 border border-slate-800 opacity-40'}`}>
        </div>

        {/* YELLOW LIGHT (Placeholder logic if not used by backend yet) */}
        <div className={`w-10 h-10 rounded-full transition-all duration-300 ${isYellow
            ? 'bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] border-2 border-amber-300' 
            : 'bg-amber-900/30 border border-slate-800 opacity-40'}`}>
        </div>

        {/* GREEN LIGHT */}
        <div className={`w-10 h-10 rounded-full transition-all duration-300 ${isGreen
            ? 'bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.8)] border-2 border-emerald-400' 
            : 'bg-emerald-900/30 border border-slate-800 opacity-40'}`}>
        </div>
    </div>
  );
};

export default TrafficLight;
