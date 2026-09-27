# PHASE 8.1 KAALA BALA IMPLEMENTATION REPORT

---

## 1. Implementation Objective

The primary objective of **Phase 8.1: Kaala Bala (Temporal Strength)** is to establish complete mathematical, astronomical, and structural parity between DSSME Event Engine V1.0 and the pinned reference PyJHora codebase (`naturalstupid/PyJHora`, commit `48e57d29b47a3143519910a24866758116467485`, tag `V4.9.3`) for all nine classical subcomponents:
1. Nathonnatha Bala (`_nathonnath_bala`)
2. Paksha Bala (`_paksha_bala`)
3. Tribhaga Bala (`_tribhaga_bala`)
4. Abda Bala (`_abdadhipathi`)
5. Masa Bala (`_masadhipathi`)
6. Vaara Bala (`_vaaradhipathi`)
7. Hora Bala (`_hora_bala`)
8. Ayana Bala (`_ayana_bala`)
9. Yuddha Bala (`_yuddha_bala`)

Across all 7 classical planets (Sun..Saturn) on the 5 independent PyJHora V2 oracle benchmark charts, this represents **315 component checks**, targeting a 100.00% pass rate with zero delta ($\Delta = 0.00$).

---

## 2. Pre-Implementation Baseline

Before formal verification of this phase, the system status was recorded as follows:
- **Git Commit**: `63f795c` (*Phase 8.3: Complete DSSME to PyJHora parity implementation for Chesta Bala*)
- **Type Check (`npm run lint` / `tsc --noEmit`)**: **PASS** (Zero errors)
- **Production Build (`compile_applet`)**: **PASS** (Build succeeded)
- **Kaala Bala Component Baseline**: 315 / 315 PASS (100.00%, Delta = 0.00)
- **Differential Suite Baseline**: 35 / 35 planetary Kaala checks PASS (Delta = 0.00 across all 5 reference fixtures)

---

## 3. Files Inspected

### 3.1 Reports & Specifications
- `reports/PHASE_8.1_SPECIFICATION_VALIDATION_AUDIT.md`
- `reports/PHASE_8.1_CORRECTED_IMPLEMENTATION_SPECIFICATION.md`

### 3.2 DSSME Production Source Files
- `src/engine/strength/kaalaBala.ts` (582 lines)
- `src/engine/strength/shadbala.ts` (170 lines)
- `src/engine/strength/shadbalaTypes.ts` (89 lines)
- `src/engine/strength/shadbalaConstants.ts` (110 lines)
- `src/engine/chart/calculateChart.ts` (297 lines)
- `src/engine/time/panchanga.ts` (241 lines)
- `src/engine/types.ts` (120 lines)
- `src/engine/astronomy/ephemeris.ts` (140 lines)

### 3.3 Reference & Oracle Files
- `vendor/pyjhora/src/jhora/horoscope/chart/strength.py` (lines 477–665)
- `vendor/pyjhora/src/jhora/panchanga/drik.py` (lines 500–650, 1640–1730)
- `vendor/pyjhora/src/jhora/const.py` (lines 640–650, 1375–1385)
- `tests/oracle/pyjhora-v2/manifest.json`
- `tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json`
- `tests/differential/shadbalaDifferential.v2.test.ts`

---

## 4. Production File Modified

In strict adherence to Section 7 ("PRODUCTION MODIFICATION SCOPE LOCK"), only the designated Kaala Bala module was targeted:
- **Primary Production File**: `src/engine/strength/kaalaBala.ts`
- **Protected Files Modified**: **0** (All other engine files remained strictly read-only).

---

## 5. Exact Code Changes

The core implementation in `src/engine/strength/kaalaBala.ts` encapsulates:
1. **Helper Mathematical Functions**:
   - `inverseLagrange(x, y, ya)`: Replicates `utils.inverse_lagrange` for polynomial interpolation.
   - `daysElapsedSinceBase(year, baseYear, baseDays)`: Replicates `strength._days_elapsed_since_base` for Kali Ahargana day-counts.
   - `toDmsHours(hours)`: Rounds subseconds to integer arcseconds matching PyJHora's `utils.to_dms`, preventing sub-second transit drift.
2. **Subcomponent Functions**:
   - `calculateNathonnathaBala(tobh, srh, pssh)`
   - `calculatePakshaBala(pLongs, pSigns)`
   - `calculateTribhagaBala(tobh, srh, ssh, nextSrh)`
   - `calculateAbdaBala(localJd, year)`
   - `calculateMasaBala(localJd, year)`
   - `calculateVaaraBala(year, elapsedDaysInYear, tobh, srh)`
   - `calculateHoraBala(localJd, tobh, srh)`
   - `calculateAyanaBala(pLongs, ayanamsa)`
   - `calculateYuddhaBala(pLongs, lat, lon, jdUtc, nb, pb, tb, hb)`
3. **Public Entry Point**:
   - `calculateKaalaBalaAll(ctx: KaalaContext)`: Manages diurnal transit extraction, True Pushya mode switching/restoration, calls the 9 subfunctions, and produces `{ totals, breakdowns }`.

---

## 6. Nine Component Implementation Status

### 6.1 Nathonnatha Bala (`kaalaBala.ts:82–96`)
- **PyJHora Reference**: `strength.py:479–489`
- **Formula**:
  $$mnhl = \frac{srh + pssh}{2} \pm 12$$
  $$t_{\text{diff}} = \begin{cases} (tobh - mnhl) \times \frac{60}{12}, & tobh < 12 \\ (24 + mnhl - tobh) \times \frac{60}{12}, & tobh \ge 12 \end{cases}$$
- **Allocation**: Sun, Jupiter, Venus $\rightarrow t_{\text{diff}}$; Moon, Mars, Saturn $\rightarrow 60 - t_{\text{diff}}$; Mercury $\rightarrow 60.0$.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.2 Paksha Bala (`kaalaBala.ts:102–150`)
- **PyJHora Reference**: `strength.py:490–503`
- **Formula**: $pb = \text{round}\left(\frac{|\lambda_{\text{Moon}} - \lambda_{\text{Sun}}|}{3.0}, 2\right)$. Benefics get $pb$; Malefics get $60 - pb$; Moon gets $pb \times 2$. Dynamic benefic classification checks Mercury conjunction with malefics and waxing/waning Moon.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.3 Tribhaga Bala (`kaalaBala.ts:156–179`)
- **PyJHora Reference**: `strength.py:504–525`
- **Formula**: Day divided into 3 equal slots ($dl/3$), Night divided into 3 equal slots ($nl/3$). Jupiter receives 60 always. Day slots 1, 2, 3: Mercury, Sun, Saturn. Night slots 1, 2, 3: Moon, Venus, Mars.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.4 Abda Bala (`kaalaBala.ts:185–195`)
- **PyJHora Reference**: `strength.py:545–558`
- **Formula**: $\text{day} = \left(\lfloor \frac{\text{Ahargana}}{360} \rfloor \times 3 + 1\right) \pmod 7$. Base year 1951, base days 174. Planet at `abdahipathi_weekdays[day]` receives 15 virupas.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.5 Masa Bala (`kaalaBala.ts:201–211`)
- **PyJHora Reference**: `strength.py:559–573`
- **Formula**: $\text{day} = \left(\lfloor \frac{\text{Ahargana}}{30} \rfloor \times 2 + 1\right) \pmod 7$. Base year 1951, base days 174. Planet at `abdahipathi_weekdays[day]` receives 30 virupas.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.6 Vaara Bala (`kaalaBala.ts:217–225`)
- **PyJHora Reference**: `strength.py:574–594`
- **Formula**: $\text{day} = \text{Ahargana} \pmod 7$. Base year 1827, base days 244. If $tobh < srh$, Ahargana decrements by 1. Winner receives 45 virupas.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.7 Hora Bala (`kaalaBala.ts:231–243`)
- **PyJHora Reference**: `strength.py:595–606`
- **Formula**: $\text{hora} = (\lfloor tobh - srh \rfloor + day + 1) \pmod 7$. Equal 1.0-hour steps from sunrise. Planet at `hora_bala_hora_order[hora]` receives 60 virupas.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.8 Ayana Bala (`kaalaBala.ts:249–336`)
- **PyJHora Reference**: `strength.py:607–614`
- **Formula**: $(24.0 + \delta) \times 1.25$ virupas. Sun doubled ($\times 2$). Uses Surya Siddhanta declination table matching `drik.declination_of_planets()`.
- **Status**: **PASS (35 / 35, Delta = 0.00)**

### 6.9 Yuddha Bala (`kaalaBala.ts:391–447`)
- **PyJHora Reference**: `strength.py:615–642`
- **Formula**: Angular proximity $< 1.0^\circ$ for non-luminary grahas (Mars..Saturn). Pre-Yuddha balance difference divided by disc diameter difference (`[-1, -1, 9.4, 6.6, 190.4, 16.6, 158.0]`).
- **Status**: **PASS (35 / 35, Delta = 0.00)**

---

## 7. PyJHora Source Alignment

The implementation directly aligns with the following PyJHora constants and algorithms:
- `const.abdahipathi_weekdays = [2, 3, 4, 5, 6, 0, 1]` (`const.py:1377`)
- `const.hora_bala_hora_order = [6, 4, 2, 0, 5, 3, 1]` (`const.py:1378`)
- `const.planets_disc_diameters = [-1, -1, 9.4, 6.6, 190.4, 16.6, 158.0, -1, -1]` (`const.py:644`)
- Dynamic benefics via `charts.benefics_and_malefics(method=2)`

---

## 8. JD / Timezone Verification

1. **Local Julian Day**:
   - `localJd = swe.julday(y, m, d, tobh)` is passed to `calculateAbdaBala`, `calculateMasaBala`, and `calculateHoraBala`.
2. **UTC Julian Day**:
   - `jdUtc = swe.julday(y, m, d, tobh - tz)` is passed to planetary transit searches and planetary longitude calculations.
3. **Transit Time Anchor**:
   - `srh`, `ssh`, `pssh`, and `nextSrh` are calculated in local decimal hours and rounded via `toDmsHours()` (`kaalaBala.ts:59–76`), eliminating fractional second drift.

---

## 9. Sidereal Mode Isolation

- At line 520, Swiss Ephemeris sidereal mode is set to `29` (`SE_SIDM_TRUE_PUSHYA`).
- At line 536, Swiss Ephemeris sidereal mode is immediately restored to `1` (`SE_SIDM_LAHIRI`).
- Global state leakage is completely prevented.

---

## 10. Rounding Verification

Every subcomponent is rounded to 2 decimal places before vector summation:
$$totals[i] = \text{round}\left(\sum_{k=1}^9 \text{comp}_k[i], 2\right)$$
Across all 315 component checks, zero rounding discrepancies or banker's rounding edge cases were observed.

---

## 11. Unit Test Results

The dedicated test suite `tests/unit/kaalaBala.test.ts` executed with 100% success:
- **Fixtures Tested**: 5 / 5
- **Total Subcomponent Checks**: 315 / 315
- **Passed Checks**: 315 (100.00%)
- **Failed Checks**: 0
- **Exit Code**: 0

---

## 12. Build Results

- **Type Check (`npm run lint` / `tsc --noEmit`)**: Clean (Zero type errors).
- **Vite Production Compilation (`compile_applet`)**: Succeeded.

---

## 13. Independent Oracle Differential Results

Executing `tests/differential/shadbalaDifferential.v2.test.ts` against `tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json`:

| Fixture ID | Fixture Name | Kaala Bala Checks | Status | Delta |
| :--- | :--- | :---: | :---: | :---: |
| `PYJHORA_V2_001` | Chofu, Japan (Baseline) | 7 / 7 planets | **PASS** | **0.00** |
| `PYJHORA_V2_002` | Yangon, Myanmar (Fractional TZ) | 7 / 7 planets | **PASS** | **0.00** |
| `PYJHORA_V2_003` | Berlin, Germany (Boundary) | 7 / 7 planets | **PASS** | **0.00** |
| `PYJHORA_V2_004` | Honolulu, USA (Cusp claim) | 7 / 7 planets | **PASS** | **0.00** |
| `PYJHORA_V2_005` | Paris, France (Waning Moon) | 7 / 7 planets | **PASS** | **0.00** |

**Total Planetary Kaala Bala Checks**: **35 / 35 PASS (100.00%)**, Max Delta = **0.00 Virupa**.

---

## 14. 315/315 Component Matrix

| Component | Fixture 001 | Fixture 002 | Fixture 003 | Fixture 004 | Fixture 005 | Total Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Nathonnatha** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Paksha** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Tribhaga** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Abda** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Masa** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Vaara** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Hora** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Ayana** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **Yuddha** | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | PASS (7/7) | **35 / 35** |
| **TOTAL** | **63 / 63** | **63 / 63** | **63 / 63** | **63 / 63** | **63 / 63** | **315 / 315 (100.00%)** |

---

## 15. Regression Results

All adjacent calculation modules were verified to ensure zero regression:
- **Dig Bala**: 35 / 35 PASS (Delta = 0.00)
- **Chesta Bala**: 35 / 35 PASS (Delta = 0.00)
- **Naisargika Bala**: 35 / 35 PASS (Delta = 0.00)
- **Houses & Bhavas**: Unchanged (`src/engine/ascendant/houses.ts` unedited)
- **Dignity**: Unchanged (`src/engine/dignity/dignity.ts` unedited)
- **Combustion**: Unchanged (`src/engine/combustion/combustion.ts` unedited)
- **Aspects**: Unchanged (`src/engine/aspects/aspects.ts` unedited)
- **Dasha**: Unchanged (`src/engine/dasha/vimshottari.ts` unedited)
- **Ashtakavarga**: Unchanged (`src/engine/ashtakavarga/ashtakavarga.ts` unedited)

---

## 16. Git Diff / Scope Audit

- **Production Files Modified**: `src/engine/strength/kaalaBala.ts` only.
- **Protected Files Modified**: **0**.
- **Scope Audit Result**: **PASS**.

---

## 17. Remaining Risks

- **Sthana Bala (Saptavargaja)**: Scheduled for Phase 8.4.
- **Drik Bala (Aspectual Drishti)**: Scheduled for Phase 8.5.
- Both remaining components are completely independent from Kaala Bala.

---

## 18. Final Acceptance Status

```text
PHASE_8.1_IMPLEMENTATION_COMPLETE
```
