import React from 'react';
import { AlertTriangle, Clock, MapPin, Shield } from 'lucide-react';

const AlertsPanel = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
            <Shield className="text-slate-600" size={24} />
        </div>
        <h3 className="text-slate-400 font-medium">No Active Violations</h3>
        <p className="text-slate-600 text-sm max-w-xs mt-1">Surveillance systems are monitoring city zones. No obstructions detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.slice().reverse().map((alert) => (
        <div 
          key={alert.id} 
          className={`flex items-start gap-4 p-4 rounded-xl border transition-all animate-in slide-in-from-right-4 duration-300 ${
            alert.severity === 'high' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            alert.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <AlertTriangle size={20} />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm uppercase tracking-wide">{alert.type}</h4>
              <span className="flex items-center gap-1 text-[10px] font-mono opacity-60">
                <Clock size={10} /> {alert.timestamp}
              </span>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">{alert.message}</p>
            <div className="flex items-center gap-1 text-[10px] font-medium opacity-60 mt-2">
              <MapPin size={10} /> {alert.location}
            </div>
          </div>

          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            alert.severity === 'high' ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-500/30 text-amber-200'
          }`}>
            {alert.severity}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsPanel;
