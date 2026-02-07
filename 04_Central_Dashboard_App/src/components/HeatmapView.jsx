import React from 'react';
import { Flame, AlertCircle, CheckCircle } from 'lucide-react';

const HeatmapView = ({ trafficData }) => {
  if (!trafficData || !trafficData.junctions) return null;

  const junctions = Object.entries(trafficData.junctions);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {junctions.map(([name, data]) => {
          const density = data.density || 0;
          // Calculate color based on density: 0=Green, 50=Yellow, 100=Red
          const hue = ((100 - density) * 1.2).toString(10);
          const color = `hsl(${hue}, 100%, 50%)`;
          const glowColor = `hsla(${hue}, 100%, 50%, 0.3)`;

          return (
            <div key={name} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Radial Heat Glow */}
              <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{
                  background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-slate-950 border border-slate-800 shadow-inner">
                   <Flame size={48} style={{ color: color }} className={density > 50 ? 'animate-pulse' : ''} />
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-white">{name}</h3>
                    <p className="text-slate-500 text-sm font-mono">Real-Time Occupancy Analysis</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-black text-white">{density}%</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Density</div>
                    </div>
                    <div className="w-px h-10 bg-slate-800"></div>
                    <div className="text-center">
                        <div className={`text-xl font-bold uppercase ${
                            data.status === 'Congested' ? 'text-rose-500' : 
                            data.status === 'Heavy' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                            {data.status || 'Smooth'}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Flow Status</div>
                    </div>
                </div>

                {/* Progress Bar Heatmap */}
                <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                    <div 
                        className="h-full transition-all duration-1000 ease-out"
                        style={{ 
                            width: `${density}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 20px ${color}`
                        }}
                    />
                </div>

                <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                        {density > 80 ? <AlertCircle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                        {density > 80 ? 'CRITICAL BOTTLENECK DETECTED' : 'FLOW WITHIN OPERATIONAL LIMITS'}
                    </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Summary */}
      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-xl">
                  <Flame className="text-white" />
              </div>
              <div>
                  <h4 className="text-white font-bold">City-Wide Heat Signature</h4>
                  <p className="text-indigo-300/60 text-xs">Visual sensors are aggregating area-based occupancy across all active quadrants.</p>
              </div>
          </div>
          <div className="text-right">
              <div className="text-2xl font-black text-indigo-400">
                  {Math.max(...junctions.map(([_, d]) => d.density || 0))}%
              </div>
              <div className="text-[10px] text-indigo-500 font-bold uppercase">Peak Density</div>
          </div>
      </div>
    </div>
  );
};

export default HeatmapView;
