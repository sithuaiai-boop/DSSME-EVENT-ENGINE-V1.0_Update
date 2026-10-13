import { calculateEphemerisSnapshot } from '../../src/engine/astronomy/ephemeris.js';
import { calculateKaalaBalaAll } from '../../src/engine/strength/kaalaBala.js';
import pl9Data from '../oracle/parashara-light-9/pl9_chofu_kaala.json';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

async function runPL9Verification() {
  console.log('====================================================');
  console.log('PARASHARA LIGHT 9 KAALA BALA VERIFICATION');
  console.log('====================================================');
  console.log('Oracle: tests/oracle/parashara-light-9/pl9_chofu_kaala.json');
  console.log('Engine Target: Parashara Light 9 Standard (PL9)');

  const snap = await calculateEphemerisSnapshot(
    pl9Data.input.date + ' ' + pl9Data.input.time,
    pl9Data.input.latitude,
    pl9Data.input.longitude,
    pl9Data.input.timezone_offset
  );

  const { totals, breakdowns } = calculateKaalaBalaAll({
    julianDay: snap.jdUtc,
    latitude: pl9Data.input.latitude,
    longitude: pl9Data.input.longitude,
    timezoneOffset: pl9Data.input.timezone_offset,
    datetime: pl9Data.input.date + 'T' + pl9Data.input.time,
    timeStr: pl9Data.input.time,
    planets: snap.planets as any,
    standard: 'PL9',
  });

  let passedAssertions = 0;
  let totalAssertions = 0;

  for (let p = 0; p < PLANETS.length; p++) {
    const pName = PLANETS[p];
    const exp = (pl9Data.planets as any)[pName];
    const actBreakdown = breakdowns[p];
    const actTotal = totals[p];

    console.log(`\nPlanet: ${pName}`);
    console.log(`  Nata-Unnata:  exp=${exp.nata_unnata}, act=${actBreakdown.nathonnatha}`);
    console.log(`  Paksha:       exp=${exp.paksha}, act=${actBreakdown.paksha}`);
    console.log(`  Tri-Bhaga:    exp=${exp.tribhaga}, act=${actBreakdown.tribhaga}`);
    console.log(`  Varsha:       exp=${exp.varsha}, act=${actBreakdown.abda}`);
    console.log(`  Maasa:        exp=${exp.maasa}, act=${actBreakdown.masa}`);
    console.log(`  Vaara:        exp=${exp.vaara}, act=${actBreakdown.vaara}`);
    console.log(`  Hora:         exp=${exp.hora}, act=${actBreakdown.hora}`);
    console.log(`  Ayana:        exp=${exp.ayana}, act=${actBreakdown.ayana}`);
    console.log(`  Yuddha:       exp=${exp.yuddha}, act=${actBreakdown.yuddha}`);
    console.log(`  TOTAL:        exp=${exp.kaala_total}, act=${actTotal}`);

    const checks = [
      { name: 'nata_unnata', exp: exp.nata_unnata, act: actBreakdown.nathonnatha },
      { name: 'paksha', exp: exp.paksha, act: actBreakdown.paksha },
      { name: 'tribhaga', exp: exp.tribhaga, act: actBreakdown.tribhaga },
      { name: 'varsha', exp: exp.varsha, act: actBreakdown.abda },
      { name: 'maasa', exp: exp.maasa, act: actBreakdown.masa },
      { name: 'vaara', exp: exp.vaara, act: actBreakdown.vaara },
      { name: 'hora', exp: exp.hora, act: actBreakdown.hora },
      { name: 'ayana', exp: exp.ayana, act: actBreakdown.ayana },
      { name: 'yuddha', exp: exp.yuddha, act: actBreakdown.yuddha },
      { name: 'kaala_total', exp: exp.kaala_total, act: actTotal },
    ];

    for (const c of checks) {
      totalAssertions++;
      const diff = Math.abs(Math.round((c.act - c.exp) * 100) / 100);
      if (diff <= 0.05) {
        passedAssertions++;
      } else {
        console.error(`  FAIL on ${pName} ${c.name}: exp=${c.exp}, act=${c.act}, diff=${diff}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`RESULT: ${passedAssertions} / ${totalAssertions} assertions passed (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
  console.log('====================================================');

  if (passedAssertions !== totalAssertions) {
    process.exit(1);
  }
}

runPL9Verification().catch((e) => {
  console.error(e);
  process.exit(1);
});
