/**
 * PHASE 8.2 STHANA BALA VERIFICATION SUITE
 * Tests src/engine/strength/sthanaBala.ts directly against
 * tests/oracle/pyjhora-v2/sthana_bala_ground_truth_pyjhora_LAHIRI.json
 * across all 5 independent fixtures.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  toD1,
  d2Hora,
  d3Drekkana,
  d7Saptamsha,
  d9Navamsha,
  d12Dwadasamsha,
  d30Trimsamsha,
  calculateUchchaBalaFaithful,
  calculateOjayugamaBalaFaithful,
  calculateKendraBalaFaithful,
  calculateDreshkonBalaFaithful,
  calculateSaptavargajaBalaAllFaithful,
  calculateSthanaBalaAll,
} from '../../src/engine/strength/sthanaBala.js';
import { SHADBALA_PLANETS } from '../../src/engine/strength/shadbalaConstants.js';

// Ascendant signs for the 5 fixtures (calculated via SwissEph Lahiri)
const FIXTURE_LAGNA_SIGNS: Record<string, number> = {
  PYJHORA_V2_001: 11, // Chofu: Pisces (11)
  PYJHORA_V2_002: 8,  // Yangon: Sagittarius (8)
  PYJHORA_V2_003: 2,  // Berlin: Gemini (2)
  PYJHORA_V2_004: 8,  // Honolulu: Sagittarius (8)
  PYJHORA_V2_005: 5,  // Paris: Virgo (5)
};

async function runSthanaTest() {
  const oraclePath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/sthana_bala_ground_truth_pyjhora_LAHIRI.json');
  const oracleRaw = fs.readFileSync(oraclePath, 'utf-8');
  const oracle = JSON.parse(oracleRaw);

  console.log('====================================================');
  console.log('PHASE 8.2: STHANA BALA 5-FIXTURE VERIFICATION');
  console.log('====================================================');
  console.log(`Oracle: ${oraclePath}`);
  console.log(`Fixtures to test: ${oracle.fixtures.length}`);

  let vargaChecks = 0;
  let vargaPassed = 0;
  let compChecks = 0;
  let compPassed = 0;
  let totalChecks = 0;
  let totalPassed = 0;

  for (const fix of oracle.fixtures) {
    const fixId = fix.fixture_id;
    const ascSign = FIXTURE_LAGNA_SIGNS[fixId];
    console.log(`\nTesting Fixture ${fixId} (Ascendant Sign: ${ascSign})...`);

    // Extract planet longitudes from rasi_h_long
    const longitudes = fix.rasi_h_long.map(([sign, deg]: [number, number]) => sign * 30 + deg);
    const d1 = toD1(longitudes);

    // 1. Verify Varga sign placements
    const v1 = d1.map(p => p.sign);
    const v2 = d2Hora(d1);
    const v3 = d3Drekkana(d1);
    const v7 = d7Saptamsha(d1);
    const v9 = d9Navamsha(d1);
    const v12 = d12Dwadasamsha(d1);
    const v30 = d30Trimsamsha(d1);

    const calculatedVargas: Record<string, number[]> = {
      '1': v1, '2': v2, '3': v3, '7': v7, '9': v9, '12': v12, '30': v30
    };

    for (const dcf of ['1', '2', '3', '7', '9', '12', '30']) {
      const expSigns = fix.vargas[dcf];
      const actSigns = calculatedVargas[dcf];
      for (let p = 0; p < 7; p++) {
        vargaChecks++;
        if (actSigns[p] === expSigns[p]) {
          vargaPassed++;
        } else {
          console.error(`  FAIL Varga D${dcf} [${fixId}] ${SHADBALA_PLANETS[p]}: exp ${expSigns[p]}, got ${actSigns[p]}`);
        }
      }
    }

    // 2. Verify Subcomponents
    const ub = calculateUchchaBalaFaithful(d1);
    const ob = calculateOjayugamaBalaFaithful(d1, v9);
    const kb = calculateKendraBalaFaithful(d1, ascSign);
    const db = calculateDreshkonBalaFaithful(d1);
    const svb = calculateSaptavargajaBalaAllFaithful(d1);

    const components = [
      { name: 'Uchcha', act: ub, exp: fix.uchcha },
      { name: 'Ojayugama', act: ob, exp: fix.ojayugama },
      { name: 'Kendra', act: kb, exp: fix.kendra },
      { name: 'Dreshkon', act: db, exp: fix.dreshkon },
      { name: 'Saptavargaja', act: svb, exp: fix.saptavargaja.slice(0, 7) },
    ];

    for (const comp of components) {
      for (let p = 0; p < 7; p++) {
        compChecks++;
        const delta = Math.abs(Math.round((comp.act[p] - comp.exp[p]) * 100) / 100);
        if (delta <= 0.05) {
          compPassed++;
        } else {
          console.error(`  FAIL ${comp.name} [${fixId}] ${SHADBALA_PLANETS[p]}: exp ${comp.exp[p]}, got ${comp.act[p]} (delta ${delta})`);
        }
      }
    }

    // 3. Verify Sthana Totals via calculateSthanaBalaAll
    const mockPlanets: any = {};
    SHADBALA_PLANETS.forEach((name, i) => {
      mockPlanets[name] = { totalLongitude: longitudes[i] };
    });

    const res = calculateSthanaBalaAll(mockPlanets, ascSign);
    for (let p = 0; p < 7; p++) {
      totalChecks++;
      const actTot = res.totals[p];
      const expTot = fix.sthana_total[p];
      const delta = Math.abs(Math.round((actTot - expTot) * 100) / 100);
      if (delta <= 0.05) {
        totalPassed++;
      } else {
        console.error(`  FAIL Total [${fixId}] ${SHADBALA_PLANETS[p]}: exp ${expTot}, got ${actTot} (delta ${delta})`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`VARGA PLACEMENT ASSERTIONS: ${vargaPassed} / ${vargaChecks} (${((vargaPassed / vargaChecks) * 100).toFixed(1)}%)`);
  console.log(`SUBCOMPONENT ASSERTIONS:    ${compPassed} / ${compChecks} (${((compPassed / compChecks) * 100).toFixed(1)}%)`);
  console.log(`TOTAL BALA ASSERTIONS:      ${totalPassed} / ${totalChecks} (${((totalPassed / totalChecks) * 100).toFixed(1)}%)`);
  console.log('====================================================');

  if (vargaPassed !== vargaChecks || compPassed !== compChecks || totalPassed !== totalChecks) {
    process.exit(1);
  }
}

runSthanaTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
