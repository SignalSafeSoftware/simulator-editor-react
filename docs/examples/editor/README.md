# Standalone simulator editor example

- [Live GitHub Page](https://signalsafesoftware.github.io/simulator-editor-react/)
- [Repository](https://github.com/SignalSafeSoftware/simulator-editor-react) (private; access required)
- [Related device demo](https://signalsafesoftware.github.io/simulator-device/)

Run with Node 24:

    npm ci --ignore-scripts
    npm run dev
    npm run build

For automated browser checks, install Chromium with "npx playwright install chromium", then run "npm run test:browser".

This host example controls section state and projects it into a shared simulator preview. It includes synthetic conversations, email, contacts, call history and a sandbox browser page. Nothing is saved, sent or synchronized with a server. Reset restores the fixture; Download exports the editor section data, not a host-specific published simulator envelope.

The versioned archives in vendor/npm/ are exact unpublished review candidates with SHA-256 recorded in its manifest. The npm lock uses real local archive and registry integrity values. This keeps the example reproducible before coordinated package publication; it does not turn a candidate into a published npm release. Rebuild and replace these archives together after source changes; do not edit extracted dependencies.

The editor accepts a renderPreview slot. The example's adapter owns projection and session state; screens, contact cards and shared styling remain package-owned. A real host must supply persistence, authorization and the rest of its integrations.

GitHub Pages serves only the built static dist/ output. Repository privacy is preserved, but the demo and its synthetic content are publicly accessible. The gh-pages branch contains the deployed build and a provenance file. Run the documented package quality and browser checks before replacing that branch. There are no API keys, authentication cookies, private fixtures or live-service integrations in the output.
