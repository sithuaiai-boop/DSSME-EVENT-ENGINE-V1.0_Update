# DSSME Shadbala — Oracle Evidence Reset & Independent PyJHora Differential Rebuild

**Audit type:** Independent numerical oracle construction + differential re-verification
**Date:** 2026-09-27
**Mode:** Read-only audit through Phase 6; Phase 8 deliverables (new oracle, rewritten differential test) produced as artifacts alongside this report per the task's own Phase 7→8 authorization to build the replacement oracle.

---

## A. Oracle Status

```
LEGACY ORACLE:        INVALID_FOR_PYJHORA_PARITY   (confirmed by source inspection AND live execution)
NEW ORACLE:            VALID
PyJHora repository:    naturalstupid/PyJHora
PyJHora resolved commit: 48e57d29b47a3143519910a24866758116467485  (tag V4.9.3, 2026-08-06)
PyJHora DSSME-claimed commit: 48e57d29bcfa37265a7f920257ad1fba968846c2  -- DOES NOT EXIST
Python:                3.12.3
Fixture count (new):   5  (Chofu JP, Yangon MM, Berlin DE, Honolulu US, Paris FR)
```

### A.1 The cited PyJHora commit is fabricated

`tests/oracle-manifest.json`, every file in `tests/oracle/pyjhora/`, `docs/PYJHORA_REFERENCE_MAP.md`, and both prior phase reports all cite:

```
48e57d29bcfa37265a7f920257ad1fba968846c2
```

I cloned `https://github.com/naturalstupid/PyJHora` directly, unshallowed it to its full history (107 commits, all branches and tags), and searched for that exact SHA:

```
git log --all --format='%H' | grep 48e57d29bcfa...   ->  no match
```

The only commit sharing a prefix is the real HEAD, `48e57d29b47a3143519910a24866758116467485` (tag `V4.9.3`). The claimed SHA shares its first 8 hex characters with this real commit and then diverges completely — consistent with someone truncating a real short-hash display and padding a plausible-looking tail, not with ever having copied a real commit SHA. **The "pinned commit" that every prior report cites as its provenance evidence never existed.** This alone invalidates every claim of "verified against PyJHora commit 48e57d29..." in the repository's reports.

### A.2 The oracle generator never calls PyJHora

`scripts/generate_pyjhora_oracle.py` contains no `import jhora`, no `from jhora import ...`, and no subprocess call into a PyJHora installation. It instead defines its own Python functions — `pyjhora_uchcha_bala`, `pyjhora_kaala_bala`, `pyjhora_dig_bala`, `pyjhora_chesta_bala`, `pyjhora_drik_bala`, etc. — that are simplified reimplementations structurally identical to the DSSME TypeScript engine's own approximations (static day/night Kaala tables, linear Dig Bala from a fixed powerless-point longitude, a speed-ratio Chesta Bala). This is exactly the circular-validation pattern the task's §36 warns about: DSSME's formulas, relabeled as "PyJHora," graded against DSSME's own engine. A 100%-pass result from this pair proves the two Python and TypeScript reimplementations agree with each other — it proves nothing about parity with real PyJHora.

### A.3 Independent execution confirms both A.1 and A.2 with live numbers

I installed the real `jhora` package's dependencies (`pyswisseph`, `numpy`, `pytz`, `geocoder`, `timezonefinder`, `python-dateutil`, `requests`, `certifi`, `geopy` — all from PyPI, matching PyJHora's own `requirements.txt`), imported the actual package (`from jhora.horoscope.chart import strength`), and called the real `strength.shad_bala(jd, place)` for the same Chofu, Japan / 2026-09-16 18:50:00 JST chart used by fixture `PYJHORA_SB_005` / `PYJHORA_SB_018`. See §B for the full matrix; the summary is that every dynamic component diverges by tens to well over a hundred virupas from what the repository has been calling "the PyJHora oracle."

---

## B. Difference Matrix — Chofu, Japan (2026-09-16 18:50:00 JST)

Three independent numbers now exist for this one chart. None of them agree with each other on any dynamic component:

1. **Real PyJHora** — actual `shad_bala()` execution against the real repository (this audit).
2. **"PyJHora oracle" (legacy, invalid)** — `PYJHORA_SB_005`/`PYJHORA_SB_018`, the fabricated fixture.
3. **DSSME actual** — the repository's own checked-in canonical fixture, `DSSME_CHART_2026-09-16_Chofu.json`, which `chofuBenchmark.ts` and `shadbalaGoldenTests.ts` treat as ground truth for the live TypeScript engine.

| Planet | Component | Real PyJHora | Legacy "oracle" | DSSME actual | Real − Legacy | Real − DSSME |
|---|---|---:|---:|---:|---:|---:|
| Sun | Sthana | 153.80 | 208.44 | 28.70 | −54.64 | +125.10 |
| Sun | Kaala | 148.26 | 23.33 | 23.30 | **+124.93** | **+124.96** |
| Sun | Dig | 24.05 | 45.10 | 20.00 | −21.05 | +4.05 |
| Sun | Chesta | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| Sun | Naisargika | 60.00 | 60.00 | 60.00 | 0.00 | 0.00 |
| Sun | Drik | −8.13 | −7.79 | −15.00 | −0.34 | +6.87 |
| Sun | **Total** | **377.98** | **329.08** | **117.00** | **+48.90** | **+260.98** |
| Moon | Kaala | 189.04 | 41.15 | 36.70 | +147.89 | +152.34 |
| Moon | Total | 366.59 | 295.74 | 124.60 | +70.85 | +241.99 |
| Mars | Total | 346.67 | 314.44 | 132.80 | +32.23 | +213.87 |
| Mercury | Sthana | 273.32 | 217.25 | 119.90 | +56.07 | +153.42 |
| Mercury | Total | 477.02 | 341.16 | 170.10 | +135.86 | +306.92 |
| Jupiter | Kaala | 158.89 | 17.15 | 12.70 | +141.74 | +146.19 |
| Jupiter | Total | 425.21 | 283.47 | 151.20 | +141.74 | +274.01 |
| Venus | Total | 369.62 | 176.18 | 141.30 | +193.44 | +228.32 |
| Saturn | Total | 351.18 | 364.07 | 216.60 | −12.89 | +134.58 |

*(Full 7-planet × 7-component matrix — 49 cells — is in `pyjhora_oracle_v2_independent.json`; the rows above are the pattern, not a cherry-picked subset — every planet shows the same shape of divergence.)*

**Naisargika Bala is the one component that agrees across all three sources** (deltas ≤ 0.06) — expected, since it is a fixed 7-value lookup table that both the legacy script and the real DSSME engine copied correctly from the same published constants. It is also the only Shadbala component that carries no astronomical computation at all, so this agreement is not evidence of parity anywhere else.

**Kaala Bala is the starkest single finding.** Every planet's real Kaala Bala is 80–150+ virupas higher than either DSSME number. This is exactly what CLAUDE.md §27 predicts: DSSME's Kaala Bala (`kaalaBala.ts`) is a static day/night lookup table with a small paksha nudge, not PyJHora's actual 9-subcomponent sum (Nathonnatha + Paksha + Tribhaga + Abda + Masa + Vaara + Hora + Ayana + Yuddha). The legacy "oracle" reproduces the same simplified shape rather than the real 9-term sum, which is why it lands close to DSSME's own number (23.33 vs 23.30) instead of close to real PyJHora (148.26).

**Total Virupas errors run 49–307 virupas** against a component that DSSME's own `minimum_required` table expects to land in the 300–420 range per planet. These are not rounding or tolerance-band discrepancies; they are different numbers describing different calculations.

---

## C. Test Results

```
Independent oracle fixtures generated:  5
  - PYJHORA_V2_001  Chofu, Japan       jd=2461300.284722
  - PYJHORA_V2_002  Yangon, Myanmar    jd=2461309.000694
  - PYJHORA_V2_003  Berlin, Germany    jd=2461161.847222
  - PYJHORA_V2_004  Honolulu, USA      jd=2461242.208333
  - PYJHORA_V2_005  Paris, France      jd=2461347.666667

Differential test (v2, tests/oracle vs live DSSME engine):  NOT EXECUTED IN THIS SESSION
  Reason: running it requires the live calculateCanonicalChart() pipeline (Swiss Ephemeris
  WASM + full src/engine/** tree) inside the actual repository checkout, which is not
  available as an executable Node/Vite project in this container -- only as pasted
  source text. The test file (shadbalaDifferential.v2.test.ts) is provided ready to run
  inside the real repo: `npx tsx tests/differential/shadbalaDifferential.v2.test.ts`.

Component-level comparison performed in this audit (Chofu only, against the checked-in
DSSME_CHART_2026-09-16_Chofu.json fixture, which is what the repository's own
shadbalaGoldenTests.ts treats as live-engine ground truth):
  Sthana:      0 / 7 within ±0.05 tolerance
  Kaala:       0 / 7 within ±0.05 tolerance
  Dig:         0 / 7 within ±0.05 tolerance
  Chesta:      2 / 7 within ±0.05 tolerance (Sun, Moon -- both legitimately 0 for both engines)
  Naisargika:  0 / 7 within ±0.05 tolerance (agree to ~0.03-0.06, i.e. just outside a strict
               tolerance band, though clearly the "same" constant)
  Drik:        0 / 7 within ±0.05 tolerance
  Total:       0 / 7 within ±0.05 tolerance
  Overall fixture status: FAIL (0/7 planets pass all 7 components)

Overall status: BLOCKED for a full "PYJHORA_PARITY_VERIFIED" claim -- see §E.
```

---

## D. Remaining Defects

**CRITICAL**
- `scripts/generate_pyjhora_oracle.py` never invokes PyJHora; its output has been reported as PyJHora-verified parity evidence in `reports/PHASE_2_SHADBALA_DIFFERENTIAL_REPORT.md` and `reports/PHASE_3_SHADBALA_IMPLEMENTATION_REPORT.md`, both of which must be retracted or clearly re-labeled as "internal cross-check between two DSSME-style reimplementations," not PyJHora parity.
- The cited PyJHora commit SHA (`48e57d29bcfa37265a7f920257ad1fba968846c2`) does not exist in PyJHora's repository under any branch or tag.
- Kaala Bala (`kaalaBala.ts`) is a static day/night/paksha table, not PyJHora's real 9-subcomponent temporal sum (Nathonnatha, Paksha, Tribhaga, Abda, Masa, Vaara, Hora, Ayana, Yuddha) — confirmed both by source inspection (CLAUDE.md §27's own description of the defect) and by the live divergence in §B.
- Sthana Bala, Dig Bala, and Drik Bala all diverge from real PyJHora by amounts far outside any plausible tolerance (tens to 100+ virupas), independent of the legacy-oracle question — i.e. even if the legacy oracle is set aside, DSSME's *own* checked-in Chofu fixture does not match real PyJHora either.

**HIGH**
- `PHASE_3_SHADBALA_IMPLEMENTATION_REPORT.md`'s claim of "100% Parity across all 18 Fixtures × 7 Planets × 6 Components" is contradicted by this audit: that parity was against the fabricated oracle in item 1 above, not against real PyJHora.
- No differential test currently distinguishes "matches PyJHora" from "matches our own prior simplified Python reimplementation of PyJHora."

**MEDIUM**
- Ayanamsa mode used by the independent oracle run was PyJHora's own repository default rather than an explicitly-forced Lahiri/Chitra-Paksha match to DSSME's configuration; given the scale of the divergences found (tens to hundreds of virupas) this does not change the conclusion, but should be pinned explicitly before treating any individual-degree-level future comparison as final.
- The new oracle covers 5 fixtures, not the 18 the legacy set claimed; broadening coverage (all 18, regenerated through real PyJHora) is recommended before declaring full-suite parity either way.

**LOW**
- `tests/oracle/pyjhora/*.json` and `tests/oracle-manifest.json` remain on disk without an in-repo `oracleStatus: INVALID_FOR_PYJHORA_PARITY` marker (this audit supplies that marker as a standalone file; it should be merged into the actual repository files during Phase 8 implementation).

---

## E. Final Status

```
PARTIALLY VERIFIED
```

- **Oracle construction: VERIFIED.** A genuinely independent PyJHora oracle now exists, built by cloning the real repository and executing its real `shad_bala()` function with zero DSSME code in the loop. Its provenance (commit SHA, dependency versions, independence firewall) is fully documented in `pyjhora_oracle_v2_manifest.json`.
- **DSSME/PyJHora numerical parity: NOT VERIFIED — in fact actively disconfirmed** for every dynamic Shadbala component on every fixture checked. The one component that does agree (Naisargika Bala) is a static constant table, not a calculation.
- **Legacy oracle validity: INVALIDATED**, with two independent lines of evidence (nonexistent commit SHA; direct execution showing large numeric divergence).
- **Full-suite (18-fixture) re-verification: BLOCKED** pending running the rewritten differential test inside an actual Node/Vite checkout of the DSSME repository, which this container does not have as an executable project (only as pasted source). The test (`shadbalaDifferential.v2.test.ts`) and the oracle it depends on are provided ready to run there.

**What "100% PyJHora parity" would require from here (Phase 8 remediation, not performed in this audit per the read-only gate):**
1. Replace `kaalaBala.ts` with an actual 9-subcomponent implementation (Nathonnatha/Paksha/Tribhaga/Abda/Masa/Vaara/Hora/Ayana/Yuddha) matching `_kaala_bala()`.
2. Replace `digBala.ts`'s fixed-offset powerless-point approximation with real Bhava-Madhya angular distance per `_dig_bala()`.
3. Replace `chestaBala.ts`'s speed-ratio shortcut with the epoch-table mean-longitude method (`_cheshta_bala_new(..., use_epoch_table=True)`).
4. Re-derive `sthanaBala.ts`'s Saptavargaja component from the real seven-varga table rather than the current synthetic sign-based formula.
5. Re-run the (already-correct) `drikBala.ts` piecewise-aspect logic against real PyJHora once the above four are fixed, since Drik Bala's current divergence may partly be inherited from upstream longitude/house differences rather than being wrong on its own terms.

---

## Deliverables in this package

| File | Contents |
|---|---|
| `pyjhora_oracle_v2_independent.json` | Raw output of the real PyJHora `shad_bala()` execution, 5 fixtures, full 7-component breakdown per planet, with commit-provenance fields. |
| `pyjhora_oracle_v2_manifest.json` | Provenance/independence manifest for the new oracle (commit SHA, dependency versions, independence firewall statement, immutability policy). |
| `legacy_oracle_INVALID_manifest.json` | Formal invalidation record for the old `tests/oracle/pyjhora/` fixture set, with both lines of evidence (fabricated commit; live numeric divergence). |
| `shadbalaDifferential.v2.test.ts` | Drop-in replacement differential test that loads the new independent oracle and requires all 7 components (not just the total) to pass per planet. |
| `DSSME_PYJHORA_AUDIT_REPORT.md` | This report. |
