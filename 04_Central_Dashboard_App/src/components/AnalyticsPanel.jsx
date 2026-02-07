import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Activity, Car, Truck, Shield, BarChart3 } from 'lucide-react';

const AnalyticsPanel = ({ trafficData }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch historical data from DB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5001/analytics');
        setHistoryData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  if (!trafficData) return null;

  // --- 1. AGGREGATE VEHICLE DATA ---
  let totalCars = 0;
  let totalBuses = 0;
  let totalTrucks = 0;
  let totalBikes = 0;

  Object.values(trafficData.junctions).forEach(j => {
      const counts = j.counts || {};
      totalCars += counts.car || 0;
      totalBuses += counts.bus || 0;
      totalTrucks += counts.truck || 0;
      totalBikes += counts.bike || 0;
  });

  const totalVehicles = totalCars + totalBuses + totalTrucks + totalBikes;
  const heavyVehicles = totalBuses + totalTrucks;

  const vehicleDistribution = [
      { name: 'Cars', value: totalCars, color: '#6366f1' },
      { name: 'Buses', value: totalBuses, color: '#10b981' },
      { name: 'Trucks', value: totalTrucks, color: '#f43f5e' },
      { name: 'Bikes', value: totalBikes, color: '#f59e0b' },
  ].filter(i => i.value > 0);

  // --- 2. CONGESTION DATA ---
  const congestionData = Object.entries(trafficData.junctions).map(([name, data]) => ({
      zone: name,
      congestion: data.density
  }));

  const currentAvgDensity = congestionData.length > 0 
    ? Math.round(congestionData.reduce((acc, curr) => acc + curr.congestion, 0) / congestionData.length)
    : 0;

  return (
    <div className="mt-6 animate-in fade-in duration-700 space-y-6">
        
        {/* BIG NUMBERS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Car className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Traffic</p>
                    <h4 className="text-xl font-bold text-slate-100">{totalVehicles}</h4>
                </div>
            </div>

             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
                    <Truck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Heavy Vehicles</p>
                    <h4 className="text-xl font-bold text-slate-100">{heavyVehicles}</h4>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Density</p>
                    <h4 className="text-xl font-bold text-slate-100">{currentAvgDensity}%</h4>
                </div>
            </div>

             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Security</p>
                    <h4 className="text-xl font-bold text-slate-100">ACTIVE</h4>
                </div>
            </div>
        </div>

        {/* TREND CHART */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-slate-200 font-semibold text-sm">Aggregate Traffic Density (Historical)</h3>
                    <p className="text-[10px] text-slate-500">Trend data synced from SQLite core</p>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {historyData.length > 0 ? (
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="avg_density" stroke="#6366f1" fillOpacity={1} fill="url(#colorDensity)" strokeWidth={2} />
                        </AreaChart>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                            Building historical profile... (Logging every 60s)
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-slate-200 font-semibold text-sm mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" />
                Vehicle Classification
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={vehicleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {vehicleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-slate-200 font-semibold text-sm mb-6 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Junction Load Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={congestionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="congestion" radius={[4, 4, 0, 0]} barSize={30}>
                    {congestionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.congestion > 80 ? '#f43f5e' : entry.congestion > 50 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
    </div>
  );
};

export default AnalyticsPanel;