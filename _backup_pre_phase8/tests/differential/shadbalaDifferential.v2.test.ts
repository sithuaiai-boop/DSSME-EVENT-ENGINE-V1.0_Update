/**
 * DSSME EVENT ENGINE V1.0 - INDEPENDENT PYJHORA DIFFERENTIAL TEST (v2)
 *
 * REPLACES tests/differential/shadbalaDifferential.test.ts.
 *
 * Expected = tests/oracle/pyjhora-v2/*.json, produced by ACTUALLY EXECUTING
 *            naturalstupid/PyJHora's shad_bala(jd, place) (see
 *            scripts/run_independent_pyjhora_oracle.py -- a Python runner
 *            that imports the real `jhora` package; it contains ZERO
 *            reimplemented Shadbala formulas).
 * Actual   = live DSSME calculateCanonicalChart() -> chart.SHADBALA
 *
 * The previous v1 differential test compared DSSME against
 * tests/oracle/pyjhora/*.json, whose generator
 * (scripts/generate_pyjhora_oracle.py) reimplements Sthana/Kaala/Dig/
 * Chesta/Drik Bala in hand-written Python rather than calling PyJHora.
 * That file's `pinned_commit` (48e57d29bcfa37265a7f920257ad1fba968846c2)
 * does not exist anywhere in PyJHora's git history (verified against the
 * full, unshallowed commit log). v1 fixtures are PRESERVED but marked
 * INVALID_FOR_PYJHORA_PARITY and MUST NOT be used here.
 *
 * A fixture only counts as PyJHora-parity PASS when every one of the
 * 9 checks below passes -- matching totals with mismatched components
 * is NOT a pass (Hard Rule, see CLAUDE.md §15).
 */

import fs from 'fs';
import path from 'path';
import { calculateCanonicalChart } from '../../src/engine/chart/calculateChart.js';
import { DSSMEEventInput } from '../../src/engine/types.js';

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
type PlanetName = typeof PLANETS[number];

// Tolerance is intentionally the same ±0.05 used by the v1 test's own stated
// contract -- this rewrite changes WHERE the "expected" values come from,
// not how strict the comparison is.
const TOLERANCE = 0.05;

interface ComponentCheck {
  component: string;
  expected: number;
  actual: number;
  delta: number;
  status: 'PASS' | 'FAIL';
}

interface PlanetResult {
  planet: PlanetName;
  checks: ComponentCheck[];
  planetStatus: 'PASS' | 'FAIL';
}

interface FixtureResult {
  fixtureId: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  planets: PlanetResult[];
}

export interface IndependentDifferentialReport {
  timestamp: string;
  oracleStatus: string;
  oracleRepository: string;
  oracleResolvedCommit: string | null;
  oracleClaimedCommit: string | null;
  oracleClaimedCommitVerifiedToExist: boolean;
  fixtureCount: number;
  passedFixtures: number;
  failedFixtures: number;
  overallStatus: 'PYJHORA_PARITY_VERIFIED' | 'PARTIALLY_VERIFIED' | 'BLOCKED' | 'NOT_VERIFIED';
  fixtures: FixtureResult[];
}

function loadOracle(): any {
  const oraclePath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json');
  if (!fs.existsSync(oraclePath)) {
    throw new Error(
      `Independent PyJHora oracle not found at ${oraclePath}. ` +
      `Run scripts/run_independent_pyjhora_oracle.py first. ` +
      `Refusing to fall back to the legacy (invalid) oracle.`
    );
  }
  const data = JSON.parse(fs.readFileSync(oraclePath, 'utf-8'));
  if (data.oracleStatus !== 'INDEPENDENT_PYJHORA') {
    throw new Error(`Oracle file present but oracleStatus is "${data.oracleStatus}", expected "INDEPENDENT_PYJHORA".`);
  }
  return data;
}

function check(component: string, expected: number, actual: number): ComponentCheck {
  const delta = Math.round((actual - expected) * 100) / 100;
  return { component, expected, actual, delta, status: Math.abs(delta) <= TOLERANCE ? 'PASS' : 'FAIL' };
}

export async function runIndependentDifferentialSuite(): Promise<IndependentDifferentialReport> {
  const oracle = loadOracle();
  const fixtures: FixtureResult[] = [];

  for (const f of oracle.fixtures) {
    const input: DSSMEEventInput = {
      datetime: `${f.input.date} ${f.input.time}`,
      timezone: `UTC${f.input.timezone_offset >= 0 ? '+' : ''}${f.input.timezone_offset}`,
      location: {
        latitude: f.input.latitude,
        longitude: f.input.longitude,
        city: f.input.location_name.split(',')[0].trim(),
        country: f.input.location_name.split(',')[1]?.trim() || 'Unknown',
      },
      ayanamsa: 'Lahiri',
    };

    let chart;
    try {
      chart = await calculateCanonicalChart(input);
    } catch (e: any) {
      fixtures.push({ fixtureId: f.fixture_id, name: f.name, status: 'BLOCKED', planets: [] });
      continue;
    }
    const sb = chart.SHADBALA;

    const planetResults: PlanetResult[] = [];
    let fixturePassed = true;

    for (let i = 0; i < PLANETS.length; i++) {
      const p = PLANETS[i];
      const oraclePlanet = f.planets[p];
      const checks: ComponentCheck[] = [
        check('sthana', oraclePlanet.sthana, sb.sthana_total[i]),
        check('kaala', oraclePlanet.kaala, sb.kaala_total[i]),
        check('dig', oraclePlanet.dig, sb.dig_bala[i]),
        check('chesta', oraclePlanet.chesta, sb.chesta_bala[i]),
        check('naisargika', oraclePlanet.naisargika, sb.naisargika_bala[i]),
        check('drik', oraclePlanet.drik, sb.drig_bala[i]),
        check('total_virupas', oraclePlanet.total_virupas, sb.total_virupas[i]),
      ];
      const planetStatus = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';
      if (planetStatus === 'FAIL') fixturePassed = false;
      planetResults.push({ planet: p, checks, planetStatus });
    }

    fixtures.push({
      fixtureId: f.fixture_id,
      name: f.name,
      status: fixturePassed ? 'PASS' : 'FAIL',
      planets: planetResults,
    });
  }

  const passedFixtures = fixtures.filter((f) => f.status === 'PASS').length;
  const failedFixtures = fixtures.filter((f) => f.status === 'FAIL').length;
  const blockedFixtures = fixtures.filter((f) => f.status === 'BLOCKED').length;

  let overallStatus: IndependentDifferentialReport['overallStatus'] = 'NOT_VERIFIED';
  if (blockedFixtures > 0) overallStatus = 'BLOCKED';
  else if (passedFixtures === fixtures.length && fixtures.length > 0) overallStatus = 'PYJHORA_PARITY_VERIFIED';
  else if (passedFixtures > 0) overallStatus = 'PARTIALLY_VERIFIED';

  return {
    timestamp: new Date().toISOString(),
    oracleStatus: oracle.oracleStatus,
    oracleRepository: oracle.repository,
    oracleResolvedCommit: oracle.resolved_commit_full_sha,
    oracleClaimedCommit: oracle.dssme_claimed_commit_sha ?? null,
    oracleClaimedCommitVerifiedToExist: oracle.dssme_claimed_commit_exists_in_pyjhora_history ?? false,
    fixtureCount: fixtures.length,
    passedFixtures,
    failedFixtures,
    overallStatus,
    fixtures,
  };
}

if (process.argv[1] && process.argv[1].endsWith('shadbalaDifferential.v2.test.ts')) {
  runIndependentDifferentialSuite().then((report) => {
    console.log('======================================================================');
    console.log('DSSME EVENT ENGINE V1.0 - INDEPENDENT PYJHORA DIFFERENTIAL TEST (V2)');
    console.log('======================================================================');
    console.log('Oracle Status:', report.oracleStatus);
    console.log('Repository:', report.oracleRepository);
    console.log('Resolved Commit:', report.oracleResolvedCommit);
    console.log('Claimed Commit Exists:', report.oracleClaimedCommitVerifiedToExist);
    console.log('Total Fixtures:', report.fixtureCount);
    console.log('Passed Fixtures:', report.passedFixtures);
    console.log('Failed Fixtures:', report.failedFixtures);
    console.log('Overall Status:', report.overallStatus);
    console.log('\n--- FIXTURE BREAKDOWN ---');
    for (const f of report.fixtures) {
      console.log(`\nFixture [${f.fixtureId}] ${f.name} -> Status: ${f.status}`);
      for (const p of f.planets) {
        const failingChecks = p.checks.filter(c => c.status === 'FAIL');
        if (failingChecks.length === 0) {
          console.log(`  ${p.planet.padEnd(8)}: ALL CHECKS PASS`);
        } else {
          console.log(`  ${p.planet.padEnd(8)}: ${failingChecks.length} CHECKS FAIL`);
          for (const c of failingChecks) {
            console.log(`    - ${c.component.padEnd(14)}: Expected=${String(c.expected).padStart(6)} | Actual=${String(c.actual).padStart(6)} | Delta=${String(c.delta).padStart(6)}`);
          }
        }
      }
    }
    console.log('======================================================================');
  }).catch((err) => {
    console.error('Error running independent differential test:', err);
    process.exit(1);
  });
}
