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

The example installs public core 0.7.2, React 0.21.2, device 0.21.4 and theme 0.13.4 from npm. Only the private, unpublished editor remains a versioned archive in vendor/npm/ with a recorded SHA-256. The npm lockfile records actual registry and archive integrity values. Do not publish the private editor or edit extracted dependencies.

The editor accepts a renderPreview slot. The example's adapter owns projection and session state; screens, contact cards and shared styling remain package-owned. A real host must supply persistence, authorization and the rest of its integrations.

GitHub Pages serves only the built static dist/ output. Repository privacy is preserved, but the demo and its synthetic content are publicly accessible. The gh-pages branch contains the deployed build and a provenance file. Run the documented package quality and browser checks before replacing that branch. There are no API keys, authentication cookies, private fixtures or live-service integrations in the output.

The preview wraps `SimulatorPhoneDevice` in the shared `simulator-root simulator-host-device` theme classes. Page spacing stays outside that wrapper. Import Bootstrap Icons as required by the authoring theme; never recreate a device skin in example CSS. Browser tests assert the shared frame, palette and icon font in addition to authoring behavior.
