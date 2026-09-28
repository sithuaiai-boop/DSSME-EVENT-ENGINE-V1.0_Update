import { runIndependentDifferentialSuite } from './shadbalaDifferential.v2.test.js';
import { runBhavaFirewallTest } from './bhavaFirewall.test.js';
import { runShadbalaGoldenTests } from './shadbalaGolden.test.js';

async function main() {
  console.log('======================================================================');
  console.log('DSSME EVENT ENGINE V1.0 - INDEPENDENT PYJHORA DIFFERENTIAL AUDIT (V2)');
  console.log('======================================================================');

  console.log('\n[TEST 1] BHAVA BALA FIREWALL TEST');
  const fw = await runBhavaFirewallTest();
  console.log('Status:', fw.passed ? 'PASS' : 'FAIL');
  console.log('Checks:', fw.passedChecks + ' / ' + fw.totalChecks);
  console.log('Details:', fw.details);

  console.log('\n[TEST 2] INDEPENDENT PYJHORA V2 DIFFERENTIAL AUDIT');
  const rep = await runIndependentDifferentialSuite();
  console.log('Oracle Status:', rep.oracleStatus);
  console.log('Repository:', rep.oracleRepository);
  console.log('Resolved Commit:', rep.oracleResolvedCommit);
  console.log('Total Fixtures:', rep.fixtureCount);
  console.log('Passed Fixtures:', rep.passedFixtures);
  console.log('Failed Fixtures:', rep.failedFixtures);
  console.log('Overall Status:', rep.overallStatus);

  console.log('\n[TEST 3] REAL PYJHORA GOLDEN TEST (CHOFU MASTER BENCHMARK)');
  const golden = await runShadbalaGoldenTests();
  console.log(`Checks: ${golden.totalChecks} | Exact: ${golden.exactCount} | Close: ${golden.closeCount} | Diff: ${golden.diffCount}`);
}

main().catch((err) => {
  console.error('Error running test suite:', err);
  process.exit(1);
});
