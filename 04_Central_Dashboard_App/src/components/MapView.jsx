import React from 'react';

const MapView = ({ trafficData }) => {
  if (!trafficData) return null;

  // Mock Coordinates for the 4 Lanes relative to a central point
  // Ideally, this would be a real map image background
  const junctions = [
    { id: "Lane 1", x: "50%", y: "20%", label: "North Junction" },
    { id: "Lane 2", x: "80%", y: "50%", label: "East Market" },
    { id: "Lane 3", x: "50%", y: "80%", label: "South Highway" },
    { id: "Lane 4", x: "20%", y: "50%", label: "West Gate" },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20 h-[600px] relative group">
        
        {/* Map Background (Placeholder for real Solapur Map) */}
        <div className="absolute inset-0 bg-slate-800 opacity-50 flex items-center justify-center">
            {/* Simple CSS Roads */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-12 bg-slate-700"></div>
                <div className="h-full w-12 bg-slate-700 absolute"></div>
            </div>
            <p className="text-slate-500 font-bold text-4xl opacity-20 rotate-45">SOLAPUR CITY MAP</p>
        </div>

        {/* Junction Markers */}
        {junctions.map((j) => {
            const data = trafficData.junctions[j.id];
            const isGreen = data?.signal?.includes("GREEN");
            const density = data?.density || 0;

            return (
                <div 
                    key={j.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 cursor-pointer hover:scale-110 transition-transform"
                    style={{ left: j.x, top: j.y }}
                >
                    {/* Signal Indicator */}
                    <div className={`w-8 h-8 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center ${
                        isGreen ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                    }`}>
                        <span className="text-[10px] font-bold text-slate-900">{density}%</span>
                    </div>

                    {/* Label Box */}
                    <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-center min-w-[120px]">
                        <p className="text-xs font-bold text-white">{j.id}</p>
                        <p className="text-[10px] text-slate-400">{j.label}</p>
                        
                        {/* Status Line */}
                        <div className="mt-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${density > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${density}%` }}
                            />
                        </div>
                    </div>
                </div>
            );
        })}

        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-700">
            <h4 className="text-white font-bold text-sm mb-2">Legend</h4>
            <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low Density (Green)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span> High Congestion (Red)</div>
            </div>
        </div>

    </div>
  );
};

export default MapView;
