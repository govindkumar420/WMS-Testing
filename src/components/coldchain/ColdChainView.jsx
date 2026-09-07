import React, { useContext, useState } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Activity,
  Sliders,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export default function ColdChainView() {
  const { coldRooms, setColdRoomTempOverride } = useContext(WmsDataContext);
  const [activeAdjustId, setActiveAdjustId] = useState(null);

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Cold Chain Telemetry</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Real-time cold room tracking, cooling unit states, and humidity indicators.</p>
      </div>

      {/* Main cold room grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coldRooms.map(room => {
          const isAlert = room.status === 'Alert';
          const isAdjusting = activeAdjustId === room.id;

          // Generate simulated telemetry history sparkline
          const points = [2.1, 1.8, 1.9, 2.2, 1.7, 1.8, 2.0, room.currentTemp];
          const minVal = room.minTemp - 1;
          const maxVal = room.maxTemp + 2;
          const height = 40;
          const width = 180;
          
          const svgPoints = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((p - minVal) / (maxVal - minVal)) * height;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div
              key={room.id}
              className={`border rounded-xl shadow-sm overflow-hidden p-6 transition-all duration-300 flex flex-col justify-between h-[320px] ${
                isAlert
                  ? 'border-rose-300 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 animate-pulse-subtle'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f]'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{room.name}</h3>
                    <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">Telemetry unit ID: CR-TEL-{room.id}</span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                    isAlert
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                  }`}>
                    {room.status}
                  </span>
                </div>

                {/* Telemetry numbers grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* Temp */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl p-3 border border-zinc-150 dark:border-zinc-800 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isAlert ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">Temperature</span>
                      <span className={`text-xl font-bold font-mono tracking-tight ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                        {room.currentTemp.toFixed(1)}°C
                      </span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl p-3 border border-zinc-150 dark:border-zinc-800 flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">Humidity</span>
                      <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white tracking-tight">
                        {room.currentHumidity}% RH
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sparkline & Controls */}
              <div className="flex flex-col gap-4 mt-4">
                
                {/* Visual Alert Notification */}
                {isAlert && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded border border-rose-100 dark:border-rose-900/30">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Warning: Temperature exceeds safe bound of {room.minTemp}-{room.maxTemp}°C!</span>
                  </div>
                )}

                {/* Adjuster slider overlay */}
                {isAdjusting ? (
                  <div className="space-y-1.5 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                      <span>Simulate OTR Excursion Override</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{room.currentTemp.toFixed(1)}°C</span>
                    </div>
                    
                    <input
                      type="range"
                      min={room.minTemp - 3}
                      max={room.maxTemp + 5}
                      step="0.5"
                      value={room.currentTemp}
                      onChange={(e) => setColdRoomTempOverride(room.id, e.target.value)}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400"
                    />

                    <div className="flex justify-between items-center text-[9px] text-zinc-400 pt-1">
                      <span>Min Safe: {room.minTemp}°C</span>
                      <button
                        onClick={() => setActiveAdjustId(null)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Confirm Override
                      </button>
                      <span>Max Safe: {room.maxTemp}°C</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/30 rounded-lg p-2.5 border border-zinc-150 dark:border-zinc-800">
                    
                    {/* SVG Sparkline */}
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-zinc-400" />
                      <svg className="overflow-visible" width={100} height={20}>
                        <polyline
                          fill="none"
                          stroke={isAlert ? '#ef4444' : '#10b981'}
                          strokeWidth="1.5"
                          points={svgPoints.split(' ').map(p => {
                            const [x, y] = p.split(',');
                            return `${Number(x) / 1.8},${Number(y) / 2}`;
                          }).join(' ')}
                        />
                      </svg>
                    </div>

                    {/* Adjust Button */}
                    <button
                      onClick={() => setActiveAdjustId(room.id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold hover:underline"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>Adjust Temp</span>
                    </button>

                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
