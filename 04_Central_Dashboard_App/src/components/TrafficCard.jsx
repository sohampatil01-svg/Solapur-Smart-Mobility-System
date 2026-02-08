import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Play, Maximize2, AlertTriangle } from 'lucide-react';

const TrafficCard = ({ trafficData }) => {
  const fileInputRefs = useRef({});
  const [timestamp, setTimestamp] = useState(Date.now()); // To force image refresh if needed

  const handleFileUpload = async (event, junctionName) => {
    const file = event.target.files[0];
    if (!file) return;

    // Upload to Backend
    const formData = new FormData();
    formData.append('video', file);
    formData.append('lane_id', junctionName);
    
    try {
        await axios.post('http://localhost:5001/upload-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Force re-render of image to pick up new stream immediately
        setTimeout(() => setTimestamp(Date.now()), 1000);
    } catch (err) { 
        console.error("Upload failed", err);
        alert("Server connection failed.");
    }
  };

  const triggerFileInput = (junctionName) => {
    if (fileInputRefs.current[junctionName]) {
        fileInputRefs.current[junctionName].click();
    }
  };

  if (!trafficData || !trafficData.junctions) return <div className="p-10 text-center text-slate-500">Loading Grid...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] mb-8">
      {Object.entries(trafficData.junctions).map(([name, data]) => (
        <div key={name} className="relative bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl group">
            
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-10 flex justify-between items-start pointer-events-none">
                <div>
                    <h3 className="text-white font-bold text-lg drop-shadow-md">{name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${data.active ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                        <span className="text-xs text-slate-300 font-mono">{data.active ? 'LIVE AI FEED' : 'SIGNAL LOST'}</span>
                    </div>
                </div>
                
                {/* Density Badge */}
                <div className={`px-3 py-1 rounded backdrop-blur-md border shadow-lg ${
                    data.density > 80 ? 'bg-rose-600/60 border-rose-500 text-white animate-pulse' : 
                    data.density > 50 ? 'bg-amber-600/60 border-amber-500 text-white' : 
                    'bg-emerald-600/60 border-emerald-500 text-white'
                }`}>
                    <span className="text-sm font-bold">{data.density}%</span>
                </div>
            </div>

            {/* Video Player Area (MJPEG Stream) */}
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                {data.active ? (
                    <img 
                        src={`http://localhost:5001/video_feed/${name}?t=${timestamp}`} 
                        alt={`Live Feed ${name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none'; // Hide if stream fails
                            // Ideally, show a fallback or retry
                        }}
                    />
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                            <AlertTriangle className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-slate-500 text-sm mb-4 font-mono">NO SIGNAL DETECTED</p>
                        
                        <input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            ref={el => fileInputRefs.current[name] = el}
                            onChange={(e) => handleFileUpload(e, name)}
                        />
                        <button 
                            onClick={() => triggerFileInput(name)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            <Upload className="w-4 h-4" />
                            UPLOAD FEED
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-4 text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1"><span className="text-indigo-400">🚗</span> {data.counts?.car || 0}</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-400">🚌</span> {data.counts?.bus || 0}</span>
                    <span className="flex items-center gap-1"><span className="text-rose-400">🚚</span> {data.counts?.truck || 0}</span>
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${data.counts?.ambulance > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : ''}`}>
                        <span>🚑</span> {data.counts?.ambulance > 0 ? 'YES' : 'NO'}
                    </span>
                </div>
                
                {/* Re-upload button (visible on hover) */}
                <div className="pointer-events-auto">
                    <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        ref={el => fileInputRefs.current[name] = el}
                        onChange={(e) => handleFileUpload(e, name)}
                    />
                    <button onClick={() => triggerFileInput(name)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur text-white border border-white/10" title="Change Feed">
                        <Upload className="w-4 h-4" />
                    </button>
                </div>
            </div>

        </div>
      ))}
    </div>
  );
};

export default TrafficCard;