import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Car, Video, Settings, Bell, Search, Menu, AlertTriangle } from 'lucide-react';
import TrafficCard from '../components/TrafficCard';
import AnalyticsPanel from '../components/AnalyticsPanel';
import SystemConfig from '../components/SystemConfig';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'config'
  const [trafficData, setTrafficData] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);

  // Poll Data Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/traffic-data');
        setTrafficData(response.data);
      } catch (err) {
        console.error("Connection Error:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000); // 2-second updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-10 transition-all">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartSolapur</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Command Center" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem 
            icon={<Car />} 
            label="Traffic Control" 
            active={currentView === 'config'} 
            onClick={() => setCurrentView('config')}
          />
          <NavItem icon={<Video />} label="Surveillance" />
          <NavItem 
            icon={<Settings />} 
            label="System Config" 
            active={currentView === 'config'} 
            onClick={() => setCurrentView('config')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2">System Status</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-sm font-medium text-emerald-400">Online</span>
              </div>
              <p className="text-[10px] text-slate-500">v3.1.0 • Stable</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 relative min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
               <span className="lg:hidden"><Menu className="w-5 h-5"/></span>
               Traffic Flow Automation
            </h1>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-sm text-slate-400 focus-within:border-indigo-500 transition-colors">
                   <Search className="w-4 h-4" />
                   <input type="text" placeholder="Search junction..." className="bg-transparent outline-none placeholder:text-slate-600 w-48" />
                </div>
                
                {/* Alert Notification */}
                <div className="relative">
                    <button 
                        onClick={() => setAlertOpen(!alertOpen)}
                        className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-400" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950 animate-ping"></span>
                    </button>
                    
                    {alertOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-3 z-50 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Notifications</h4>
                            <div className="flex items-start gap-2 p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-rose-200 font-semibold">High Congestion</p>
                                    <p className="text-[10px] text-rose-300">Market Yard density > 90%.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-800 shadow-lg">
                    AD
                </div>
            </div>
        </header>

        {/* Dynamic Dashboard Content */}
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            
            {currentView === 'dashboard' ? (
                <>
                    {/* 1. Traffic Automation Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-200">Real-Time Junction Status</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    LIVE FEED
                                </span>
                            </div>
                        </div>
                        <TrafficCard trafficData={trafficData} />
                    </section>

                    {/* 2. Analytics Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-slate-200 mb-4">Traffic Analytics & Insights</h2>
                        <AnalyticsPanel trafficData={trafficData} />
                    </section>
                </>
            ) : (
                /* 3. System Config View */
                <SystemConfig cityMeta={trafficData?.city_meta} />
            )}

        </div>
      </main>
    </div>
  );
};

// Nav Item Component with onClick
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
  >
    {React.cloneElement(icon, { size: 18 })}
    {label}
  </button>
);

export default Dashboard;
