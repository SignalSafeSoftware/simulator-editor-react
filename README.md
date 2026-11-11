# @signalsafe/simulator-editor-react

[Repository](https://github.com/SignalSafeSoftware/simulator-editor-react) · [Live editor example](https://signalsafesoftware.github.io/simulator-editor-react/) · [Package links and examples](docs/links.md)

Prepared source: **0.1.0**. See [current summary](docs/current-state-summary.md), [changelog](CHANGELOG.md) and [coordinated release preparation](docs/release-2026-11-10.md). Publication status and installed host versions are tracked separately.

Controlled React authoring for simulator content. This package contains the existing conversation, message, contact, email, phone, browser, Home and starting-screen editors extracted from DeliveryPlus.

## Ownership

- This package owns authoring fields, panels, shortcuts, selection and section JSON editing.
- `simulator-core` owns canonical device contracts and validation; `simulator-react` owns runtime UI; `simulator-device` composes the running preview.
- Hosts own document envelopes, metadata storage, HTTP clients, permissions, saving and publication. Nothing in this package calls a server or persists data.

## Integration

Import `SimulatorEditor` from `@signalsafe/simulator-editor-react/SimulatorEditor` and its contracts from `@signalsafe/simulator-editor-react/editorTypes`. There is no root barrel.

Supply a controlled `sections` array with the keys `entry_point`, `messages`, `email`, `contacts`, `phone`, `internet` and `home`. Each entry contains its label and value. `onChange(section, value)` updates the host's state. The messages section accepts `AuthoredConversation[]`; `parseConversations` validates imported conversation JSON. Contact rows can carry the rich `details` model defined by `simulator-react/views/contacts/contactFormModel`.

`renderPreview(context)` supplies the existing simulator-device preview. Pass `context.navigation` into the host's navigation adapter. Report preview navigation through `context.onShortcutChange` and `context.onSectionNavigate` to update the highlighted shortcut and inspector. `context.selectedId` identifies the selected conversation. The package does not create another simulator implementation.

Use `disabled` for read-only authoring. `onValidityChange` reports whether the current section JSON is valid. A host may supply `validateJson` for its additional portable JSON restrictions. Whole-document repair and template properties remain host responsibilities.

## Styling

Import Bootstrap 5 once in the host, then `@signalsafe/simulator-editor-react/styles.css`. The editor reuses the graph editor's Bootstrap panel/icon theme through its peer dependency. The phone preview keeps its own simulator theme. Row summaries are capped at 40 Unicode characters; full content is preserved.

## Local review

This initial version is unpublished. DeliveryPlus uses its explicit checksum-verified `SIMULATOR_LOCAL_ARTIFACTS` integration. Build it with:

```sh
python3 frontend/scripts/build-local-simulator-review.py --ecosystem /path/to/ecosystem --package simulator-editor-react
```

Registry dependency pins and publication policy remain unchanged. Environments consuming the newly extracted editor must enable the local artifact directory until an authorized release is published and pinned. Do not publish the local prerelease; the release guard rejects it.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build` and `npm run smoke:package`. Typechecking includes tests. The package includes the applicable sibling skills in `.codex/skills`; see `AGENTS.md` for ownership and verification rules.

Current local source versions, ownership and verification limits: [current-state summary](docs/current-state-summary.md).

The optional `onJsonValidityChange` callback reports whether pending section JSON can be applied. Hosts can include invalid local JSON in their dirty-state guard even before a controlled value change is emitted. `onValidityChange` remains the aggregate save-validity callback, including required email sent timestamps. Routing remains host-owned.

Conversation contact numbers use a searchable multiple-value picker. Suggestions combine authored contacts and existing conversations; hosts pass those controlled data arrays. Authors may enter arbitrary values, choose several suggestions and remove individual tags without a separate Add form. No telephone-format validation or runtime screen styling is applied here.

## Collection workspace

The workspace places top-level collections below Shortcuts and shows the selected record's form in the right column. Conversation, email, contact, call, browser-page and Home records use flat list-group selection, with 40-character labels and Add/Remove actions. Nested contact endpoints remain with the selected contact. Phone incoming-call and voicemail configuration follow the same selection model.

Hosts can report an opened authored conversation through the preview context's optional `onConversationSelect` callback; existing `onEmailSelect` keeps preview email selection synchronized. The host remains responsible for preview composition and excludes preview-only temporary records from authoring selection. No persistence or HTTP behavior is added to the editor package.

At desktop widths the authoring workspace uses 25% / 50% / 25% columns for collections, preview and details. Smaller screens retain stacked columns. Visible collection labels are capped at 40 characters including the ellipsis; accessible names, tooltips and stored content keep the full value.

Selected collection highlighting spans the complete row, including its separate Delete action area. The Delete control has vertical spacing and uses the list-group horizontal padding token so it remains inset from the edge. These styles belong to the authoring package and do not change runtime phone screens.

Voicemail authoring includes Caller name, Phone number, Transcript and date/time. The optional phone number is retained in device JSON and displayed by the shared voicemail preview.

## Unified Calls

Phone authoring uses one Calls collection and one Call type dropdown: Incoming, Calling, Received, Accepted, Missed, Voicemail, Unanswered, Cancelled and Declined. Caller name, Phone number, date/time and relevant details share one selected-record form. Multiple voicemail records retain separate transcripts. The optional preview context `selectedCallId` / `onCallSelect` keeps record selection synchronized. Ambiguous imported outgoing outcomes remain explicit rather than guessed. See the [current migration and integration guide](../../DeliveryPlus/docs/quality/simulator-ui/unified-calls.md).

## Home app authoring

Vault, Settings and Photos are direct shortcuts. Vault presents folders as tree parents and entries as children, with focused folder/entry editors. The folder header + adds a folder; each folder + adds an entry. Renaming updates its entries, and deleting a populated folder moves its entries to Unfiled (or Recovered secrets when deleting Unfiled). Empty folders are removed without a replacement. Every folder can be renamed or deleted; Unfiled is an initial default, not a protected folder. Settings authors theme-owned appearance presets/colors, regional preferences and an optional hashed screen password. Vault authors typed notes, secrets and credentials with folders. Photos authors uploaded PNG/JPEG/WebP assets, captions, capture dates/times and coordinates; an image is required before saving. Collections retain the shared 40-character labels, add/delete controls and focused editor layout.

`simulatorHomeContent` owns the local authoring schema/default reader and completeness check. Hosts persist this value separately from legacy Home widgets/Store/section labels and seed their preview's existing device store. DeliveryPlus uses `content_json.simulator_home`; no device JSON or HTTP transport contract changes. Preview edits remain session-only. `SimulatorEditorPreviewContext.onHomePageSelect` follows Home tile navigation back into the authoring selection.

## Regional and folder selectors

Country, currency and time-zone fields use one searchable selected value. Countries cover all 249 ISO 3166-1 alpha-2 codes from IANA's country table. Currency options combine the ISO 4217 maintenance agency's current currency/fund list (SIX, published 2026-09-17) with browser-supported currency codes. Time-zone options combine IANA identifiers/backward aliases with the browser catalog and retain only supported names. Existing authored codes remain selectable. The explicit `simulatorRegionalOptions` subpath provides these options to host regional forms without copying catalogs.

Email and Vault share the same single-value picker. Folder selection applies immediately; new names commit on Enter, Add or blur. Only Email applies its reserved system-folder aliases. Regional selectors do not create arbitrary values. Color controls occupy two columns and remain aligned at enlarged text.

Photo capture fields reuse `SimulatorDateTimeField` with separate date/time inputs and `storage="local"`. This mode preserves zone-free wall-clock capture values, including times within a browser timezone's DST gap. Other callers retain the default instant/UTC storage behavior. Photo timezone controls are omitted; existing timezone and original metadata remain intact.

Opening an authored Vault secret in the preview selects its tree entry and properties inspector through `onVaultSecretSelect`; the folder expands automatically. Preview navigation does not save author data.

Vault preview folder selection and Back navigation select the matching folder or clear selection at the folder root. Folder operations in the authoring preview update the unsaved Vault data and tree; saving the simulator remains explicit. Removing the folder currently open in preview returns it to the folder list.

New and existing preview secrets share a temporary controlled draft with the properties inspector. Preview and inspector edits update the same draft; Save secret commits it to unsaved author data, while Back/Discard leaves the authored entry unchanged. The simulator cannot be saved while a Vault draft is open. Secret deletion updates the authored collection and closes its draft. Default portable hosts retain local draft state when no controlled draft is supplied.

Selecting a Vault folder or secret in the authoring tree requests navigation in the shared preview. The same item opens on both sides, including across folders and when reopening Vault from Home. Navigation retains the shared unsaved-change confirmation; rejecting it restores the prior tree selection and draft.

Photos selection is synchronized with the shared preview: opening a photo selects its collection row and properties; preview Back clears both. Preview saves/deletes update unsaved authored photo data. Selecting a valid photo in the collection opens the matching preview, including after returning Home; deleting its selected row returns the preview to the gallery. Incomplete upload drafts remain editable without navigating to an invalid preview record.

The JSON tab accepts a host-rendered JSON editor through `renderJsonEditor`. DeliveryPlus supplies the existing JSONEditor library with code, tree and text modes. Raw incomplete JSON and array sections remain editable; existing section validation controls when changes apply. Hosts without the slot retain the accessible textarea fallback. Section navigation projects the requested preview immediately so stale screen callbacks cannot redirect edits to the previous section.
