/**
 * DSSME EVENT ENGINE V1.0 - Validation & Benchmark Runner
 * Compares real-time DSSME engine calculations directly against
 * the independent PyJHora V2 oracle fixture (PYJHORA_V2_001 Chofu benchmark).
 */

import { BenchmarkResult, CanonicalChart } from '../types.js';
import oracleData from '../../../tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json';

export interface BenchmarkSuiteReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  warnChecks: number;
  failedChecks: number;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  results: BenchmarkResult[];
}

export function runChofuBenchmark(dssmeChart: CanonicalChart): BenchmarkSuiteReport {
  const results: BenchmarkResult[] = [];
  const fixture = oracleData.fixtures[0]; // PYJHORA_V2_001

  const addCheck = (
    category: string,
    metric: string,
    dVal: any,
    refVal: any,
    tol: number,
    note?: string
  ) => {
    let diff = 0;
    let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';

    if (typeof dVal === 'number' && typeof refVal === 'number') {
      diff = Math.abs(Math.round((dVal - refVal) * 100) / 100);
      if (diff > tol) {
        status = diff <= tol * 2 ? 'WARN' : 'FAIL';
      }
    } else {
      const dStr = String(dVal).trim().toLowerCase();
      const rStr = String(refVal).trim().toLowerCase();
      diff = dStr === rStr ? 0 : 1;
      status = diff === 0 ? 'PASS' : 'FAIL';
    }

    results.push({
      category,
      metric,
      dssme: dVal,
      reference: refVal,
      absoluteDifference: diff,
      status,
      tolerance: tol,
      note,
    });
  };

  // 1. Identity & Astronomy Checks
  addCheck('ASTRONOMY', 'Ayanamsa', dssmeChart.IDENTITY.ayanamsa_name, 'Lahiri', 0);
  addCheck('ASTRONOMY', 'Lagna Sign', dssmeChart.IDENTITY.lagna_sign, 'Pisces', 0);

  // 2. Kaala Bala Checks (Sun to Saturn)
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

  for (let i = 0; i < planets.length; i++) {
    const pName = planets[i];
    const dssmePlanet = dssmeChart.PLANETS[pName];
    const oraclePlanet = (fixture.planets as any)[pName];

    if (oraclePlanet && dssmePlanet) {
      const dKaala = dssmeChart.SHADBALA.kaala_total[i];
      addCheck('SHADBALA_KAALA', `${pName} Kaala Total`, dKaala, oraclePlanet.kaala, 0.05);

      const dSthana = dssmeChart.SHADBALA.sthana_total[i];
      addCheck('SHADBALA_STHANA', `${pName} Sthana Total`, dSthana, oraclePlanet.sthana, 0.05);

      const dDig = dssmeChart.SHADBALA.dig_bala[i];
      addCheck('SHADBALA_DIG', `${pName} Dig Total`, dDig, oraclePlanet.dig, 0.05);

      const dTotal = dssmeChart.SHADBALA.total_virupas[i];
      addCheck('SHADBALA_TOTAL', `${pName} Total Virupas`, dTotal, oraclePlanet.total_virupas, 0.05);
    }
  }

  // 3. Panchanga Checks (Chofu 2026-09-16 18:50:00 JST: Moon ~200.7° Libra/Scorpio)
  addCheck('PANCHANGA', 'Tithi Name', dssmeChart.PANCHANGA.tithi_name, 'Shashti', 0);
  addCheck('PANCHANGA', 'Paksha', dssmeChart.PANCHANGA.paksha, 'Shukla', 0);
  addCheck('PANCHANGA', 'Nakshatra', dssmeChart.PANCHANGA.nakshatra_name, 'Vishakha', 0);
  addCheck('PANCHANGA', 'Weekday Lord', dssmeChart.PANCHANGA.weekday_lord, 'Mercury', 0);

  const passed = results.filter((r) => r.status === 'PASS').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks: passed,
    warnChecks: warn,
    failedChecks: failed,
    overallStatus: failed === 0 ? 'PASS' : warn > 0 ? 'WARN' : 'FAIL',
    results,
  };
}
