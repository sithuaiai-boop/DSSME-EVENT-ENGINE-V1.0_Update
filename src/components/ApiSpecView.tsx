/**
 * DSSME NATIVE CALCULATION ENGINE - API Specification & Endpoint Tester
 * Clean interface documenting and testing server routes per MASTER_PROMPT.md §45-§47.
 */

import React, { useState } from 'react';
import { Play, Check, AlertCircle, Copy } from 'lucide-react';
import { CanonicalChart } from '../engine/types.js';

interface ApiSpecViewProps {
  chart: CanonicalChart;
}

export const ApiSpecView: React.FC<ApiSpecViewProps> = ({ chart }) => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('POST /api/dssme/calculate');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const endpoints = [
    { method: 'GET', path: '/api/health', desc: 'Process & engine health check, mode, ayanamsa, and version' },
    { method: 'POST', path: '/api/dssme/calculate', desc: 'Calculates full canonical 16-block Vedic chart state natively' },
    { method: 'GET', path: '/api/benchmark', desc: 'Executes benchmark validation against PyJHora V2 oracle' },
    { method: 'GET', path: '/api/pyjhora/kaala-verification', desc: 'Direct 315-component Kaala Bala oracle verification' },
  ];

  const handleTestApi = async (endpoint: string) => {
    setIsRunning(true);
    const [method, path] = endpoint.split(' ');

    try {
      let body: string | undefined = undefined;
      if (method === 'POST') {
        body = JSON.stringify({
          datetime: `${chart.IDENTITY.date} ${chart.IDENTITY.time}`,
          timezone: chart.IDENTITY.timezone || '+06:30',
          location: {
            latitude: parseFloat(chart.IDENTITY.latitude) || 16.8661,
            longitude: parseFloat(chart.IDENTITY.longitude) || 96.1951,
            city: chart.IDENTITY.location_city || 'Yangon',
            country: chart.IDENTITY.location_country || 'Myanmar',
          },
          ayanamsa: 'Lahiri',
        });
      }

      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message || 'Fetch failed' }, null, 2));
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          DSSME V1.4 Server API Specification & Vercel Endpoints
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Direct HTTP endpoints powering the Native 16-Block Calculation Engine.
        </p>
      </div>

      {/* Grid: Endpoints + Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Available Endpoints
          </h3>
          <div className="space-y-2">
            {endpoints.map((ep) => {
              const fullKey = `${ep.method} ${ep.path}`;
              const isSelected = activeEndpoint === fullKey;
              return (
                <div
                  key={fullKey}
                  onClick={() => setActiveEndpoint(fullKey)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className={isSelected ? 'text-amber-300' : 'text-slate-200'}>{ep.path}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">{ep.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Test Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Live API Console
            </h3>
            <button
              onClick={() => handleTestApi(activeEndpoint)}
              disabled={isRunning}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? 'Executing...' : 'Send Request'}
            </button>
          </div>

          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Endpoint:</span>
            <span className="text-amber-400 font-bold">{activeEndpoint}</span>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px] relative">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-mono text-slate-500">Response Payload</span>
              {apiResponse && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <pre className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed">
              {apiResponse || '// Click "Send Request" to test endpoint...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
