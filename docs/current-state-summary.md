# simulator-editor-react current-state summary

Prepared source version: **0.1.0** (2026-11-10). This is not a claim of npm publication.

- Introduce the controlled authoring workspace, section JSON editors and searchable starting-item selection.
- Synchronize selected conversations, messages, emails, contacts, photos and Vault content with host preview navigation.
- Keep preview browsing separate from persisted starting positions; capture Starting Page and Reset to Home remain explicit.
- Navigate immediately after adding Vault folders/entries, preserving unsaved secret handling.
- Keep envelopes, HTTP, authorization, saving and publication in the host.

## Coordinated versions

| Package | Prepared version |
| --- | --- |
| `@signalsafe/simulator-core` | `0.7.2` |
| `@signalsafe/simulator-react` | `0.21.2` |
| `@signalsafe/simulator-device` | `0.21.3` |
| `@signalsafe/simulator-theme-bootstrap` | `0.13.3` |
| `@signalsafe/simulator-editor-react` | `0.1.0` |

The source includes the current GitHub main branch plus the reviewed local simulator work. Existing merged release fixes are preserved. Source manifests and packaged declarations use the coordinated version set. See [release preparation](release-2026-11-10.md) for dependency and verification status.
