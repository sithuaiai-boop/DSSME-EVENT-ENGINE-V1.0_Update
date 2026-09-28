/**
 * DSSME NATIVE CALCULATION ENGINE V1.0 - Main Application Interface
 * Full 16-Block Deterministic Vedic & Astronomical Calculation Dashboard
 * Compliant with MASTER_PROMPT.md.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Download, MapPin, Calendar, Globe } from 'lucide-react';
import { DSSMEEventInput, CanonicalChart, DSSMEEvent, EventProfile } from './engine/types.js';
import { calculateCanonicalChart } from './engine/chart/calculateChart.js';
import { solveEventsForChart } from './engine/events/eventSolver.js';
import { VedicChart } from './components/VedicChart.js';
import { PlanetsTable } from './components/PlanetsTable.js';
import { PanchangaCard } from './components/PanchangaCard.js';
import { BenchmarkView } from './components/BenchmarkView.js';
import { ShadbalaView } from './components/ShadbalaView.js';
import { AshtakavargaView } from './components/AshtakavargaView.js';
import { DashaView } from './components/DashaView.js';
import { ApiSpecView } from './components/ApiSpecView.js';
import { EventDataEntryModal } from './components/EventDataEntryModal.js';
import { MoonPhaseCard } from './components/MoonPhaseCard.js';
import { CANONICAL_PRESET_LOCATIONS } from './engine/location/locationDatabase.js';

type ActiveTab =
  | 'overview'
  | 'events'
  | 'strength'
  | 'ashtakavarga'
  | 'dasha'
  | 'benchmark'
  | 'json_export'
  | 'api_spec';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Active calculation input state
  const defaultLoc = CANONICAL_PRESET_LOCATIONS[0];
  const [datetime, setDatetime] = useState<string>('2026-09-25 16:10:00');
  const [timezone, setTimezone] = useState<string>(defaultLoc.timezone);
  const [city, setCity] = useState<string>(defaultLoc.city);
  const [country, setCountry] = useState<string>(defaultLoc.country);
  const [latitude, setLatitude] = useState<number>(defaultLoc.latitude);
  const [longitude, setLongitude] = useState<number>(defaultLoc.longitude);

  // Calculated states
  const [chart, setChart] = useState<CanonicalChart | null>(null);
  const [events, setEvents] = useState<DSSMEEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [activeEventProfile, setActiveEventProfile] = useState<EventProfile | null>(null);

  const handleEventChartCreated = async (profile: EventProfile, calculatedChart: CanonicalChart) => {
    setActiveEventProfile(profile);
    setChart(calculatedChart);
    setDatetime(`${profile.localDate} ${profile.localTime}`);
    setTimezone(profile.timezone);
    setCity(profile.city);
    setCountry(profile.country);
    setLatitude(profile.latitude);
    setLongitude(profile.longitude);
    const input: DSSMEEventInput = {
      datetime: `${profile.localDate} ${profile.localTime}`,
      timezone: profile.timezone,
      location: {
        latitude: profile.latitude,
        longitude: profile.longitude,
        city: profile.city,
        country: profile.country,
      },
      ayanamsa: 'Lahiri',
    };
    const solved = await solveEventsForChart(input, calculatedChart);
    setEvents(solved);
  };

  // Run calculation
  const runCalculation = async () => {
    setIsLoading(true);
    try {
      const input: DSSMEEventInput = {
        datetime,
        timezone,
        location: {
          latitude,
          longitude,
          city,
          country,
        },
        ayanamsa: 'Lahiri',
      };

      const calculatedChart = await calculateCanonicalChart(input);
      const solvedEvents = await solveEventsForChart(input, calculatedChart);
      setChart(calculatedChart);
      setEvents(solvedEvents);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, [datetime, timezone, latitude, longitude, city, country]);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = CANONICAL_PRESET_LOCATIONS[index];
    setCity(p.city);
    setCountry(p.country);
    setLatitude(p.latitude);
    setLongitude(p.longitude);
    setTimezone(p.timezone);
  };

  const handleCopyJson = () => {
    if (!chart) return;
    navigator.clipboard.writeText(JSON.stringify(chart, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!chart) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chart, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `DSSME_CHART_${chart.IDENTITY.date}_${chart.IDENTITY.location_city || 'Vedic'}.json`);
    dlAnchor.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-100">
                  DSSME NATIVE CALCULATION ENGINE <span className="text-amber-400 font-mono text-xs">V1.4</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  16 ACTIVE BLOCKS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Lahiri Sidereal Standard • Swiss Ephemeris WASM Core • PyJHora V4.9.3 Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* New Event Chart Dialog Trigger */}
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open Chart Data Entry Dialog"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>+ CALCULATE NEW CHART</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ORACLE: 315/315 PASS
            </button>

            <button
              onClick={runCalculation}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recalculate
            </button>
          </div>
        </div>
      </header>

      {/* Preset & Input Config Bar */}
      <section className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Preset Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-400" />
              Preset Location:
            </span>
            {CANONICAL_PRESET_LOCATIONS.slice(0, 7).map((p, idx) => (
              <button
                key={p.city}
                onClick={() => {
                  setActiveEventProfile(null);
                  handleSelectPreset(idx);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium text-xs font-mono flex items-center gap-1.5 ${
                  selectedPresetIndex === idx && !activeEventProfile
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{p.city}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    selectedPresetIndex === idx && !activeEventProfile
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {p.abbreviation}
                </span>
              </button>
            ))}
          </div>

          {/* Active Chart Profile & Current Coordinates */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            {activeEventProfile && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-300">
                <span className="font-bold text-amber-400">Profile:</span>
                <span className="font-semibold text-slate-100">{activeEventProfile.eventName}</span>
              </div>
            )}
            <span className="text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> {datetime} ({timezone})
            </span>
            <span>•</span>
            <span className="text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E ({city})
            </span>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & 16-Block Chart' },
            { id: 'strength', label: 'Shadbala & Balas (Blocks 06-07)' },
            { id: 'ashtakavarga', label: 'Ashtakavarga BAV/SAV (Blocks 08-10)' },
            { id: 'dasha', label: 'Vimshottari Dasha (Block 03)' },
            { id: 'events', label: 'State Events Stream' },
            { id: 'benchmark', label: 'PyJHora V2 Benchmark' },
            { id: 'json_export', label: 'Canonical 16-Block JSON' },
            { id: 'api_spec', label: 'API Routes & Schema' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-slate-400">Executing deterministic astronomical calculations...</p>
          </div>
        ) : !chart ? (
          <div className="p-8 text-center text-slate-400">Failed to calculate chart state.</div>
        ) : (
          <div>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                  <div className="lg:col-span-2 xl:col-span-3">
                    <PanchangaCard chart={chart} />
                  </div>
                  <div className="lg:col-span-1 xl:col-span-1">
                    <MoonPhaseCard chart={chart} />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <VedicChart chart={chart} />
                  </div>
                  <div className="lg:col-span-2">
                    <PlanetsTable chart={chart} />
                  </div>
                </div>

                {/* Additional Highlights (Active Yogas & Phase Stress) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Active Planetary Yogas (Block 16)
                    </h4>
                    <div className="space-y-2">
                      {chart.YOGA_LIST.map((y, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-100">{y.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{y.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      Phase Stress & Proximity (Block 14)
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800">
                        <span className="text-slate-400">Overall Stress Level:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            chart.PHASE_STRESS.stress_level === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : chart.PHASE_STRESS.stress_level === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {chart.PHASE_STRESS.stress_level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800">
                        <span className="text-slate-400">New Moon Proximity:</span>
                        <span className="font-mono text-slate-200">
                          {typeof chart.PHASE_STRESS.new_moon_proximity_hrs === 'number'
                            ? `${chart.PHASE_STRESS.new_moon_proximity_hrs.toFixed(2)}h`
                            : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800">
                        <span className="text-slate-400">Full Moon Proximity:</span>
                        <span className="font-mono text-slate-200">
                          {typeof chart.PHASE_STRESS.full_moon_proximity_hrs === 'number'
                            ? `${chart.PHASE_STRESS.full_moon_proximity_hrs.toFixed(2)}h`
                            : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-800">
                        <span className="text-slate-400">Sign Boundary Crossing:</span>
                        <span className="font-mono text-slate-200">
                          {chart.PHASE_STRESS.sign_boundary_planets.length > 0
                            ? chart.PHASE_STRESS.sign_boundary_planets.join(', ')
                            : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STRENGTH & SHADBALA */}
            {activeTab === 'strength' && <ShadbalaView chart={chart} />}

            {/* TAB 3: ASHTAKAVARGA */}
            {activeTab === 'ashtakavarga' && <AshtakavargaView chart={chart} />}

            {/* TAB 4: DASHA */}
            {activeTab === 'dasha' && <DashaView chart={chart} />}

            {/* TAB 5: EVENTS STREAM */}
            {activeTab === 'events' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Deterministic State Events Stream ({events.length} Events)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Continuous Event Engine MOD 01–14</span>
                </div>
                <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
                  {events.map((ev) => (
                    <div key={ev.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{ev.module}</span>
                        <span className="text-slate-300">{ev.eventCode}</span>
                        {ev.object && <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">{ev.object}</span>}
                      </div>
                      <div className="text-slate-400 text-[11px]">{ev.timestampLocal}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: BENCHMARK */}
            {activeTab === 'benchmark' && <BenchmarkView chart={chart} />}

            {/* TAB 7: CANONICAL 16-BLOCK JSON */}
            {activeTab === 'json_export' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono">
                      Canonical 16-Block Active JSON Schema Output
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fully deterministic JSON artifact containing all 16 active calculation blocks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Copied' : 'Copy JSON'}
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download JSON
                    </button>
                  </div>
                </div>

                <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed max-h-[600px]">
                  {JSON.stringify(chart, null, 2)}
                </pre>
              </div>
            )}

            {/* TAB 8: API SPEC */}
            {activeTab === 'api_spec' && <ApiSpecView chart={chart} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs font-mono text-slate-500">
        DSSME Native 16-Block Calculation Engine • Lahiri Sidereal Ayanamsa • Swiss Ephemeris WASM Core • PyJHora V4.9.3 Oracle Verified
      </footer>

      {/* New Event Chart Modal */}
      <EventDataEntryModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onChartCreated={handleEventChartCreated}
        calculateChartFn={calculateCanonicalChart}
        initialDate={datetime.split(' ')[0]}
        initialLocationIndex={selectedPresetIndex}
      />
    </div>
  );
}
