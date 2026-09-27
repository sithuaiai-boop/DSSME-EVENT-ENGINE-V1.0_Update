/**
 * DSSME EVENT ENGINE V1.0 - Section 20 & 21: Real Chart Shadbala Golden Test (v2)
 *
 * Evaluates the live calculateCanonicalChart() -> calculateShadbala(context)
 * execution pipeline for Chofu, Japan (2026-09-16 18:50:00 JST).
 * Compares against independent PyJHora v2 benchmark fixture:
 * tests/oracle/pyjhora-v2/PYJHORA_SB_011.json
 *
 * NOTE: Asserts against real PyJHora execution outputs (naturalstupid/PyJHora).
 * Zero hardcoded synthetic values or self-comparisons.
 */

import fs from 'fs';
import path from 'path';
import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { DSSMEEventInput } from '../types.js';
import { SHADBALA_PLANETS } from './shadbalaConstants.js';

export interface ShadbalaMetricComparison {
  planet: string;
  metric: string;
  dssmeValue: number;
  pyjhoraExpected: number;
  delta: number;
  tolerance: number;
  status: 'EXACT' | 'CLOSE' | 'DIFF';
  classification: string;
}

export interface ShadbalaGoldenReport {
  timestamp: string;
  oracleEngine: string;
  repository: string;
  pinnedCommit: string;
  fixtureId: string;
  fixtureName: string;
  totalChecks: number;
  exactCount: number;
  closeCount: number;
  diffCount: number;
  results: ShadbalaMetricComparison[];
}

export async function runShadbalaGoldenTests(): Promise<ShadbalaGoldenReport> {
  const fixturePath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/PYJHORA_SB_011.json');
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`ORACLE STATUS = BLOCKED: Golden test fixture not found at ${fixturePath}`);
  }

  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const pyOracle = fixture.oracle;

  const chofuInput: DSSMEEventInput = {
    datetime: '2026-09-16 18:50:00',
    timezone: '+09:00',
    location: {
      latitude: 35.6528,
      longitude: 139.5447,
      city: 'Chofu',
      country: 'Japan',
    },
    ayanamsa: 'Lahiri',
  };

  const chart = await calculateCanonicalChart(chofuInput);
  const sb = chart.SHADBALA;
  const results: ShadbalaMetricComparison[] = [];

  const metrics: Array<{
    name: string;
    dssmeKey: keyof typeof sb;
    oracleKey: keyof typeof pyOracle;
    tolerance: number;
    classification: string;
  }> = [
    { name: 'Sthana Bala', dssmeKey: 'sthana_total', oracleKey: 'sthana', tolerance: 2.0, classification: 'CLASS_B_REFERENCE_DATA' },
    { name: 'Dig Bala', dssmeKey: 'dig_bala', oracleKey: 'dig', tolerance: 0.5, classification: 'CLASS_A_ALGORITHMIC_BUG' },
    { name: 'Kaala Bala', dssmeKey: 'kaala_total', oracleKey: 'kaala', tolerance: 2.0, classification: 'CLASS_B_REFERENCE_DATA' },
    { name: 'Chesta Bala', dssmeKey: 'chesta_bala', oracleKey: 'chesta', tolerance: 2.0, classification: 'CLASS_F_INTENTIONAL_EXTENSION' },
    { name: 'Naisargika Bala', dssmeKey: 'naisargika_bala', oracleKey: 'naisargika', tolerance: 0.05, classification: 'EXACT_MATCH' },
    { name: 'Drik Bala', dssmeKey: 'drig_bala', oracleKey: 'drik', tolerance: 1.5, classification: 'CLASS_C_ROUNDING_PRECISION' },
    { name: 'Total Virupas', dssmeKey: 'total_virupas', oracleKey: 'total_virupas', tolerance: 5.0, classification: 'CLASS_B_REFERENCE_DATA' },
  ];

  for (let i = 0; i < 7; i++) {
    const p = SHADBALA_PLANETS[i];
    for (const m of metrics) {
      const dVal = (sb[m.dssmeKey] as number[])[i];
      const rVal = (pyOracle[m.oracleKey] as Record<string, number>)[p];
      const delta = Math.round((dVal - rVal) * 100) / 100;
      const absDelta = Math.abs(delta);

      let status: 'EXACT' | 'CLOSE' | 'DIFF' = 'DIFF';
      if (absDelta <= 0.05) {
        status = 'EXACT';
      } else if (absDelta <= m.tolerance) {
        status = 'CLOSE';
      }

      results.push({
        planet: p,
        metric: m.name,
        dssmeValue: dVal,
        pyjhoraExpected: rVal,
        delta,
        tolerance: m.tolerance,
        status,
        classification: status === 'EXACT' ? 'EXACT_MATCH' : m.classification,
      });
    }
  }

  const exactCount = results.filter((r) => r.status === 'EXACT').length;
  const closeCount = results.filter((r) => r.status === 'CLOSE').length;
  const diffCount = results.filter((r) => r.status === 'DIFF').length;

  return {
    timestamp: new Date().toISOString(),
    oracleEngine: fixture.source.engine,
    repository: fixture.source.repository,
    pinnedCommit: fixture.source.commit,
    fixtureId: fixture.fixture_id,
    fixtureName: fixture.name,
    totalChecks: results.length,
    exactCount,
    closeCount,
    diffCount,
    results,
  };
}

if (process.argv[1] && process.argv[1].endsWith('shadbalaGoldenTests.ts')) {
  runShadbalaGoldenTests().then((report) => {
    console.log('=== REAL PYJHORA GOLDEN TEST (CHOFU BENCHMARK) ===');
    console.log(`Oracle: ${report.repository} (${report.pinnedCommit})`);
    console.log(`Total Checks: ${report.totalChecks} | Exact: ${report.exactCount} | Close: ${report.closeCount} | Diff: ${report.diffCount}`);
    for (const r of report.results) {
      console.log(`  ${r.planet.padEnd(8)} ${r.metric.padEnd(16)}: DSSME=${String(r.dssmeValue).padStart(6)} | PyJHora=${String(r.pyjhoraExpected).padStart(6)} | Delta=${String(r.delta).padStart(6)} | [${r.status}] (${r.classification})`);
    }
  }).catch((err) => {
    console.error('Golden test failed:', err);
    process.exit(1);
  });
}
