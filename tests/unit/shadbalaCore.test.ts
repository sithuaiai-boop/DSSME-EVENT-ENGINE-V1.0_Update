/**
 * DIRECT TEST: Verify src/engine/shadbala/shadbalaCore.ts
 * against tests/oracle/pyjhora-v2/pyjhora_oracle_v2_kaala_components.json
 * across all 5 independent fixtures (315 assertions).
 */

import fs from 'node:fs';
import path from 'node:path';
import { calculateKaalaBala, SHADBALA_PLANETS } from '../../src/engine/shadbala/shadbalaCore.js';

const KAALA_COMPONENTS = [
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

async function runTest() {
  const oraclePath = path.resolve(process.cwd(), 'tests/oracle/pyjhora-v2/pyjhora_oracle_v2_kaala_components.json');
  const oracleRaw = fs.readFileSync(oraclePath, 'utf-8');
  const oracle = JSON.parse(oracleRaw);

  console.log('====================================================');
  console.log('SHADBALA CORE: KAALA BALA 5-FIXTURE VERIFICATION');
  console.log('====================================================');
  console.log(`Oracle: ${oraclePath}`);
  console.log(`Fixtures to test: ${oracle.fixtures.length}`);

  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  let maxDelta = 0;

  for (const fix of oracle.fixtures) {
    console.log(`\nTesting Fixture ${fix.fixture_id} (${fix.name})...`);

    const result = await calculateKaalaBala({
      date: fix.input.date,
      time: fix.input.time,
      latitude: fix.input.latitude,
      longitude: fix.input.longitude,
      timezoneOffset: fix.input.timezone_offset,
    });

    for (const pName of SHADBALA_PLANETS) {
      const actualBreakdown = result[pName];
      const expectedBreakdown = fix.components[pName];

      for (const comp of KAALA_COMPONENTS) {
        totalAssertions++;
        const act = (actualBreakdown as any)[comp];
        const exp = expectedBreakdown[comp];
        const delta = Math.abs(Math.round((act - exp) * 100) / 100);

        if (delta > maxDelta) maxDelta = delta;

        if (delta <= 0.01) {
          passedAssertions++;
        } else {
          failedAssertions++;
          console.error(`  FAIL: [${fix.fixture_id}] ${pName}.${comp}: expected ${exp}, got ${act} (delta ${delta})`);
        }
      }

      // Check total
      totalAssertions++;
      const actTot = actualBreakdown.total;
      const expTot = expectedBreakdown.total;
      const totDelta = Math.abs(Math.round((actTot - expTot) * 100) / 100);
      if (totDelta <= 0.01) {
        passedAssertions++;
      } else {
        failedAssertions++;
        console.error(`  FAIL: [${fix.fixture_id}] ${pName}.total: expected ${expTot}, got ${actTot} (delta ${totDelta})`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED: ${passedAssertions} / ${totalAssertions} (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
  console.log(`FAILED: ${failedAssertions}`);
  console.log(`MAX DELTA: ${maxDelta}`);
  console.log('====================================================');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
