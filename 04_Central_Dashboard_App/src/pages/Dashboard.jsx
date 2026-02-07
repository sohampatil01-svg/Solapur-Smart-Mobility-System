import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Settings, Map, Bell, ParkingCircle, Flame } from 'lucide-react';

import LiveGrid from '../components/LiveGrid'; 
import AnalyticsPanel from '../components/AnalyticsPanel';
import SystemConfig from '../components/SystemConfig';
import VehicleTable from '../components/VehicleTable';
import MapView from '../components/MapView'; 
import ParkingView from '../components/ParkingView';
import HeatmapView from '../components/HeatmapView';
import RouteWidget from '../components/RouteWidget';

const Dashboard = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [loading, setLoading] = useState(true);

  // Robust Polling Mechanism
  useEffect(() => {
    let timer;
    const fetchData = async () => {
      try {
        const [trafficRes, parkingRes] = await Promise.all([
            axios.get('http://localhost:5001/traffic-data'),
            axios.get('http://localhost:5002/parking-data')
        ]);
        
        setTrafficData({
            ...trafficRes.data,
            parking: parkingRes.data
        });
        setLoading(false);
      } catch (err) {
        console.error("Link Error:", err);
      } finally {
        // Schedule next call ONLY after current one finishes
        timer = setTimeout(fetchData, 3000);
      }
    };

    fetchData(); 
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-mono animate-pulse">Establishing Secure Link...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="fixed top-0 left-0 h-full w-20 lg:w-64 bg-slate-900 border-r border-slate-800 z-50 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20"></div>
            <h1 className="hidden lg:block text-xl font-bold tracking-tight text-white">
                SMC<span className="text-indigo-400">.ai</span>
            </h1>
        </div>
        
        <nav className="space-y-2 px-3">
            <NavItem 
                icon={<LayoutDashboard />} 
                label="Command Center" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
                icon={<Map />} 
                label="Map View" 
                active={currentView === 'map'}
                onClick={() => setCurrentView('map')}
            />
            <NavItem 
                icon={<Flame />} 
                label="Heatmap" 
                active={currentView === 'heatmap'} 
                onClick={() => setCurrentView('heatmap')}
            />
            <NavItem 
                icon={<ParkingCircle />} 
                label="Parking Control" 
                active={currentView === 'parking'}
                onClick={() => setCurrentView('parking')}
            />
            <NavItem 
                icon={<Settings />} 
                label="System Config" 
                active={currentView === 'config'} 
                onClick={() => setCurrentView('config')}
            />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pl-20 lg:pl-64 min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-500">SYSTEM STATUS:</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    OPERATIONAL
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-800 shadow-lg">
                    AD
                </div>
            </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            
            {currentView === 'dashboard' ? (
                <>
                    {/* 1. CCTV Live Grid with Traffic Lights */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-200">Live Traffic Control</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-indigo-400">AUTOMATION ACTIVE</span>
                            </div>
                        </div>
                        <div className="w-full">
                            <LiveGrid trafficData={trafficData} />
                        </div>
                    </section>

                    {/* 2. Detailed Data Table */}
                    <section>
                         <VehicleTable trafficData={trafficData} />
                    </section>

                    {/* 3. Charts & Insights */}
                    <section>
                        <h2 className="text-lg font-semibold text-slate-200 mb-4 mt-8">City-Wide Analytics</h2>
                        <AnalyticsPanel trafficData={trafficData} />
                    </section>
                </>
            ) : currentView === 'map' ? (
                /* Map View */
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Real-Time City Map</h2>
                        <span className="text-xs font-mono text-slate-500">GPS SYNC ACTIVE</span>
                    </div>
                    <MapView trafficData={trafficData} />
                </section>
            ) : currentView === 'heatmap' ? (
                /* Heatmap View */
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">City Congestion Heatmap</h2>
                        <span className="text-xs font-mono text-indigo-400">AREA OCCUPANCY ANALYSIS</span>
                    </div>
                    <HeatmapView trafficData={trafficData} />
                </section>
            ) : currentView === 'parking' ? (
                /* Parking View */
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Smart Parking Management</h2>
                        <span className="text-xs font-mono text-slate-500">IOT SENSORS ONLINE</span>
                    </div>
                    <ParkingView parkingData={trafficData?.parking} />
                </section>
            ) : (
                /* Config View */
                <SystemConfig cityMeta={trafficData?.meta} />
            )}

        </div>
      </main>
    </div>
  );
};

// Nav Item Component
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
  >
    {React.cloneElement(icon, { size: 18 })}
    <span className="hidden lg:block">{label}</span>
  </button>
);

export default Dashboard;
