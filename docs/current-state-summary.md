# Current state

## Published registry release — 0.1.2 (2026-11-15)

The immutable `v0.1.2` [release workflow](https://github.com/SignalSafeSoftware/simulator-editor-react/actions/runs/43802312670) passed complete verification and provenance publication at commit `342880a59d8ceb2167b2bb95e893b3eb9a2a73cf`. All 190 files in the actual public npm archive match the reviewed candidate. Archive SHA-256: `6cf963a7da8c479d0127c2e73ae61e86ef380afa365355019ae5dc3b6856664f`.

## November 15 release scope — 0.1.2

Conversation normalization no longer assigns an already represented legacy last-activity timestamp to undated authored rows. Repeated read/write after a runtime reply preserves the authored order, stable IDs and scripted delays while retaining genuine legacy timestamp migration. The React peer range supports both ^0.21.2 and ^0.22.0; runtime composition remains an injected preview rather than an editor dependency.

The final source passes 202 tests with 100% executable-source coverage, strict source/test types, lint/module checks, formatting and build. Release checks include packed consumers against the old and new supported React cohorts and genuine registry development/example locks. The matched Vitest/coverage 4.1.12 development upgrade uses a genuine registry lock and npm audit reports zero vulnerabilities. Publication uses the existing immutable-tag release workflow; historical 0.1.1 details below remain the previous verified checkpoint.

## Historical published checkpoint — 0.1.1

Public release source **0.1.1**, including the unified optional Properties, Preview, JSON tabs. Publication is verified by the v0.1.1 release workflow and npm registry receipt.

## Coordinated public references

| Package | Registry version |
| --- | --- |
| Core | 0.7.2 |
| React | 0.21.2 |
| Device | 0.21.4 |
| Theme | 0.13.4 |

Package manifests and examples select these public registry versions. The example uses editor 0.1.1 from npm; the legacy editor archive is removed. Historical candidate reports remain in the release/verification documents; they describe prior states, not current dependency requirements.

## Verification

184 executable-source tests pass with 100% statements, branches, functions and lines. Strict types, lint, formatting, build and packed-consumer checks pass where applicable. Theme additionally passes real Chromium layout checks. The device example passes 16 browser tests and the public editor example passes 5.

Device 0.21.3 was blocked by a stale local Yarn lock resolution; its tag was retained. Device 0.21.4 was verified from a fresh checkout and empty cache, and its release guard rejects file/link lock resolutions. Theme 0.13.4 preserves the existing scrollbar patch without reverting newer shared layout fixes.

## Links

- [Repository](https://github.com/SignalSafeSoftware/simulator-editor-react)
- [Editor example](https://signalsafesoftware.github.io/simulator-editor-react/)
- [Device example](https://signalsafesoftware.github.io/simulator-device/)
- [Related packages](links.md)
