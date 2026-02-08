import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, AlertTriangle, Maximize2 } from 'lucide-react';
import TrafficLight from './TrafficLight';

const LiveGrid = ({ trafficData }) => {
  const fileInputRefs = useRef({});
  const [timestamp, setTimestamp] = useState(Date.now()); // Force refresh for streams

  const handleFileUpload = async (event, laneId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('lane_id', laneId);
    
    try {
        await axios.post('http://localhost:5001/upload-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Refresh stream timestamp after short delay to allow backend to restart
        setTimeout(() => setTimestamp(Date.now()), 1500);
    } catch (err) { 
        console.error("Upload failed", err);
        alert("Failed to upload video.");
    } finally {
        event.target.value = null; // Reset input to allow re-uploading same file
    }
  };

  const triggerFileInput = (laneId) => {
    if (fileInputRefs.current[laneId]) {
        fileInputRefs.current[laneId].click();
    }
  };

  if (!trafficData || !trafficData.junctions) return <div className="text-center text-slate-500 py-10">Loading Live Grid...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.entries(trafficData.junctions).map(([name, data]) => (
            <div key={name} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex gap-4 h-[350px]">
                
                {/* LEFT: Traffic Light Control */}
                <div className="flex flex-col items-center justify-between py-2">
                    <TrafficLight signal={data.signal} />
                    <div className="text-center">
                        <span className="block text-xl font-bold text-white">{data.timer}s</span>
                    </div>
                </div>

                {/* RIGHT: Video Feed Area */}
                <div className="flex-1 relative bg-black rounded-xl overflow-hidden border border-slate-800 group">
                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${data.active ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                            <span className="text-xs font-mono text-white/80">{data.active ? 'LIVE AI' : 'OFFLINE'}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                            data.density > 80 ? 'bg-red-500 text-white' : 
                            data.density > 50 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                            {data.density}%
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                            data.counts?.ambulance > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
                        }`}>
                            🚑 {data.counts?.ambulance > 0 ? 'AMB: YES' : 'AMB: NO'}
                        </div>
                    </div>

                    {/* Stream or Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-slate-950">
                        {data.active ? (
                            <img 
                                src={`http://localhost:5001/video_feed/${name}?t=${timestamp}`} 
                                alt={`${name} Stream`}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <AlertTriangle className="w-8 h-8 text-slate-500" />
                                <span className="text-xs text-slate-500">NO SIGNAL</span>
                            </div>
                        )}
                    </div>

                    {/* Hover Upload Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            ref={el => fileInputRefs.current[name] = el}
                            onChange={(e) => handleFileUpload(e, name)}
                        />
                        <button 
                            onClick={() => triggerFileInput(name)}
                            className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Feed
                        </button>
                    </div>
                </div>

            </div>
        ))}
    </div>
  );
};

export default LiveGrid;
