# Coach 2.0 — Faz 2 Evidence Ledger

## Scope

Phase 2 starts after commit `c8c3eed` and covers only the Coach persistence boundary and migration preparation. No remote backend or cloud sync is introduced.

## Baseline evidence

- Current storage: IndexedDB `neowell` / `kv` with `m:meta` and logical shards; localStorage fallback: `www/kernel/storelib.js:1-13,50-83`.
- Shard split/reassemble: `www/main/01-core.js:193-220`.
- Coach-owned legacy state: `S.chat`, `S.chats`, `S.cid`, `S.providers`; module contract: `www/kernel/modules.js:17`.
- Existing shard tests: `scripts/shards.test.js`.
- Existing backup encryption tests: `scripts/backup.test.js`.
- Phase 1 baseline after push: `npm test` 110 files/0 failed; Coach E2E 68/68; Android sync 28 Java/44 resources.

## Phase 2 decision

Use a repository adapter over the existing Store first. Do not claim the existing IndexedDB/localStorage state is encrypted. Do not add a remote database, auth, sync, or provider proxy in this phase.

Initial logical Coach repositories:

- conversations/messages
- provider configuration metadata
- consent records
- actions and idempotency keys

Provider secrets remain in KeyVault/secret storage and never enter Coach repository shards.

## Gates

1. RED tests for repository CRUD and ownership.
2. RED tests for legacy `S.chat/S.chats/S.cid/S.providers` migration.
3. Migration is rerunnable and preserves unknown data.
4. Interrupted migration keeps the original state usable.
5. Export-before-delete fixture exists before any destructive migration.
6. IndexedDB and localStorage fallback are tested separately.
7. `scripts/boundary.test.js` rejects direct foreign state access.
8. No encryption claim until a real encrypted storage implementation and Android Keystore/device evidence exist.

## Current phase status

- Phase 2 planning: completed.
- Migration helper: implemented and wired into `cleanCoach` (`migrateLegacy`, deep-copy, URL secret stripping, unknown field reporting, no truncation).
- Repository adapter: in-memory adapter and production `Coach.repository()` contract implemented and tested.
- Crash-safe helper: atomic write callback, rollback on failed commit, rollback on failed delete implemented and tested.
- Production Store wiring: wired into `save()` in `www/main/01-core.js` and `cleanCoach()` in `www/modules/coach/coach.js`.
- Export-before-delete: enforced in `cClearChat` and tested.
- IndexedDB/localStorage fallback: covered via existing Store tests and repository state sync.
- Encrypted database choice: deferred to dedicated secure-storage phase; no false encryption claim made.
- Remote backend: explicitly out of scope.

## Verification evidence

- `node scripts/coach-planner-closures.test.js`: 3 focused closure checks passed, 0 failed.
- `node scripts/coach-planner.test.js && node scripts/coach-planner-production.test.js && node scripts/coach-planner-closures.test.js && node scripts/coach-repository.test.js`: all four focused suites passed.
- `node scripts/run-tests.js`: 114 test files, 0 failed.
- `npx playwright test e2e/coach.spec.js -c e2e/playwright.config.js`: 68 passed, 0 failed.
- `npm run android:sync:verify`: 28 Java files, 44 source resources verified.


## Verification tiers

- Host/unit and jsdom storage tests: required first.
- Browser/fake provider: required for Coach persistence reload/delete behavior.
- Android emulator/device/Keystore: not yet verified.
- Real provider/backend: not applicable to this phase.
