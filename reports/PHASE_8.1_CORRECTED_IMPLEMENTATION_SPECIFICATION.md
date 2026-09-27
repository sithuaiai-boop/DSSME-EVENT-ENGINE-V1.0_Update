# PHASE 8.1 KAALA BALA CORRECTED IMPLEMENTATION SPECIFICATION

## 1. Executive Summary

This document constitutes the authoritative, reconciled **Phase 8.1 Kaala Bala Implementation Specification** for the DSSME Event Engine V1.0. Following the pre-implementation contradiction audit (`reports/PHASE_8.1_SPECIFICATION_VALIDATION_AUDIT.md`), all line numbers, data-flow boundaries, ephemeris isolation rules, and 9-component mathematical definitions have been verified against the pinned PyJHora reference (`commit 48e57d29`) and the 5 independent oracle fixtures.

---

## 2. Protected Files (Immutable Scope)

The following files are locked and must not be modified:
- `src/engine/ascendant/houses.ts`
- `src/engine/dignity/dignity.ts`
- `src/engine/combustion/combustion.ts`
- `src/engine/aspects/aspects.ts`
- `src/engine/dasha/vimshottari.ts`
- `src/engine/ashtakavarga/ashtakavarga.ts`
- `src/engine/types.ts`
- `src/engine/strength/shadbalaTypes.ts`
- `src/engine/strength/shadbalaConstants.ts`

---

## 3. Authorized Component Architecture (`src/engine/strength/kaalaBala.ts`)

### 3.1 Reconciled Line Number Map
- `calculateNathonnathaBala`: Lines 82–100
- `calculatePakshaBala`: Lines 102–154
- `calculateTribhagaBala`: Lines 156–183
- `calculateAbdaBala`: Lines 185–199
- `calculateMasaBala`: Lines 201–215
- `calculateVaaraBala`: Lines 217–229
- `calculateHoraBala`: Lines 231–247
- `calculateAyanaBala`: Lines 249–336
- `calculateYuddhaBala`: Lines 391–451
- `calculateKaalaBalaAll`: Lines 453–581

### 3.2 Ephemeris Isolation Contract
1. Switch Swiss Ephemeris sidereal mode to Mode 29 (`SE_SIDM_TRUE_PUSHYA`) prior to retrieving planetary longitudes.
2. Immediately restore Swiss Ephemeris sidereal mode to Mode 1 (`SE_SIDM_LAHIRI`) after longitude extraction (line 536).

### 3.3 Nine-Component Numerical Contract
1. **Nathonnatha**: Distance from apparent midnight; Sun/Jupiter/Venus receive $t_{\text{diff}}$, Moon/Mars/Saturn receive $60 - t_{\text{diff}}$, Mercury receives $60.0$.
2. **Paksha**: Lunar elongation / 3; Benefics receive $pb$, Malefics receive $60 - pb$, Moon doubled ($pb \times 2$). Mercury dynamically evaluated.
3. **Tribhaga**: Day/night equal thirds; Mercury, Sun, Saturn (day) / Moon, Venus, Mars (night). Jupiter always receives 60.
4. **Abda**: Ahargana modulo 360 lord (base 1951, 174). Ruler receives 15 virupas.
5. **Masa**: Ahargana modulo 30 lord (base 1951, 174). Ruler receives 30 virupas.
6. **Vaara**: Ahargana weekday lord (base 1827, 244). Ruler receives 45 virupas. Pre-sunrise decrement applied.
7. **Hora**: Equal 1.0-hour steps from sunrise modulo 7 using `hora_bala_hora_order`. Ruler receives 60 virupas.
8. **Ayana**: $(24 + \delta) \times 1.25$ virupas. Sun doubled.
9. **Yuddha**: Conjunction $< 1^\circ$ for planets 2..6. Difference of upstream balances divided by disc diameter differences.

---

## 4. Acceptance Criteria

- **Unit Tests**: All 9 subcomponents match PyJHora reference values within $\pm 0.01$ Virupa.
- **Independent Oracle Differential Suite**: 35 / 35 planetary Kaala Bala checks pass with $\Delta = 0.00$.
- **Linting & Compilation**: Zero TypeScript errors (`tsc --noEmit`), clean Vite production build.
