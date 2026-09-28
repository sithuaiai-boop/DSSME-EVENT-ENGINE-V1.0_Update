# DSSME NATIVE 16-BLOCK CALCULATION ENGINE
## Production Architectural Specification & Master Contract (V1.4)
### Native TypeScript · WebAssembly Swiss Ephemeris · Vercel & AI Studio Compatible

---

## 1. System Mission & Core Philosophy

The **DSSME Native Calculation Engine** is a high-precision, deterministic Vedic astrological calculation engine implemented natively in TypeScript and WebAssembly.

### Architectural Transformation
The engine transforms the legacy extraction paradigm:
```text
Legacy:  [PDF / External Report] → [OCR Engine] → [Heuristic Extraction] → [DSSME JSON]
Native:  [Structured Input] → [Unified Time & WASM Ephemeris] → [Canonical 16-Block Chart] → [Validated Canonical JSON]
```

### Production Runtime Mandates
1. **Independent Native Calculation**: All astronomical and Vedic values must be computed natively by the engine.
2. **Zero External Runtime Dependencies**: The production engine MUST NOT rely on:
   - PDF files or OCR processing
   - Python runtime or PyJHora execution
   - Commercial desktop software (Parashara's Light, Jagannatha Hora)
   - Third-party external astrology APIs or web scrapers
   - Manually keyed planetary positions or static lookup tables for dynamic data.

---

## 2. Reference Hierarchy & PyJHora Boundary

When verifying formulas, algorithmic logic, or edge cases, adhere strictly to this priority hierarchy:

```text
1. Existing DSSME native codebase & verified unit test suites
2. Pinned PyJHora source implementation (for algorithmic parity)
3. Independent PyJHora oracle fixtures (tests/oracle/pyjhora-v2/)
4. Authoritative classical Jyotish & astronomical treatises (BPHS, Surya Siddhanta, Swiss Ephemeris)
5. General astronomical algorithms (Jean Meeus)
```

### Pinned PyJHora Reference (Offline Only)
- **Repository**: `https://github.com/naturalstupid/PyJHora`
- **Pinned Commit**: `48e57d29b47a3143519910a24866758116467485`
- **Pinned Release**: `V4.9.3`
- **Role**: Source inspection model, differential benchmark generator, and independent verification oracle.
- **Strict Prohibition**: PyJHora is an **offline development reference only**. It MUST NOT be imported, invoked via `child_process`, or bundled into production deployments.

---

## 3. The 16 Active Canonical Blocks

The engine strictly standardizes chart data into **16 Canonical Blocks**. No block may be skipped, renamed, or converted into placeholder text.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        16 ACTIVE CANONICAL BLOCKS                      │
├───────────────────┬────────────────────────────────────────────────────┤
│ Block 01: IDENTITY│ Chart metadata, local & UTC time, geographic coords│
│ Block 02: PANCH   │ Tithi, Nakshatra, Yoga, Karana, Vara, Sun events   │
│ Block 03: DASHA   │ Vimshottari Dasha hierarchy (Mahadasha/Antardasha) │
│ Block 04: PLANETS │ 9 Grahas + Lagna (longitudes, speeds, retrograde)  │
│ Block 05: HOUSES  │ 1-12 Bhavas, cusps, madhyas, sandhis, sign rulers  │
│ Block 06: SHADBALA│ 6 Classical Balas (Sthana, Dig, Kaala, Chesta, etc)│
│ Block 07: BHAVABAL│ Bhava Bala (Adhipati, Dig, Drishti per house)      │
│ Block 08: BAV     │ Bhinnashtakavarga (8 contributors × 12 signs)      │
│ Block 09: SAV     │ Samudayashtakavarga (12 signs, 337 total bindus)   │
│ Block 10: BAV_CURR│ Planet's current sign bindu score                  │
│ Block 11: ASP_PLAN│ Parashari planetary mutual & special aspects       │
│ Block 12: ASP_BHAV│ Planetary aspects cast upon the 12 Bhavas          │
│ Block 13: COMPOSIT│ Dignity, Retrograde, Combustion, Clusters, Hora    │
│ Block 14: PHASE   │ New/Full Moon proximity, sign boundaries, stress   │
│ Block 15: NAVAMSHA│ D9 divisional longitudes, signs, and varga dignity │
│ Block 16: YOGAS   │ Classical Parashari planetary yoga combinations    │
└───────────────────┴────────────────────────────────────────────────────┘
```

### Strict Downstream Boundary (Forbidden Concepts)
The Native Calculation Engine is strictly a mathematical and astrological foundation. Downstream speculative or gamified concepts are **forbidden** from this layer:
- ❌ `GOCHARA` (dynamic transit scoring)
- ❌ `CPS` (Composite Predictive Score)
- ❌ `DIGIT_VECTOR`, `PAIR`, `TRIPLET`
- ❌ `SURVIVAL_GATE`, `LOTTERY_RANKING`, `SPECULATION_SCORE`
- ❌ No "Block 17" or ad-hoc custom blocks.

---

## 4. Input & Temporal Pipeline

```text
Structured Input (date, time, lat, lon, tz)
             ↓
Input Validation & Coordinate Sanitization
             ↓
Time Engine (Local → UTC → Julian Day UT1)
             ↓
Swiss Ephemeris WASM (Topocentric / Sidereal)
             ↓
Chitra Paksha (Lahiri) Ayanamsa Subtraction
             ↓
Canonical Planetary Positions & Lagna
```

### Input Contract & Validation Rules
```typescript
export interface DSSMEEventInput {
  datetime: string;     // "YYYY-MM-DD HH:mm:ss"
  timezone: string;     // "+HH:mm" or "-HH:mm"
  location: {
    latitude: number;   // Must be within [-90.0, 90.0]
    longitude: number;  // Must be within [-180.0, 180.0]
    city: string;
    country: string;
  };
  ayanamsa?: "Lahiri";  // Default: Lahiri (Chitra Paksha)
}
```
- Reject coordinates outside valid geographical bounds.
- Reject invalid Gregorian dates and leap year violations.
- Maintain single-point-of-truth Julian Day (`jd_ut1`) shared across all calculation subroutines.

---

## 5. Calculation Specifications per Block

### Block 01 — IDENTITY
- Metadata including date, time, timezone, formatted coordinates, Ayanamsa name & value (`24°XX'YY"`), Lagna sign and exact degree, Lagna type (Movable / Fixed / Dual), body mode (`9-body`), and engine version.

### Block 02 — PANCHANGA
- **Tithi**: Angular elongation $(\lambda_{\text{Moon}} - \lambda_{\text{Sun}}) \pmod{360} / 12^\circ$. Number 1–30, name, and Paksha (`Shukla` / `Krishna`).
- **Nakshatra**: Moon's sidereal longitude divided by $13^\circ 20'$ ($800'$). Number 1–27, name, and Pada 1–4.
- **Yoga**: $(\lambda_{\text{Sun}} + \lambda_{\text{Moon}}) \pmod{360} / 13^\circ 20'$. Number 1–27 and name.
- **Karana**: Half-tithi ($6^\circ$ arc). Number 1–60 and name (Bava, Balava, Kaulava, etc.).
- **Vara**: Vedic weekday lord calculated from local sunrise.
- **Sun Events**: Topocentric disk sunrise and sunset calculated using atmospheric refraction.

### Block 03 — DASHA (Vimshottari)
- 120-year cycle based on Moon's birth Nakshatra position and balance of unexpired dasha.
- Provides current and sequential Mahadasha, Antardasha, start/end dates, and planetary lords.

### Block 04 & 05 — PLANETS & HOUSES
- **9 Grahas**: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu (true/mean), Ketu ($180^\circ$ opposite Rahu).
- **Lagna (Ascendant)**: Exact eastern horizon intersection for given geographic coordinates and local sidereal time.
- **Houses**: Equal house ($30^\circ$) or Sripati house cusps with exact Bhava Madhya, Bhava Sandhi, occupying planets, and sign lord.

### Block 06 — SHADBALA (The Sixfold Planetary Strength)
Consists strictly of the 6 classical Parashari strength sources measured in Virupas (60 Virupas = 1 Rupa):
1. **Sthana Bala**: Positional strength (Uchcha, Saptavargiya, Ojhayugma, Kendradi, Drekkana).
2. **Dig Bala**: Directional strength based on distance from zero-power directional cusps.
3. **Kaala Bala**: Temporal strength comprised of **9 classical sub-components**:
   - *Nathonnatha Bala* (diurnal/nocturnal)
   - *Paksha Bala* (lunar phase strength)
   - *Tribhaga Bala* (three-part division of day/night)
   - *Abda Bala* (lord of the year)
   - *Masa Bala* (lord of the month)
   - *Vaara Bala* (lord of the weekday)
   - *Hora Bala* (lord of the hour)
   - *Ayana Bala* (declination strength)
   - *Yuddha Bala* (planetary war correction)
4. **Chesta Bala**: Motional strength based on apparent planetary speed relative to mean speed.
5. **Naisargika Bala**: Natural fixed luminance hierarchy (Sun > Moon > Venus > Jupiter > Mercury > Mars > Saturn).
6. **Drik Bala (Drig Bala)**: Aspectual strength derived from Parashari benefic and malefic aspects.

#### 🛡️ The Bhava Bala Firewall Rule
```text
Total Shadbala Virupas = Sthana + Dig + Kaala + Chesta + Naisargika + Drik
Bhava Bala contribution to Shadbala MUST BE STRICTLY 0.0.
```
Any leakage of Bhava Bala into planetary Shadbala totals is an architectural violation.

### Block 07 — BHAVA BALA
Measures the strength of each of the 12 houses (Bhavas) independently:
- **Bhava Adhipati Bala**: Strength of the house ruler.
- **Bhava Dig Bala**: Directional strength of the house.
- **Bhava Drishti Bala**: Aspectual impact of planets on the house cusp.

### Blocks 08, 09, 10 — ASHTAKAVARGA
- **Block 08 (BAV)**: Bhinnashtakavarga bindu distribution (7 planets + Lagna across 12 signs).
- **Block 09 (SAV)**: Samudayashtakavarga composite scores per zodiac sign. The sum of all 12 signs must equal exactly **337 bindus**.
- **Block 10 (BAV Current Sign)**: Real-time bindu count of the sign currently transited by each planet.

### Blocks 11 & 12 — ASPECTS (Drishti)
- **Planetary Aspects**: Full $7^{\text{th}}$ house mutual drishti, plus special Parashari aspects ($4^{\text{th}}/8^{\text{th}}$ Mars, $5^{\text{th}}/9^{\text{th}}$ Jupiter, $3^{\text{rd}}/10^{\text{th}}$ Saturn).
- **Bhava Aspects**: Quantitative aspect values cast upon each house cusp.

### Block 13 — COMPOSITE PLANETARY ATTRIBUTES
- **Dignity**: Exalted, Moolatrikona, Own, Great Friend, Friend, Neutral, Enemy, Great Enemy, Debilitated.
- **Retrograde**: Motion status based on daily longitudinal velocity ($\text{speed} < 0$).
- **Combustion (Kopa)**: Proximity to the Sun within classical degrees of combustion.
- **House Positions**: Placement categorized by Kendra (1,4,7,10), Trikona (1,5,9), Upachaya (3,6,10,11), and Dusthana (6,8,12).
- **Sign Clusters**: Detection of stellar congregations ($\ge 2$ grahas in the same rashi).
- **Hora**: Active planetary hour ruler following the Chaldean planetary sequence.

### Block 14 — PHASE STRESS & PROXIMITY
- Evaluates solar-lunar angular elongation:
  - Exact hours to nearest New Moon (Amavasya) and Full Moon (Purnima).
  - Identification of sign boundary planets (Gandanta / boundary degrees $< 1^\circ$ or $> 29^\circ$).
  - Qualitative stress level: `LOW`, `MEDIUM`, or `HIGH`.

### Block 15 — NAVAMSHA (D9)
- Exact calculation of D9 harmonic divisional positions and D9 sign lords.
- Vargottama evaluation (same rashi in D1 and D9).

### Block 16 — YOGA LIST
- Identifies classical auspicious and inauspicious planetary yogas (e.g., Gaja Kesari, Budhaditya, Raja Yogas, Dhana Yogas, Viparita Raja Yogas).

---

## 6. Verification, Testing & Oracle Mandate

### The Immutable Oracle Standard
All differential audits compare against the independent PyJHora V2 oracle baseline:
- `tests/oracle/pyjhora-v2/manifest.json`
- `tests/oracle/pyjhora-v2/pyjhora_oracle_v2_independent.json`
- `tests/oracle/pyjhora-v2/pyjhora_oracle_v2_kaala_components.json`
- `tests/oracle/pyjhora-v2/PYJHORA_SB_011.json` (Chofu Master Benchmark)

### Automated Test Architecture
```text
tests/
├── unit/
│   └── kaalaBala.test.ts          # 315 / 315 direct PyJHora component assertions
└── differential/
    ├── bhavaFirewall.test.ts       # 7 / 7 checks: 0.0 Bhava Bala leakage
    ├── shadbalaGolden.test.ts      # 49 Chofu master benchmark metrics
    ├── shadbalaDifferential.v2.ts  # Multi-fixture differential suite
    └── runAll.ts                  # Master differential test runner
```

### The Golden Rule of Bug Fixing
```text
NEVER mutate oracle expected values or widen tolerances to force a failing test to pass.
Fix the underlying mathematical or algorithmic implementation inside DSSME.
```

---

## 7. Runtime Architecture & API Endpoints

The system is deployed as a unified full-stack application:
- **Client**: React 19 + TypeScript + Tailwind CSS (Vite build).
- **Server Middleware**: Express server mounting Vite middlewares in dev and serving static assets in production (`server.ts`).
- **Ephemeris Engine**: Swiss Ephemeris compiled to WebAssembly (`public/swisseph.wasm` + `public/swisseph.data`).

### REST API Endpoints
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/dssme/calculate` | Computes full 16-block Canonical Chart from JSON input |
| `GET` | `/api/health` | Service health status, engine version, and WASM readiness |
| `GET` | `/api/benchmark` | Live comparison of current engine output against reference golden data |

---

## 8. Final Production Acceptance Checklist

Before declaring any release or change production-ready, verify all criteria:

- [x] **Zero External Runtime**: No Python, no OCR, no third-party astrology APIs in production.
- [x] **Complete 16-Block Output**: All 16 blocks populated without nulls or fallback stubs.
- [x] **Bhava Bala Firewall**: 100% verified 0.0 leakage of Bhava Bala into Shadbala.
- [x] **Kaala Bala Component Test**: 315 / 315 assertions passing in `kaalaBala.test.ts`.
- [x] **Forbidden Terms Absent**: No Gochara, CPS, lottery rankings, or speculation models in codebase.
- [x] **TypeScript Strict**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- [x] **Production Compilation**: `npm run build` succeeds cleanly.
- [x] **Vercel Readiness**: Self-contained Node.js / WASM execution without system binaries.
