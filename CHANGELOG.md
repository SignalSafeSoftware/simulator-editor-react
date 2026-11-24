# Changelog

## 0.1.4 — 2026-11-23

- Publish npm releases through GitHub Actions OIDC trusted publishing.
- Document the designated publisher, validation and token retirement process.

## 0.1.3 — prepared 2026-11-22

- Make spacing explicit between authoring labels and their existing controls without changing accessible names or adding wrappers.
- Replace super-linear email-link punctuation trimming with a linear scan while preserving exact surrounding-character rules, migration output and idempotence.
- Keep regional identifier ordering deterministic with an explicit UTF-16 comparator; retain all country, currency and time-zone options. Use `Number.NaN` for an unchanged invalid conversation timestamp result.
- Add punctuation/adversarial-input and regional-order regressions. Public exports, peer ranges, styling and host contracts remain unchanged.

Prepared metadata for the already merged reliability fixes; publication and consumer adoption are separate gates.

## 0.1.2 — 2026-11-15

- Upgrade the matched development Vitest/coverage pair to 4.1.12 with a genuine lock, removing the vulnerable test-worker/mock dependency chain without overrides.
- Add keyboard, focus, stale-selection and malformed-callback recovery regressions. Retain typed owner/message identities on generated conversation child nodes instead of decoding them again during deletion; public IDs and validation remain unchanged.

- Keep conversation normalization idempotent when dated runtime replies are added to an undated authored script. Preserve authored message identities, order, explicit delays and existing timestamps without repeatedly assigning the last-activity timestamp to undated messages.
- Preserve genuine legacy timestamp migration when no message already represents that timestamp.
- Support the compatible React 0.21 and 0.22 package lines through an additive peer range; no public export, storage or host API shape changes.

The user-authorized release follows the existing matching-tag workflow with provenance. Earlier local preparation notes are historical; publication and normal registry adoption are verified separately.

## 0.1.1 — 2026-11-11

- First public npm release, with the repository and live example available publicly.
- Add a tag-verified publish workflow gated by strict checks, complete coverage, build and packed-consumer smoke tests.

- Rename Simulator to Preview and support host Properties in the same accessible tab row.
- Preserve preview state, keyboard navigation, invalid JSON protection and optional host route control across tabs.

## 0.1.0 — prepared 2026-11-10

- Fix clean CI installs with checked simulator development archives and a synchronized lockfile; resolve archive paths for isolated package smoke consumers.

- Add repository, live example and related-package links; document the coordinated 100% coverage verification and synthetic editor example.

- Introduce the controlled authoring workspace, section JSON editors and searchable starting-item selection.
- Synchronize selected conversations, messages, emails, contacts, photos and Vault content with host preview navigation.
- Keep preview browsing separate from persisted starting positions; capture Starting Page and Reset to Home remain explicit.
- Navigate immediately after adding Vault folders/entries, preserving unsaved secret handling.
- Keep envelopes, HTTP, authorization, saving and publication in the host.

Prepared source version; npm publication and downstream registry-lock refresh are separate steps.

- Refresh public simulator development/peer references to published core 0.7.2, React 0.21.2 and theme 0.13.4. Packed consumers refresh online metadata; the editor remains private and unpublished.
