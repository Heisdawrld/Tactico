# Tactico delivery status

Updated 10 September 2026. This is an implementation checkpoint, not a release declaration.

## Product direction

Build a PC-first football-management game in which tactical decisions visibly affect football and club decisions carry into future seasons. The immediate priority is a coherent, reliable career and one credible match engine. More leagues, cinematic presentation and marketing claims do not substitute for that.

## Implemented in this change

- Saved spatial inputs for team width, line height, pressing, tempo, directness, transition instructions, role duties and wide movement.
- Pure team coordination from a common tick-start snapshot: first presser, cover, midfield screening, a protected group behind the attack and runs conditional on available cover. Team plans commit briefly, with immediate reconsideration after a turnover.
- Player pace, acceleration and endurance affect movement; passing, finishing and goalkeeper attributes feed the existing execution models.
- Match Lab controls for both teams, repeatable seeds, presets, player duties and overlap/underlap/inside runs. The inspector shows the team's phase and the player's responsibility. Narrow windows retain the pitch and controls.
- Legacy manifests without team tactics preserve the prior diagnostic behaviour. The new inputs are copied on simulation construction, so editing the caller's configuration cannot alter an existing replay.
- Complete double round-robin scheduling for the clubs actually in the offline dataset. Odd-sized leagues get byes. Background pairings follow the calendar, completed rounds are saved, and replaying a completed round does not duplicate standings.
- Season rollover archives the final table and preserves the club's squad, budget and tactics. Old eight-fixture saves retain their schedule until rollover. They are not silently replaced with fresh careers.
- Career match resume and half-time lifecycle repaired; speed controls reach the engine. Results use the engine score, the displayed fixture stays fixed after saving, and career squads/tactics feed the existing career match path.
- Career display uses the current season and real progress indicators and exposes archived final tables. Removed fabricated fixed objective percentages from that screen.
- Invalid transfer prices and malformed/repeated/out-of-order result submissions are rejected by the store.

## Validation

Verified: 76 simulation/lifecycle tests and 9 career tests pass. The production frontend build completes, including TypeScript validation and all 22 static pages. It still reports the existing missing `metadataBase` warning for social-preview URLs; this does not fail compilation.

Run with the repository's pinned pnpm 8.15.0:

```sh
pnpm --filter @tactico/simulation-engine exec jest --runInBand
pnpm --filter @tactico/app test:career
pnpm --filter @tactico/app exec tsc --noEmit
pnpm --filter @tactico/app build
```

On a machine whose global pnpm is incompatible, use the already installed workspace executables rather than allowing it to replace node_modules. Windows examples from the frontend directory are `..\..\node_modules\.bin\tsx.CMD --test tests/career-calendar.test.ts` and `.\node_modules\.bin\tsc.CMD --noEmit`.

Set `TACTICO_BUILD_DIR=.next-verification` when building alongside a development server, to avoid overwriting its `.next` directory. The directory is ignored by Git.

The test coverage includes deterministic replay and participant-order invariance, rotated tactical geometry, direction-of-effect tactical scenarios, movement constraints, legacy pause/resume and match boundaries, balanced schedules for 2/3/7/20 clubs, all offline clubs completing their season, duplicate-round protection, and a store test that completes two seasons and verifies preserved club assets and persisted history.

Browser checks cover Match Lab play-to-completion, tactical preset application, player-role application, reset, 4x playback, player inspection and the narrow browser layout. A full ninety-minute career match has not been visually certified by these checks.

## Remaining release gates, in order

1. **One complete spatial match.** Replace the short kickoff tape's scripted opening and terminal stoppages with legal restarts, two halves, substitutions, fouls/cards, offside enforcement and robust loose-ball/contact play. Its current 36–40 second demonstration is not a full match.
2. **One match authority across the product.** Route career, background results and replays through the same completed engine. The career still uses the legacy engine; background scores remain an explicitly approximate, independently sampled goal model. Neither is equivalent to the new spatial simulation.
3. **Football validation.** Expand supported formations beyond 4-3-3/4-2-3-1; calibrate roles, perception, stamina, contacts, goalkeepers and match distributions. Tests here establish causal implementation and reproducibility, not professional football realism. Interpolated presentation and smooth locomotion still need work.
4. **Career consequences.** Complete transfers/contracts, lineup and substitution validation, injuries/training/development, board decisions, finances, youth intake and season-to-season world changes. Season rollover currently preserves squads rather than simulating ageing and contracts. Several existing screens and onboarding options still claim behaviour that needs implementation/audit.
5. **Save and release reliability.** Versioned save migrations, backup/recovery, import/export, quota/error feedback, offline asset caching, minimum-hardware performance and long-career soak tests. Current persistence is localStorage, not a certified durable save system.
6. **Data and shipping.** Expand and verify the football dataset, resolve use rights for a commercial release, test accessibility and packaging, and validate the entire new-career-to-next-season flow with real playtesters before publishing as a finished game.

Do not call this Football Manager parity or assign a completion percentage. Evaluate readiness against the gates above.
