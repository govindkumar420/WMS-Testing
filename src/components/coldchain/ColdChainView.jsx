import React, { useContext, useState } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Activity,
  SlidersHorizontal,
  Snowflake,
  CheckCircle2,
  Clock3,
  X,
  CircleAlert
} from 'lucide-react';

export default function ColdChainView() {
  const { coldRooms, setColdRoomTempOverride } = useContext(WmsDataContext);
  const [activeAdjustId, setActiveAdjustId] = useState(null);
  const [draftTemps, setDraftTemps] = useState({});

  const alerts = coldRooms.filter(room => room.currentTemp < room.minTemp || room.currentTemp > room.maxTemp);
  const stableRooms = coldRooms.length - alerts.length;
  const averageHumidity = coldRooms.length
    ? Math.round(coldRooms.reduce((total, room) => total + Number(room.currentHumidity || 0), 0) / coldRooms.length)
    : 0;

  const beginAdjustment = (room) => {
    setDraftTemps(previous => ({ ...previous, [room.id]: room.currentTemp }));
    setActiveAdjustId(room.id);
  };

  const cancelAdjustment = () => setActiveAdjustId(null);

  const applyAdjustment = (room) => {
    setColdRoomTempOverride(room.id, draftTemps[room.id] ?? room.currentTemp);
    setActiveAdjustId(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end dark:border-zinc-800">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Facility operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cold chain control</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Temperature and humidity status across the facility.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 sm:self-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <Clock3 className="h-4 w-4 text-teal-600" />
          Telemetry control
        </div>
      </header>

      <section aria-label="Cold chain summary" className="grid grid-cols-2 border-y border-zinc-200 sm:grid-cols-4 dark:border-zinc-800">
        {[
          { label: 'Rooms configured', value: coldRooms.length, detail: 'With telemetry records', icon: Activity, tone: 'text-teal-700 dark:text-teal-400' },
          { label: 'Within range', value: stableRooms, detail: 'Operating normally', icon: CheckCircle2, tone: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Active alerts', value: alerts.length, detail: alerts.length ? 'Needs attention' : 'No exceptions', icon: CircleAlert, tone: alerts.length ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400' },
          { label: 'Average humidity', value: `${averageHumidity}%`, detail: 'Relative humidity', icon: Droplets, tone: 'text-sky-700 dark:text-sky-400' }
        ].map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0 border-b border-r border-zinc-200 px-4 py-4 first:pl-0 sm:border-b-0 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <Icon className={`h-4 w-4 ${metric.tone}`} /> {metric.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{metric.value}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{metric.detail}</div>
            </div>
          );
        })}
      </section>

      <div>
        <section className="min-w-0" aria-labelledby="room-status-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="room-status-heading" className="text-base font-bold text-zinc-900 dark:text-zinc-100">Room status</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Current readings against each room’s safe operating range.</p>
            </div>
            <span className="shrink-0 text-xs text-zinc-500">{coldRooms.length} monitored</span>
          </div>

          <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {coldRooms.map(room => {
              const isAlert = room.currentTemp < room.minTemp || room.currentTemp > room.maxTemp;
              const isAdjusting = activeAdjustId === room.id;
              const Icon = room.name.toLowerCase().includes('freezer') ? Snowflake : Thermometer;

              return (
                <article key={room.id} className="py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${isAlert ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{room.name}</h3>
                        <p className="mt-0.5 text-[11px] text-zinc-500">Sensor {room.id} <span className="px-1 text-zinc-300">/</span> Safe range {room.minTemp} to {room.maxTemp}°C</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end sm:gap-8">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Temperature</div>
                        <div className={`mt-0.5 font-mono text-xl font-semibold tabular-nums ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {Number(room.currentTemp).toFixed(1)}<span className="ml-0.5 text-sm">°C</span>
                        </div>
                      </div>
                      <div className="min-w-[74px]">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Humidity</div>
                        <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                          <Droplets className="h-3.5 w-3.5 text-sky-600" /> {room.currentHumidity}% RH
                        </div>
                      </div>
                      <span className={`inline-flex min-w-[88px] items-center justify-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isAlert ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                        {isAlert ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {isAlert ? 'Alert' : 'In range'}
                      </span>
                      <button
                        type="button"
                        onClick={() => isAdjusting ? cancelAdjustment() : beginAdjustment(room)}
                        aria-label={`${isAdjusting ? 'Close' : 'Adjust'} ${room.name} temperature`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        title={isAdjusting ? 'Close adjustment' : 'Adjust temperature'}
                      >
                        {isAdjusting ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isAlert && (
                    <div className="mt-3 flex items-center gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Temperature is outside the safe range of {room.minTemp} to {room.maxTemp}°C.
                    </div>
                  )}

                  {isAdjusting && (
                    <div className="mt-4 border-l-2 border-teal-500 bg-zinc-50 p-4 dark:bg-zinc-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor={`temp-${room.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Simulated sensor reading</label>
                        <span className="font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(draftTemps[room.id] ?? room.currentTemp).toFixed(1)}°C</span>
                      </div>
                      <input
                        id={`temp-${room.id}`}
                        type="range"
                        min={room.minTemp - 3}
                        max={room.maxTemp + 5}
                        step="0.5"
                        value={draftTemps[room.id] ?? room.currentTemp}
                        onChange={event => setDraftTemps(previous => ({ ...previous, [room.id]: Number(event.target.value) }))}
                        aria-label={`Set simulated reading for ${room.name}`}
                        className="mt-3 h-2 w-full cursor-pointer accent-teal-600"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                        <span>Below range</span><span>Safe: {room.minTemp} to {room.maxTemp}°C</span><span>Above range</span>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={cancelAdjustment} className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
                        <button type="button" onClick={() => applyAdjustment(room)} className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800">Apply reading</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {coldRooms.length === 0 && (
              <div className="py-12 text-center text-sm text-zinc-500">No cold-room sensors are configured.</div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
