# Simulator editor development

Read the applicable skills under `.codex/skills` before implementing or reviewing changes.

This package owns controlled authoring panels, selection, JSON editing and editor presentation. Core owns device contracts, React owns runtime screens, and device owns preview composition. Hosts own document envelopes, API calls, persistence, permissions and publication. Inject the preview through `renderPreview`; never import DeliveryPlus, PhoneMe, API clients or runtime device composition here.

Preserve strict typing, accessibility, 40-character editor row labels, stable ids, JSON repair, disabled state and two-way preview navigation. Use explicit owner-module exports; no barrels, forwarding modules or compatibility aliases. Reuse the graph editor Bootstrap theme for panels; never apply the simulated phone theme to authoring forms.

Run typecheck (including tests), lint/module boundaries, format check, tests with coverage, build and packed-package smoke checks. Verify the actual DeliveryPlus integration in the browser after extraction. Keep changes local: no publication, commits or pushes unless explicitly requested.
