import { runDifferentialTestSuite } from './shadbalaDifferential.test.js';
import { runBhavaFirewallTest } from './bhavaFirewall.test.js';
import { runShadbalaGoldenTests } from '../../src/engine/strength/shadbalaGoldenTests.js';

async function main() {
  console.log('======================================================================');
  console.log('DSSME EVENT ENGINE V1.0 - INDEPENDENT PYJHORA DIFFERENTIAL AUDIT (V2)');
  console.log('======================================================================');

  console.log('\n[TEST 1] BHAVA BALA FIREWALL TEST');
  const fw = await runBhavaFirewallTest();
  console.log('Status:', fw.passed ? 'PASS' : 'FAIL');
  console.log('Checks:', fw.passedChecks + ' / ' + fw.totalChecks);
  console.log('Details:', fw.details);

  console.log('\n[TEST 2] 18-FIXTURE INDEPENDENT PYJHORA V2 DIFFERENTIAL AUDIT');
  const rep = await runDifferentialTestSuite();
  console.log('Oracle Engine:', rep.oracleEngine);
  console.log('Repository:', rep.repository);
  console.log('Pinned Commit:', rep.pinnedCommit);
  console.log('Source File:', rep.sourceFile);
  console.log('Source SHA-256:', rep.sourceSha256);
  console.log('Total Fixtures:', rep.fixtureCount);
  console.log('Passed Fixtures:', rep.passedFixtures);
  console.log('Failed / Finding Fixtures:', rep.failedFixtures);
  console.log('Overall Status:', rep.overallStatus);

  console.log('\n--- COMPONENT SUMMARY (Checks: 18 fixtures x 7 planets = 126 total per component) ---');
  for (const [k, v] of Object.entries(rep.componentTotals)) {
    console.log(`  ${k.padEnd(16)}: ${String(v.pass).padStart(3)} PASS | ${String(v.fail).padStart(3)} FINDINGS/DIFF`);
  }

  console.log('\n--- DIFFERENCE CLASSIFICATION BREAKDOWN ---');
  for (const [cls, count] of Object.entries(rep.classificationSummary)) {
    console.log(`  ${cls.padEnd(30)}: ${String(count).padStart(4)}`);
  }

  console.log('\n--- SAMPLE REPRESENTATIVE MISMATCHES (FIXTURE & PLANET LEVEL) ---');
  let printedCount = 0;
  for (const f of rep.fixtures) {
    if (f.mismatches.length > 0 && printedCount < 8) {
      console.log(`\nFixture [${f.fixtureId}] ${f.name}:`);
      for (const m of f.mismatches.slice(0, 3)) {
        console.log(`  * ${m.component.padEnd(18)}: PyJHora=${String(m.expected).padStart(6)} | DSSME=${String(m.actual).padStart(6)} | Delta=${String(m.delta).padStart(6)} (Tol: ${m.tolerance}) | [${m.classification}]`);
        if (m.explanation) {
          console.log(`    Note: ${m.explanation}`);
        }
        printedCount++;
      }
    }
  }

  console.log('\n--- FIXTURE INVENTORY & DIAGNOSTIC ROOT CAUSES ---');
  for (const f of rep.fixtures) {
    console.log(`[${f.fixtureId}] ${f.name.padEnd(32)} -> ${f.status} | Root: ${f.rootCause}`);
  }

  console.log('\n[TEST 3] REAL PYJHORA GOLDEN TEST (CHOFU MASTER BENCHMARK)');
  const golden = await runShadbalaGoldenTests();
  console.log(`Checks: ${golden.totalChecks} | Exact: ${golden.exactCount} | Close: ${golden.closeCount} | Diff: ${golden.diffCount}`);
  console.log('======================================================================');
}

main().catch(err => {
  console.error('Error running differential suite:', err);
  process.exit(1);
});
