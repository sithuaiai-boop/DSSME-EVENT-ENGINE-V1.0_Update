/**
 * DSSME EVENT ENGINE V1.0 - KAALA BALA 9-SUBCOMPONENT UNIT TEST
 *
 * Verifies all 9 classical Kaala Bala subcomponents:
 * 1. Nathonnatha Bala
 * 2. Paksha Bala
 * 3. Tribhaga Bala
 * 4. Abda Bala
 * 5. Masa Bala
 * 6. Vaara Bala
 * 7. Hora Bala
 * 8. Ayana Bala
 * 9. Yuddha Bala
 *
 * Across all 7 planets on all 5 independent PyJHora V2 oracle fixtures
 * (315 component checks total).
 */

import fs from 'fs';
import path from 'path';
import { calculateEphemerisSnapshot } from '../../src/engine/astronomy/ephemeris.js';
import { calculateKaalaBalaAll } from '../../src/engine/strength/kaalaBala.js';

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

// Expected subcomponent reference values extracted directly from PyJHora V4.9.3 (commit 48e57d29)
// Format for each fixture: { nath, paksha, tribhaga, abda, masa, vaara, hora, ayana, yuddha, total }
const PYJHORA_9_COMPONENTS: Record<string, Record<string, number[]>> = {
  PYJHORA_V2_001: {
    nath: [27.73, 32.27, 32.27, 60.0, 27.73, 27.73, 32.27],
    paksha: [39.01, 41.98, 39.01, 39.01, 20.99, 20.99, 39.01],
    tribhaga: [0, 60, 0, 0, 60, 0, 0],
    abda: [15, 0, 0, 0, 0, 0, 0],
    masa: [0, 0, 0, 0, 0, 0, 30],
    vaara: [0, 0, 0, 45, 0, 0, 0],
    hora: [0, 0, 0, 0, 0, 60, 0],
    ayana: [66.52, 54.79, 57.5, 34.74, 50.17, 13.76, 36.39],
    yuddha: [0, 0, 0, 0, 0, 0, 0],
    total: [148.26, 189.04, 128.78, 178.75, 158.89, 122.48, 137.67],
  },
  PYJHORA_V2_002: {
    nath: [60.14, -0.14, -0.14, 60.0, 60.14, 60.14, -0.14],
    paksha: [6.05, 107.9, 6.05, 6.05, 53.95, 53.95, 6.05],
    tribhaga: [60, 0, 0, 0, 60, 0, 0],
    abda: [15, 0, 0, 0, 0, 0, 0],
    masa: [0, 0, 0, 0, 0, 0, 30],
    vaara: [0, 0, 0, 0, 0, 45, 0],
    hora: [0, 60, 0, 0, 0, 0, 0],
    ayana: [57.8, 38.02, 56.25, 41.28, 49.51, 12.19, 36.06],
    yuddha: [0, 0, 0, 11.15, 0, -11.15, 0],
    total: [198.99, 205.78, 62.16, 118.48, 223.6, 160.13, 71.97],
  },
  PYJHORA_V2_003: {
    nath: [36.4, 23.6, 23.6, 60.0, 36.4, 36.4, 23.6],
    paksha: [1.72, 116.56, 1.72, 1.72, 58.28, 58.28, 1.72],
    tribhaga: [0, 0, 0, 60, 60, 0, 0],
    abda: [0, 0, 0, 0, 15, 0, 0],
    masa: [0, 0, 0, 30, 0, 0, 0],
    vaara: [0, 0, 0, 0, 0, 45, 0],
    hora: [0, 0, 0, 0, 60, 0, 0],
    ayana: [98.56, 47.16, 21.68, 43.04, 58.29, 57.83, 34.64],
    yuddha: [0, 0, -0.3, 0, 0, 0, 0.3],
    total: [136.68, 187.32, 46.7, 194.76, 287.97, 197.51, 60.26],
  },
  PYJHORA_V2_004: {
    nath: [38.16, 21.84, 21.84, 60.0, 38.16, 38.16, 21.84],
    paksha: [31.29, 57.42, 31.29, 28.71, 28.71, 28.71, 31.29],
    tribhaga: [0, 0, 0, 0, 60, 0, 60],
    abda: [15, 0, 0, 0, 0, 0, 0],
    masa: [0, 0, 30, 0, 0, 0, 0],
    vaara: [0, 45, 0, 0, 0, 0, 0],
    hora: [0, 60, 0, 0, 0, 0, 0],
    ayana: [112.44, 42.14, 59.01, 58.67, 54.47, 38.76, 37.4],
    yuddha: [0, 0, 0, 0, 0, 0, 0],
    total: [196.89, 226.4, 142.14, 147.38, 181.34, 105.63, 150.53],
  },
  PYJHORA_V2_005: {
    nath: [17.11, 42.89, 42.89, 60.0, 17.11, 17.11, 42.89],
    paksha: [35.4, 70.8, 35.4, 35.4, 24.6, 24.6, 35.4],
    tribhaga: [0, 0, 60, 0, 60, 0, 0],
    abda: [15, 0, 0, 0, 0, 0, 0],
    masa: [0, 0, 0, 30, 0, 0, 0],
    vaara: [0, 45, 0, 0, 0, 0, 0],
    hora: [0, 0, 0, 0, 60, 0, 0],
    ayana: [21.58, 13.99, 49.05, 50.53, 47.02, 17.52, 34.62],
    yuddha: [0, 0, 0, 0, 0, 0, 0],
    total: [89.09, 172.68, 187.34, 175.93, 208.73, 59.23, 112.91],
  },
};

export async function runKaalaBalaUnitTests(): Promise<{
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  fixtureCount: number;
  componentSummary: Record<string, { passed: number; total: number }>;
}> {
  const oraclePath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json');
  const oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf-8'));

  const componentNames = ['nathonnatha', 'paksha', 'tribhaga', 'abda', 'masa', 'vaara', 'hora', 'ayana', 'yuddha'];
  const pyKeys = ['nath', 'paksha', 'tribhaga', 'abda', 'masa', 'vaara', 'hora', 'ayana', 'yuddha'];

  const componentSummary: Record<string, { passed: number; total: number }> = {};
  for (const c of componentNames) {
    componentSummary[c] = { passed: 0, total: 0 };
  }

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  for (const fix of oracle.fixtures) {
    const tz = fix.input.timezone_offset;
    const snap = await calculateEphemerisSnapshot(
      fix.input.date + ' ' + fix.input.time,
      fix.input.latitude,
      fix.input.longitude,
      tz
    );

    const { totals, breakdowns } = calculateKaalaBalaAll({
      julianDay: snap.jdUtc,
      latitude: fix.input.latitude,
      longitude: fix.input.longitude,
      timezoneOffset: tz,
      datetime: fix.input.date + 'T' + fix.input.time,
      timeStr: fix.input.time,
      planets: snap.planets,
    });

    const py = PYJHORA_9_COMPONENTS[fix.fixture_id];

    for (let k = 0; k < 9; k++) {
      const cName = componentNames[k];
      const pKey = pyKeys[k];
      for (let p = 0; p < 7; p++) {
        totalChecks++;
        componentSummary[cName].total++;
        const act = (breakdowns[p] as any)[cName];
        const exp = py[pKey][p];
        const delta = Math.round((act - exp) * 100) / 100;

        if (Math.abs(delta) <= 0.01) {
          passedChecks++;
          componentSummary[cName].passed++;
        } else {
          failedChecks++;
          console.error(`FAIL: ${fix.fixture_id} ${PLANETS[p]} ${cName}: Exp=${exp}, Act=${act}, Delta=${delta}`);
        }
      }
    }
  }

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    fixtureCount: oracle.fixtures.length,
    componentSummary,
  };
}

if (process.argv[1] && process.argv[1].endsWith('kaalaBala.test.ts')) {
  runKaalaBalaUnitTests().then((res) => {
    console.log(`\n====================================================`);
    console.log(`KAALA BALA 9-SUBCOMPONENT UNIT TEST RESULTS`);
    console.log(`====================================================`);
    console.log(`Fixtures Tested: ${res.fixtureCount}`);
    console.log(`Total Subcomponent Checks: ${res.totalChecks}`);
    console.log(`Passed Checks: ${res.passedChecks}`);
    console.log(`Failed Checks: ${res.failedChecks}`);
    console.log(`Pass Rate: ${(res.passedChecks / res.totalChecks * 100).toFixed(2)}%\n`);

    for (const [cName, summary] of Object.entries(res.componentSummary)) {
      console.log(`  ${cName.padEnd(12)}: ${summary.passed} / ${summary.total} PASS`);
    }
    console.log(`====================================================`);

    if (res.failedChecks > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
