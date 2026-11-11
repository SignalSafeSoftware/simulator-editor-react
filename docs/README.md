# Simulator editor documentation

- [Current source summary, ownership and verification limits](current-state-summary.md).
- [Integration API, styling and local artifact workflow](../README.md).
- [Development rules and sibling skills](../AGENTS.md).
- [DeliveryPlus extraction evidence](../../../DeliveryPlus/docs/quality/simulator-ui/editor-package.md).
- [All ecosystem packages](../../docs/package-inventory.md).

Docker startup was resolved in the 2026-11-08 follow-up. The registry `tree-spec-editor@0.4.1` archive lacks `EdgesPanel`; the owning source is now consumed as checksum-verified local candidate `0.4.2-local.20261108.1`, with registry pins unchanged. Chrome verified the normal Docker administration simulator and selected-node graph editor, plus administration/workspace Vite connections. Opt-in loopback HMR bypasses Ergo’s failing WebSocket tunnel. No installed package files were patched and nothing was published. See DeliveryPlus `docs/quality/simulator-ui/docker-startup.md` for scope and configuration.
