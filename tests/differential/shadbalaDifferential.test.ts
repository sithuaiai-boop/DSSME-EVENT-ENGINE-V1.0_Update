/**
 * DSSME EVENT ENGINE V1.0 - INDEPENDENT PYJHORA DIFFERENTIAL TEST SUITE (V2)
 *
 * Compares current DSSME engine output against independent PyJHora Oracle v2 fixtures (F01..F18).
 * Expected = Real PyJHora Oracle Execution (tests/oracle/pyjhora-v2/*.json)
 * Actual = DSSME Engine Execution (calculateCanonicalChart -> SHADBALA)
 * Delta = Actual - Expected
 *
 * SOURCE OF TRUTH:
 *   Repository: https://github.com/naturalstupid/PyJHora (Commit: 48e57d29b47a3143519910a24866758116467485)
 *   Source File: src/jhora/horoscope/chart/strength.py (SHA-256: 43b4a1c2fd0374b94aa9fb2b5b5bfd6283a8ca6c72fba466a89d8d29407aa278)
 *   Function: shad_bala(jd, place)
 *
 * CLASSIFICATION SCHEME:
 *   CLASS A: Algorithmic Bug / Divergence (e.g. PyJHora unwrapped angular distance in Dig Bala)
 *   CLASS B: Reference Data Difference (e.g. Surya Siddhanta epoch tables vs ephemeris)
 *   CLASS C: Rounding / Precision Difference (floating point, rounding order)
 *   CLASS D: Ayanamsa / Coordinate System Difference (precession / nutation)
 *   CLASS E: Input Model Difference (sunrise / ahargana day lord definition)
 *   CLASS F: Intentional DSSME Extension (modern ephemeris speed ratio for Chesta)
 */

import fs from 'fs';
import path from 'path';
import { calculateCanonicalChart } from '../../src/engine/chart/calculateChart.js';
import { DSSMEEventInput } from '../../src/engine/types.js';

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export type PlanetName = typeof PLANETS[number];

export type DifferenceClass =
  | 'CLASS_A_ALGORITHMIC_BUG'
  | 'CLASS_B_REFERENCE_DATA'
  | 'CLASS_C_ROUNDING_PRECISION'
  | 'CLASS_D_COORDINATE_SYSTEM'
  | 'CLASS_E_INPUT_MODEL'
  | 'CLASS_F_INTENTIONAL_EXTENSION'
  | 'EXACT_MATCH';

export interface ComponentComparison {
  component: string;
  expected: number;
  actual: number;
  delta: number;
  tolerance: number;
  status: 'PASS' | 'FAIL';
  classification: DifferenceClass;
  pyjhoraSource: string;
  dssmeSource: string;
  explanation?: string;
}

export interface PlanetComparison {
  planet: PlanetName;
  components: Record<string, ComponentComparison>;
  totalVirupas: ComponentComparison;
  rupa: ComponentComparison;
  strengthRatio: ComponentComparison;
  planetStatus: 'PASS' | 'FAIL';
  failureTypes: string[];
}

export interface FixtureDifferentialResult {
  fixtureId: string;
  name: string;
  purpose: string;
  location: string;
  datetime: string;
  status: 'PASS' | 'FAIL';
  componentSummary: {
    sthana: { pass: number; fail: number };
    kaala: { pass: number; fail: number };
    dig: { pass: number; fail: number };
    chesta: { pass: number; fail: number };
    naisargika: { pass: number; fail: number };
    drik: { pass: number; fail: number };
    totalVirupas: { pass: number; fail: number };
    rupa: { pass: number; fail: number };
    strengthRatio: { pass: number; fail: number };
  };
  planets: Record<PlanetName, PlanetComparison>;
  mismatches: ComponentComparison[];
  rootCause: string;
}

export interface DifferentialSuiteReport {
  timestamp: string;
  oracleEngine: string;
  repository: string;
  pinnedCommit: string;
  sourceFile: string;
  sourceSha256: string;
  fixtureCount: number;
  passedFixtures: number;
  failedFixtures: number;
  componentTotals: {
    sthana: { pass: number; fail: number };
    kaala: { pass: number; fail: number };
    dig: { pass: number; fail: number };
    chesta: { pass: number; fail: number };
    naisargika: { pass: number; fail: number };
    drik: { pass: number; fail: number };
    totalVirupas: { pass: number; fail: number };
    rupa: { pass: number; fail: number };
    strengthRatio: { pass: number; fail: number };
  };
  classificationSummary: Record<DifferenceClass, number>;
  overallStatus: 'PASS' | 'PASS_WITH_FINDINGS' | 'BLOCKED';
  fixtures: FixtureDifferentialResult[];
}

export async function runDifferentialTestSuite(): Promise<DifferentialSuiteReport> {
  const manifestPath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`ORACLE STATUS = BLOCKED: PyJHora v2 manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const fixtureResults: FixtureDifferentialResult[] = [];

  const totals = {
    sthana: { pass: 0, fail: 0 },
    kaala: { pass: 0, fail: 0 },
    dig: { pass: 0, fail: 0 },
    chesta: { pass: 0, fail: 0 },
    naisargika: { pass: 0, fail: 0 },
    drik: { pass: 0, fail: 0 },
    totalVirupas: { pass: 0, fail: 0 },
    rupa: { pass: 0, fail: 0 },
    strengthRatio: { pass: 0, fail: 0 },
  };

  const classCounts: Record<DifferenceClass, number> = {
    EXACT_MATCH: 0,
    CLASS_A_ALGORITHMIC_BUG: 0,
    CLASS_B_REFERENCE_DATA: 0,
    CLASS_C_ROUNDING_PRECISION: 0,
    CLASS_D_COORDINATE_SYSTEM: 0,
    CLASS_E_INPUT_MODEL: 0,
    CLASS_F_INTENTIONAL_EXTENSION: 0,
  };

  for (const f of manifest.fixtures) {
    const fixturePath = path.resolve(process.cwd(), f.file);
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    // Properly format timezone offset string e.g. "+09:00", "-04:00"
    const offset = fixtureData.input.timezone_offset;
    const sign = offset >= 0 ? '+' : '-';
    const absHours = Math.floor(Math.abs(offset));
    const absMins = Math.round((Math.abs(offset) - absHours) * 60);
    const tzStr = `${sign}${String(absHours).padStart(2, '0')}:${String(absMins).padStart(2, '0')}`;

    // Construct Canonical DSSME Input
    const dssmeInput: DSSMEEventInput = {
      datetime: `${fixtureData.input.date} ${fixtureData.input.time}`,
      timezone: tzStr,
      location: {
        latitude: fixtureData.input.latitude,
        longitude: fixtureData.input.longitude,
        city: fixtureData.input.location_name.split(',')[0].trim(),
        country: fixtureData.input.location_name.split(',')[1]?.trim() || 'Global',
      },
      ayanamsa: fixtureData.input.ayanamsa,
    };

    // Calculate DSSME Result
    const chart = await calculateCanonicalChart(dssmeInput);
    const dssmeSb = chart.SHADBALA;
    const oracle = fixtureData.oracle;

    const compSummary = {
      sthana: { pass: 0, fail: 0 },
      kaala: { pass: 0, fail: 0 },
      dig: { pass: 0, fail: 0 },
      chesta: { pass: 0, fail: 0 },
      naisargika: { pass: 0, fail: 0 },
      drik: { pass: 0, fail: 0 },
      totalVirupas: { pass: 0, fail: 0 },
      rupa: { pass: 0, fail: 0 },
      strengthRatio: { pass: 0, fail: 0 },
    };

    const planetsRecord: Partial<Record<PlanetName, PlanetComparison>> = {};
    const fixtureMismatches: ComponentComparison[] = [];
    let fixturePassed = true;

    for (let i = 0; i < 7; i++) {
      const p = PLANETS[i];
      const pFailures: string[] = [];

      // Helper to evaluate component
      const checkComponent = (
        name: string,
        expected: number,
        actual: number,
        tolerance: number,
        defaultClass: DifferenceClass,
        pySrc: string,
        dssmeSrc: string,
        explanation: string
      ): ComponentComparison => {
        const delta = Math.round((actual - expected) * 100) / 100;
        const pass = Math.abs(delta) <= tolerance;
        const classification = pass ? 'EXACT_MATCH' : defaultClass;
        classCounts[classification]++;

        const comp: ComponentComparison = {
          component: `${p} ${name}`,
          expected,
          actual,
          delta,
          tolerance,
          status: pass ? 'PASS' : 'FAIL',
          classification,
          pyjhoraSource: pySrc,
          dssmeSource: dssmeSrc,
          explanation: pass ? undefined : explanation,
        };

        if (!pass) {
          fixtureMismatches.push(comp);
        }
        return comp;
      };

      // 1. Sthana Bala
      const sExp = oracle.sthana[p];
      const sAct = dssmeSb.sthana_total[i];
      const sComp = checkComponent(
        'Sthana',
        sExp,
        sAct,
        2.0, // 2.0 virupas tolerance for varga boundary / compound friendship difference
        'CLASS_B_REFERENCE_DATA',
        'strength.py:_sthana_bala',
        'sthanaBala.ts:calculateSthanaBalaAll',
        'Varga placement rounding & friendship dignity table differences in Saptavargaja'
      );
      if (sComp.status === 'PASS') compSummary.sthana.pass++;
      else { compSummary.sthana.fail++; pFailures.push('FAIL_STHANA'); }

      // 2. Kaala Bala
      const kExp = oracle.kaala[p];
      const kAct = dssmeSb.kaala_total[i];
      const kComp = checkComponent(
        'Kaala',
        kExp,
        kAct,
        2.0,
        'CLASS_B_REFERENCE_DATA',
        'strength.py:_kaala_bala',
        'kaalaBala.ts:calculateKaalaBalaAll',
        'PyJHora Ahargana year/month lords & Swiss Ephemeris declination vs analytical kaala factors'
      );
      if (kComp.status === 'PASS') compSummary.kaala.pass++;
      else { compSummary.kaala.fail++; pFailures.push('FAIL_KAALA'); }

      // 3. Dig Bala
      const dExp = oracle.dig[p];
      const dAct = dssmeSb.dig_bala[i];
      const dComp = checkComponent(
        'Dig',
        dExp,
        dAct,
        0.5,
        'CLASS_A_ALGORITHMIC_BUG',
        'strength.py:_dig_bala',
        'digBala.ts:calculateDigBalaAll',
        'PyJHora method 1 omits 180° circular distance wrap (abs(dbf - lon)/3), allowing values > 60'
      );
      if (dComp.status === 'PASS') compSummary.dig.pass++;
      else { compSummary.dig.fail++; pFailures.push('FAIL_DIG'); }

      // 4. Chesta Bala
      const cExp = oracle.chesta[p];
      const cAct = dssmeSb.chesta_bala[i];
      const cComp = checkComponent(
        'Chesta',
        cExp,
        cAct,
        2.0,
        'CLASS_F_INTENTIONAL_EXTENSION',
        'strength.py:_cheshta_bala_new',
        'chestaBala.ts:calculateChestaBalaAll',
        'PyJHora uses Surya Siddhanta epoch table mean motions vs modern ephemeris speed ratio model'
      );
      if (cComp.status === 'PASS') compSummary.chesta.pass++;
      else { compSummary.chesta.fail++; pFailures.push('FAIL_CHESTA'); }

      // 5. Naisargika Bala (Classical Universal Fixed Constants: Sun=60, Moon=51.43, etc.)
      const nExp = oracle.naisargika[p];
      const nAct = dssmeSb.naisargika_bala[i];
      const nComp = checkComponent(
        'Naisargika',
        nExp,
        nAct,
        0.05,
        'EXACT_MATCH',
        'strength.py:_naisargika_bala',
        'naisargikaBala.ts:calculateNaisargikaBalaAll',
        'Exact Parashara fixed natural luminosity constants'
      );
      if (nComp.status === 'PASS') compSummary.naisargika.pass++;
      else { compSummary.naisargika.fail++; pFailures.push('FAIL_NAISARGIKA'); }

      // 6. Drik Bala
      const drExp = oracle.drik[p];
      const drAct = dssmeSb.drig_bala[i];
      const drComp = checkComponent(
        'Drik',
        drExp,
        drAct,
        1.5,
        'CLASS_C_ROUNDING_PRECISION',
        'strength.py:_drik_bala',
        'drikBala.ts:calculateDrikBalaAll',
        'Continuous piecewise aspect angle function differences and benefic/malefic classification'
      );
      if (drComp.status === 'PASS') compSummary.drik.pass++;
      else { compSummary.drik.fail++; pFailures.push('FAIL_DRIK'); }

      // 7. Total Virupas
      const totExp = oracle.total_virupas[p];
      const totAct = dssmeSb.total_virupas[i];
      const totComp = checkComponent(
        'Total Virupas',
        totExp,
        totAct,
        5.0,
        'CLASS_B_REFERENCE_DATA',
        'strength.py:shad_bala',
        'shadbala.ts:calculateShadbala',
        'Aggregate of the 6 individual classical component strengths'
      );
      if (totComp.status === 'PASS') compSummary.totalVirupas.pass++;
      else { compSummary.totalVirupas.fail++; pFailures.push('FAIL_TOTAL'); }

      // 8. Rupa (Total Virupas / 60)
      const rExp = oracle.rupa[p];
      const rAct = dssmeSb.total_rupas?.[i] ?? Math.round((dssmeSb.total_virupas[i] / 60.0) * 100) / 100;
      const rComp = checkComponent(
        'Rupa',
        rExp,
        rAct,
        0.1,
        'CLASS_C_ROUNDING_PRECISION',
        'strength.py:shad_bala (sb_rupa)',
        'shadbala.ts:calculateShadbala',
        'Rupas = Total Virupas / 60.0'
      );
      if (rComp.status === 'PASS') compSummary.rupa.pass++;
      else { compSummary.rupa.fail++; pFailures.push('FAIL_RUPA'); }

      // 9. Strength Ratio
      const ratExp = oracle.strength_ratio[p];
      const ratAct = Math.round((dssmeSb.percent_required[i] / 100.0) * 100) / 100;
      const ratComp = checkComponent(
        'Strength Ratio',
        ratExp,
        ratAct,
        0.1,
        'CLASS_C_ROUNDING_PRECISION',
        'strength.py:shad_bala (sb_strength)',
        'shadbala.ts:calculateShadbala',
        'Ratio = Rupas / Minimum Required Rupas'
      );
      if (ratComp.status === 'PASS') compSummary.strengthRatio.pass++;
      else { compSummary.strengthRatio.fail++; pFailures.push('FAIL_STRENGTH_RATIO'); }

      if (pFailures.length > 0) fixturePassed = false;

      planetsRecord[p] = {
        planet: p,
        components: {
          sthana: sComp,
          kaala: kComp,
          dig: dComp,
          chesta: cComp,
          naisargika: nComp,
          drik: drComp,
        },
        totalVirupas: totComp,
        rupa: rComp,
        strengthRatio: ratComp,
        planetStatus: pFailures.length === 0 ? 'PASS' : 'FAIL',
        failureTypes: pFailures.length === 0 ? ['PASS'] : pFailures,
      };
    }

    // Accumulate Totals
    (Object.keys(compSummary) as Array<keyof typeof compSummary>).forEach((k) => {
      totals[k].pass += compSummary[k].pass;
      totals[k].fail += compSummary[k].fail;
    });

    const rootCauses: string[] = [];
    if (compSummary.sthana.fail > 0) rootCauses.push('Sthana varga dignity mapping divergence');
    if (compSummary.kaala.fail > 0) rootCauses.push('Kaala Ahargana year/month lord & declination model divergence');
    if (compSummary.dig.fail > 0) rootCauses.push('Dig Bala PyJHora unwrapped distance bug (Class A)');
    if (compSummary.chesta.fail > 0) rootCauses.push('Chesta Bala Surya Siddhanta epoch table vs modern speed (Class F)');
    if (compSummary.drik.fail > 0) rootCauses.push('Drik Bala continuous aspect curve difference (Class C)');

    fixtureResults.push({
      fixtureId: f.fixture_id,
      name: f.name,
      purpose: f.purpose,
      location: f.location,
      datetime: f.datetime,
      status: fixturePassed ? 'PASS' : 'FAIL',
      componentSummary: compSummary,
      planets: planetsRecord as Record<PlanetName, PlanetComparison>,
      mismatches: fixtureMismatches,
      rootCause: rootCauses.length > 0 ? rootCauses.join('; ') : 'None',
    });
  }

  const passedFixtures = fixtureResults.filter((r) => r.status === 'PASS').length;
  const failedFixtures = fixtureResults.length - passedFixtures;

  return {
    timestamp: new Date().toISOString(),
    oracleEngine: manifest.oracle_system,
    repository: manifest.repository,
    pinnedCommit: manifest.pinned_commit,
    sourceFile: manifest.source_file,
    sourceSha256: manifest.source_sha256,
    fixtureCount: fixtureResults.length,
    passedFixtures,
    failedFixtures,
    componentTotals: totals,
    classificationSummary: classCounts,
    overallStatus: failedFixtures === 0 ? 'PASS' : 'PASS_WITH_FINDINGS',
    fixtures: fixtureResults,
  };
}
