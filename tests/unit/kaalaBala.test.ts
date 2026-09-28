/**
 * DSSME EVENT ENGINE V1.0 - DIRECT INDEPENDENT PYJHORA 315/315 VERIFICATION
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
 * Directly against the immutable independent PyJHora V2 oracle artifact:
 *   tests/oracle/pyjhora-v2/pyjhora_oracle_v2_kaala_components.json
 *
 * Total: 9 components × 7 planets × 5 fixtures = 315 direct component assertions.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { calculateEphemerisSnapshot } from '../../src/engine/astronomy/ephemeris.js';
import { calculateKaalaBalaAll } from '../../src/engine/strength/kaalaBala.js';

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export const KAALA_COMPONENTS = [
  'nathonnatha',
  'paksha',
  'tribhaga',
  'abda',
  'masa',
  'vaara',
  'hora',
  'ayana',
  'yuddha',
] as const;

export interface ComponentCheckRecord {
  fixtureId: string;
  planet: string;
  component: string;
  expected: number;
  actual: number;
  delta: number;
  status: 'PASS' | 'FAIL';
}

export interface KaalaDirectVerificationResult {
  oraclePath: string;
  oracleStatus: string;
  beforeHash: string;
  afterHash: string;
  fixtureCount: number;
  planetCount: number;
  componentAssertionCount: number;
  passedComponentAssertions: number;
  failedComponentAssertions: number;
  totalAssertionCount: number;
  passedTotalAssertions: number;
  failedTotalAssertions: number;
  maxDelta: number;
  componentSummary: Record<string, { passed: number; total: number }>;
  records: ComponentCheckRecord[];
}

export async function runDirectIndependentOracleKaalaTest(): Promise<KaalaDirectVerificationResult> {
  const relativeOraclePath = 'tests/oracle/pyjhora-v2/pyjhora_oracle_v2_kaala_components.json';
  const absoluteOraclePath = path.resolve(process.cwd(), relativeOraclePath);

  if (!fs.existsSync(absoluteOraclePath)) {
    throw new Error(`Independent PyJHora oracle components artifact not found at ${absoluteOraclePath}`);
  }

  // 1. Calculate SHA-256 before running assertions (Immutability check)
  const initialRaw = fs.readFileSync(absoluteOraclePath, 'utf-8');
  const beforeHash = crypto.createHash('sha256').update(initialRaw).digest('hex');

  const oracle = JSON.parse(initialRaw);

  // 2. Oracle Schema Validation
  if (oracle.oracleStatus !== 'INDEPENDENT_PYJHORA') {
    throw new Error(`Invalid oracle status "${oracle.oracleStatus}". Expected "INDEPENDENT_PYJHORA".`);
  }

  if (!Array.isArray(oracle.fixtures) || oracle.fixtures.length !== 5) {
    throw new Error(`VERIFICATION_SCHEMA_FAILURE: Expected 5 fixtures, found ${oracle.fixtures?.length}`);
  }

  for (const fix of oracle.fixtures) {
    if (!fix.components || typeof fix.components !== 'object') {
      throw new Error(`VERIFICATION_SCHEMA_FAILURE: Fixture ${fix.fixture_id} missing 'components' dictionary.`);
    }
    for (const pName of PLANETS) {
      const pComponents = fix.components[pName];
      if (!pComponents) {
        throw new Error(`VERIFICATION_SCHEMA_FAILURE: Fixture ${fix.fixture_id} missing planet ${pName}.`);
      }
      for (const cName of KAALA_COMPONENTS) {
        if (typeof pComponents[cName] !== 'number') {
          throw new Error(`VERIFICATION_SCHEMA_FAILURE: Fixture ${fix.fixture_id} planet ${pName} missing component ${cName}.`);
        }
      }
      if (typeof pComponents.total !== 'number') {
        throw new Error(`VERIFICATION_SCHEMA_FAILURE: Fixture ${fix.fixture_id} planet ${pName} missing 'total'.`);
      }
    }
  }

  const componentSummary: Record<string, { passed: number; total: number }> = {};
  for (const c of KAALA_COMPONENTS) {
    componentSummary[c] = { passed: 0, total: 0 };
  }

  let componentAssertionCount = 0;
  let passedComponentAssertions = 0;
  let failedComponentAssertions = 0;

  let totalAssertionCount = 0;
  let passedTotalAssertions = 0;
  let failedTotalAssertions = 0;

  let maxDelta = 0;
  const records: ComponentCheckRecord[] = [];

  // 3. Dynamic Fixture Iteration
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
      planets: snap.planets as any,
      standard: 'PYJHORA',
    });

    for (let p = 0; p < PLANETS.length; p++) {
      const pName = PLANETS[p];
      const oracleComponents = fix.components[pName];

      // A. Verify 9 subcomponents
      for (const cName of KAALA_COMPONENTS) {
        componentAssertionCount++;
        componentSummary[cName].total++;

        const act = (breakdowns[p] as any)[cName];
        const exp = oracleComponents[cName];
        const delta = Math.round((act - exp) * 100) / 100;

        if (Math.abs(delta) > maxDelta) maxDelta = Math.abs(delta);

        const status = Math.abs(delta) <= 0.01 ? 'PASS' : 'FAIL';
        if (status === 'PASS') {
          passedComponentAssertions++;
          componentSummary[cName].passed++;
        } else {
          failedComponentAssertions++;
        }

        records.push({
          fixtureId: fix.fixture_id,
          planet: pName,
          component: cName,
          expected: exp,
          actual: act,
          delta,
          status,
        });
      }

      // B. Verify Kaala Total
      totalAssertionCount++;
      const actTotal = totals[p];
      const expTotal = oracleComponents.total;
      const totalDelta = Math.round((actTotal - expTotal) * 100) / 100;
      if (Math.abs(totalDelta) <= 0.05) {
        passedTotalAssertions++;
      } else {
        failedTotalAssertions++;
      }
    }
  }

  // 4. Validate runtime 315-assertion contract
  if (componentAssertionCount !== 315) {
    throw new Error(`EXPECTED 315 COMPONENT COMPARISONS, ACTUAL ${componentAssertionCount}`);
  }

  // 5. Immutability re-verification (SHA-256 after test execution)
  const finalRaw = fs.readFileSync(absoluteOraclePath, 'utf-8');
  const afterHash = crypto.createHash('sha256').update(finalRaw).digest('hex');

  if (beforeHash !== afterHash) {
    throw new Error(`ORACLE_MUTATION_DETECTED! Pre-SHA256=${beforeHash}, Post-SHA256=${afterHash}`);
  }

  return {
    oraclePath: relativeOraclePath,
    oracleStatus: oracle.oracleStatus,
    beforeHash,
    afterHash,
    fixtureCount: oracle.fixtures.length,
    planetCount: oracle.fixtures.length * PLANETS.length,
    componentAssertionCount,
    passedComponentAssertions,
    failedComponentAssertions,
    totalAssertionCount,
    passedTotalAssertions,
    failedTotalAssertions,
    maxDelta,
    componentSummary,
    records,
  };
}

// Backward compatibility alias
export const runKaalaBalaUnitTests = runDirectIndependentOracleKaalaTest;

if (process.argv[1] && process.argv[1].endsWith('kaalaBala.test.ts')) {
  runDirectIndependentOracleKaalaTest().then((res) => {
    console.log(`====================================================`);
    console.log(`DIRECT PYJHORA COMPONENT VERIFICATION`);
    console.log(`====================================================\n`);
    console.log(`Oracle:\n${res.oraclePath}\n`);
    console.log(`Oracle Status:\n${res.oracleStatus}\n`);
    console.log(`Fixtures:\n${res.fixtureCount} / 5\n`);
    console.log(`Planets:\n${res.planetCount} / 35\n`);

    for (const [cName, summary] of Object.entries(res.componentSummary)) {
      console.log(`${cName}:\n${summary.passed} / ${summary.total} PASS\n`);
    }

    console.log(`TOTAL COMPONENT ASSERTIONS:\n${res.passedComponentAssertions} / ${res.componentAssertionCount}\n`);
    console.log(`KAALA TOTAL ASSERTIONS:\n${res.passedTotalAssertions} / ${res.totalAssertionCount}\n`);
    console.log(`ORACLE MUTATION:\n${res.beforeHash === res.afterHash ? 'NONE' : 'DETECTED'}\n`);
    console.log(`VERIFICATION CHAIN:\nDIRECT\n`);
    console.log(`====================================================`);

    if (res.failedComponentAssertions > 0 || res.failedTotalAssertions > 0) {
      console.log('FAILURES:');
      for (const r of res.records) {
        if (r.status === 'FAIL') {
          console.log(`  ${r.fixtureId} ${r.planet} ${r.component}: actual=${r.actual}, expected=${r.expected}, delta=${r.delta}`);
        }
      }
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
