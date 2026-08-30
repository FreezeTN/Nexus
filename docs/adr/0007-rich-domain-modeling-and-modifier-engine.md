# [ADR-0007] Rich Domain Modeling & Modifier Stacking Engine

* **Status**: Accepted
* **Date**: 2026-08-30
* **Authors**: Nexus Core Team

## Context & Problem Statement
As the tabletop platform supports multiple TRPG systems (D&D 5e, Pathfinder 2e, Shadowrun, CoC, Cyberpunk RED, etc.) with custom plugins, using loose generic JavaScript objects for modifiers, dice formulas, and rule calculations resulted in edge-case bugs around bonus stacking, roll advantage/disadvantage, and encumbrance limits.

## Decision Drivers
* Make rule evaluations explicit, typed, and easily testable without React or Firestore dependencies.
* Support different system bonus stacking rules (additive for 5e, highest-only for PF2e status bonuses).
* Provide structured AST evaluation for dice expressions and skill check contextual modifiers.

## Decision Outcome
Created a dedicated domain modeling layer under `src/domain/` (`src/domain/models.ts`):
1. **`DiceExpression` & `EvaluatedDiceResult`**: AST representation of dice terms, drop/keep rules, and flat bonuses.
2. **`DomainModifier` & `StackingRule`**: Typed modifiers supporting `additive`, `highest_only`, and `lowest_only` stacking rules.
3. **`DomainSkillCheck` & `DomainSavingThrow`**: Contextual structures for skill proficiency, expertise, and situational bonuses.
4. **`DomainItemWeight` & Encumbrance**: Encumbrance threshold evaluation with speed penalty rules.

### Positive Consequences
* Cross-system rule evaluation is strictly typed and deterministic.
* Plugin authors and core systems can evaluate modifier chains using `calculateStackedModifier`.
* Prevents silent calculation bugs when multiple status conditions or magic buffs overlap.
