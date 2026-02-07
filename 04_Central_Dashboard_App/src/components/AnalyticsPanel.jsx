import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Activity, Car, Truck, Bus } from 'lucide-react';

const AnalyticsPanel = ({ trafficData }) => {
  const [activeTab, setActiveTab] = useState('realtime'); 
  const [realtimeHistory, setRealtimeHistory] = useState([]);

  useEffect(() => {
    if (trafficData) {
        const currentHour = trafficData.city_meta?.simulated_hour;
        const junctions = Object.values(trafficData.junctions || {});
        const avgDensity = junctions.reduce((acc, curr) => acc + curr.density, 0) / (junctions.length || 1);

        setRealtimeHistory(prev => {
            const newData = [...prev, { time: `${currentHour}:00`, density: Math.round(avgDensity) }];
            if (newData.length > 15) newData.shift();
            return newData;
        });
    }
  }, [trafficData]);

  if (!trafficData) return null;

  // --- 1. AGGREGATE VEHICLE DATA ---
  let totalCars = 0;
  let totalBuses = 0;
  let totalTrucks = 0;
  let totalBikes = 0;

  Object.values(trafficData.junctions).forEach(j => {
      if (j.vehicles) {
          totalCars += j.vehicles.car || 0;
          totalBuses += j.vehicles.bus || 0;
          totalTrucks += j.vehicles.truck || 0;
          totalBikes += j.vehicles.motorcycle || 0;
      }
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

  return (
    <div className="mt-6 animate-in fade-in duration-700">
        
        {/* BIG NUMBERS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-black/20">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Car className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Traffic</p>
                    <h4 className="text-2xl font-bold text-slate-100">{totalVehicles} <span className="text-sm text-slate-600 font-normal">vehs</span></h4>
                </div>
            </div>

             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-black/20">
                <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
                    <Truck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Heavy Load</p>
                    <h4 className="text-2xl font-bold text-slate-100">{heavyVehicles} <span className="text-sm text-slate-600 font-normal">vehs</span></h4>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-black/20">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg Flow</p>
                    <h4 className="text-2xl font-bold text-slate-100">
                        {realtimeHistory.length > 0 ? realtimeHistory[realtimeHistory.length-1].density : 0}%
                    </h4>
                </div>
            </div>

             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-black/20">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Confidence</p>
                    <h4 className="text-2xl font-bold text-slate-100">92%</h4>
                </div>
            </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Vehicle Distribution (Pie) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Car className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-slate-200 font-semibold">Vehicle Classification</h3>
                        <p className="text-xs text-slate-500">Real-time breakdown by type</p>
                    </div>
                </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {totalVehicles > 0 ? (
                    <PieChart>
                        <Pie
                            data={vehicleDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {vehicleDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                        Waiting for traffic...
                    </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Congestion Zones Comparison (Bar) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-slate-200 font-semibold">Junction Density Load</h3>
                    <p className="text-xs text-slate-500">Live congestion levels per lane</p>
                </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={congestionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="zone" stroke="#64748b" fontSize={11} tickLine={false} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Bar dataKey="congestion" radius={[4, 4, 0, 0]} barSize={40}>
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
