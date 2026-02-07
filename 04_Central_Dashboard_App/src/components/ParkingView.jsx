import React, { useState } from 'react';
import axios from 'axios';
import { Car, Info, CheckCircle, AlertCircle } from 'lucide-react';

const ParkingView = ({ parkingData }) => {
  const [selectedLot, setSelectedLot] = useState(Object.keys(parkingData || {})[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!parkingData) return null;

  const currentLot = parkingData[selectedLot];

  const handleReserve = async (slotId) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5002/reserve-parking', {
        lot_id: selectedLot,
        slot_id: slotId
      });
      setMessage({ type: 'success', text: res.data.message });
      // In a real app, the parent would poll or we'd use a websocket
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Reservation failed" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lot Selector & Summary */}
        <div className="lg:w-1/3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-slate-400 text-xs font-mono mb-4 uppercase tracking-wider">Select Parking Zone</h3>
            <div className="space-y-2">
              {Object.keys(parkingData).map(lotId => (
                <button
                  key={lotId}
                  onClick={() => setSelectedLot(lotId)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedLot === lotId 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold">{lotId.replace(/_/g, ' ')}</div>
                  <div className="text-xs opacity-70">{parkingData[lotId].location}</div>
                </button>
              ))}
            </div>
          </div>

          {currentLot && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider">Zone Intelligence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Occupancy</div>
                  <div className="text-xl font-bold text-white">
                    {Math.round((currentLot.occupied / currentLot.total_slots) * 100)}%
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Hourly Rate</div>
                  <div className="text-xl font-bold text-indigo-400">₹{currentLot.hourly_rate}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                <Info size={14} className="text-indigo-400" />
                Digital reservations active for this zone.
              </div>
            </div>
          )}
        </div>

        {/* Slot Grid */}
        <div className="lg:w-2/3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Car className="text-indigo-400" />
              Real-Time Slot Map
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                <span className="text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
                <span className="text-slate-400">Occupied</span>
              </div>
            </div>
          </div>

          {message && (
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {currentLot.slots.map(slot => (
              <button
                key={slot.id}
                disabled={slot.status === 'occupied' || loading}
                onClick={() => handleReserve(slot.id)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200 group relative ${
                  slot.status === 'occupied' 
                    ? 'bg-slate-800 border border-slate-700 opacity-60 cursor-not-allowed' 
                    : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
              >
                <Car size={16} className={slot.status === 'occupied' ? 'text-slate-600' : 'text-emerald-400'} />
                <span className={`text-[10px] mt-1 font-mono font-bold ${slot.status === 'occupied' ? 'text-slate-600' : 'text-emerald-500/70'}`}>
                  {slot.id < 10 ? `0${slot.id}` : slot.id}
                </span>
                
                {slot.status === 'available' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-indigo-600 rounded-lg transition-opacity duration-200">
                    <span className="text-[10px] font-bold text-white">RESERVE</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-slate-500 text-sm">
            <p>Select an available slot to simulate a citizen reservation.</p>
            <p className="font-mono">{currentLot.total_slots - currentLot.occupied} / {currentLot.total_slots} FREE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingView;
