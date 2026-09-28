/**
 * DSSME NATIVE CALCULATION ENGINE - Server API Handler & Vite Middleware
 * Handles /api/* endpoints for Native 16-Block Calculation, Benchmark, and Health.
 * Compliant with MASTER_PROMPT.md §45-§47.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { calculateCanonicalChart } from '../engine/chart/calculateChart.js';
import { solveEventsForChart } from '../engine/events/eventSolver.js';
import { runChofuBenchmark } from '../engine/benchmark/chofuBenchmark.js';
import { runDirectIndependentOracleKaalaTest } from '../../tests/unit/kaalaBala.test.js';
import { DSSMEEventInput } from '../engine/types.js';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data, null, 2));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/')) return false;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }

  try {
    // 1. GET /api/health
    if (url === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        status: 'HEALTHY',
        engine: 'DSSME Native 16-Block Engine',
        version: 'V1.4',
        mode: 'NATIVE',
        ayanamsa: 'Lahiri',
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    // 2. POST /api/dssme/calculate
    if (url === '/api/dssme/calculate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const input: DSSMEEventInput = {
        datetime: body.datetime || '2026-09-25 16:10:00',
        timezone: body.timezone || '+06:30',
        location: {
          latitude: typeof body.location?.latitude === 'number' ? body.location.latitude : 16.8661,
          longitude: typeof body.location?.longitude === 'number' ? body.location.longitude : 96.1951,
          city: body.location?.city || 'Yangon',
          country: body.location?.country || 'Myanmar',
        },
        ayanamsa: body.ayanamsa || 'Lahiri',
      };

      const chart = await calculateCanonicalChart(input);
      const events = await solveEventsForChart(input, chart);

      sendJson(res, 200, {
        success: true,
        data: chart,
        events,
        meta: {
          engine: 'DSSME',
          mode: 'NATIVE',
          version: 'V1.4',
          blocks: 16,
          ayanamsa: 'Lahiri',
          calculatedAt: new Date().toISOString(),
        },
        errors: [],
      });
      return true;
    }

    // 3. GET /api/benchmark
    if (url === '/api/benchmark' && req.method === 'GET') {
      const input: DSSMEEventInput = {
        datetime: '2026-09-16 18:50:00',
        timezone: 'Asia/Tokyo',
        location: {
          latitude: 35.6528,
          longitude: 139.5447,
          city: 'Chofu',
          country: 'Japan',
        },
        ayanamsa: 'Lahiri',
      };
      const chart = await calculateCanonicalChart(input);
      const report = runChofuBenchmark(chart);

      sendJson(res, 200, {
        success: true,
        data: report,
        meta: {
          fixture: 'PYJHORA_V2_001',
          source: 'pyjhora_oracle_v2_independent.json',
        },
        errors: [],
      });
      return true;
    }

    // 4. GET /api/pyjhora/kaala-verification
    if (url === '/api/pyjhora/kaala-verification' && req.method === 'GET') {
      const verification = await runDirectIndependentOracleKaalaTest();
      sendJson(res, 200, {
        success: verification.failedComponentAssertions === 0,
        data: verification,
      });
      return true;
    }

    // Unhandled API endpoint
    sendJson(res, 404, {
      success: false,
      error: `Endpoint not found: ${req.method} ${url}`,
    });
    return true;
  } catch (err: any) {
    sendJson(res, 500, {
      success: false,
      error: err.message || 'Internal server error in DSSME API.',
    });
    return true;
  }
}
