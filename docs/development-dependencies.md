# Reproducible development dependencies

The editor peers declare the coordinated public simulator versions expected by consumers. During release preparation those versions may not yet exist on npm. Root development dependencies therefore use the exact simulator-core 0.7.2, simulator-react 0.21.2 and simulator-theme-bootstrap 0.13.3 archives already committed under `docs/examples/editor/vendor/npm/`. The npm lockfile records their real integrity values; root overrides keep transitive simulator resolution on the same artifacts.

Run `npm ci --ignore-scripts` from a fresh checkout, followed by `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build` and `npm run smoke:package`. No `--force` or `--legacy-peer-deps` is required. The smoke test resolves local development archives relative to this repository before installing its isolated consumer.

The clean-checkout sequence passed on 2026-11-11: 182 tests and 100% statements, branches, functions and lines, plus strict source/test types, lint, format, build and packed consumer runtime/types. This verifies source development and candidate integration; it does not claim the peer versions are published to npm. Keep published peer ranges intact. Registry consumers and downstream registry pins still require the coordinated packages to be published first.

To refresh candidates, rebuild and verify the owning packages, replace their tracked archives and SHA-256 manifest, and regenerate the npm lockfile using npm. Never fabricate registry resolutions or integrity fields. The independent example has its own lockfile and browser workflow.
