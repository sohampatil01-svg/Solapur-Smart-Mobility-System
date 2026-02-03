import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MapPin, BrainCircuit } from 'lucide-react';

const AnalyticsPanel = ({ trafficData }) => {
  const [activeTab, setActiveTab] = useState('realtime'); // 'realtime' or 'predictive'
  const [realtimeHistory, setRealtimeHistory] = useState([]);

  // Mock Prediction Data (Static for now, but conceptual)
  const predictiveData = [
    { time: '08:00', predicted: 95, normal: 80 },
    { time: '10:00', predicted: 70, normal: 65 },
    { time: '12:00', predicted: 60, normal: 60 },
    { time: '14:00', predicted: 65, normal: 55 },
    { time: '16:00', predicted: 85, normal: 75 },
    { time: '18:00', predicted: 98, normal: 85 }, 
    { time: '20:00', predicted: 50, normal: 45 },
  ];

  // Update Realtime Chart when trafficData changes
  useEffect(() => {
    if (trafficData) {
        const currentHour = trafficData.city_meta?.simulated_hour;
        
        // Calculate average density
        const junctions = Object.values(trafficData.junctions || {});
        const avgDensity = junctions.reduce((acc, curr) => acc + curr.density, 0) / (junctions.length || 1);

        setRealtimeHistory(prev => {
            // Keep last 10 data points
            const newData = [...prev, { time: `${currentHour}:00`, density: Math.round(avgDensity) }];
            if (newData.length > 10) newData.shift();
            return newData;
        });
    }
  }, [trafficData]);

  // Transform data for Bar Chart
  const congestionData = trafficData ? Object.entries(trafficData.junctions).map(([name, data]) => ({
      zone: name,
      congestion: data.density
  })) : [];

  return (
    <div className="mt-6 animate-in fade-in duration-700">
        
        {/* Tab Switcher */}
        <div className="flex items-center gap-4 mb-4">
            <button 
                onClick={() => setActiveTab('realtime')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'realtime' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                Real-Time Insights
            </button>
            <button 
                onClick={() => setActiveTab('predictive')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'predictive' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <BrainCircuit className="w-4 h-4" />
                Future Predictions
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Depends on Tab */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${activeTab === 'realtime' ? 'bg-indigo-500/10' : 'bg-purple-500/10'}`}>
                    {activeTab === 'realtime' ? <TrendingUp className="w-5 h-5 text-indigo-400" /> : <BrainCircuit className="w-5 h-5 text-purple-400" />}
                </div>
                <div>
                    <h3 className="text-slate-200 font-semibold">
                        {activeTab === 'realtime' ? 'Live Traffic Trend' : 'AI Prediction (Tomorrow)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {activeTab === 'realtime' ? 'Tracking simulation hour by hour' : 'Projected density based on historical data'}
                    </p>
                </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'realtime' ? (
                    <AreaChart data={realtimeHistory}>
                        <defs>
                            <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                        <Area type="monotone" dataKey="density" stroke="#6366f1" fillOpacity={1} fill="url(#colorDensity)" />
                    </AreaChart>
                ) : (
                    <AreaChart data={predictiveData}>
                        <defs>
                            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                        <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPredicted)" />
                    </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Congestion Zones */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                    <h3 className="text-slate-200 font-semibold">Peak Congestion Zones</h3>
                    <p className="text-xs text-slate-500">Live severity levels from sensors</p>
                </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={congestionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} hide domain={[0, 100]} />
                  <YAxis dataKey="zone" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} width={100} />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Bar dataKey="congestion" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
    </div>
  );
};

export default AnalyticsPanel;
