# Development dependencies

The root development lock and standalone example use public registry packages: core 0.7.3, React 0.22.0 and theme 0.13.5; the example also installs device 0.22.0 and editor 0.1.3. Root peer ranges retain support for the previously validated cohort. Regenerate and commit npm lockfiles from real registry metadata; never fabricate integrity values.

Editor 0.1.3 is published and its public archive matches the reviewed release candidate. The example selects that registry version directly; no local archive or path alias is required. Packed smoke consumers prefer online metadata so a stale cache cannot hide newly published peer versions. See the [current state](current-state-summary.md) for the release receipt and verification scope.
