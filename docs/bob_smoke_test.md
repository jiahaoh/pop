# Bob packaged-plugin smoke test

Use this checklist for behavior that static checks and Bun mocks cannot prove.
The installed copy in Bob is the source of truth.

## Test record

Record these values before starting:

| Field | Value |
| --- | --- |
| Date and tester | |
| macOS version | |
| Bob version | |
| Repository commit | |
| Archive path | |
| Archive SHA-256 | |
| Repository version | |
| Archive `info.json` version | |
| Installed/copy `info.json` version | |
| Provider, model, and API URL shape | |

Use only a credential explicitly supplied for this run. Do not read credential
files, browser storage, the Keychain, or existing Bob settings to discover one.
Never paste credentials, authorization headers, or complete request bodies into
the test record.

## Package and installation

### P1 — Inspect the archive

- Prerequisite: `bun run package` completed and
  `dist/pop-dev.bobplugin` exists.
- Action: run `unzip -t` and list the archive entries; extract `info.json` to a
  temporary directory for inspection.
- Expected: the archive is valid and contains exactly `main.js`, `info.json`,
  and `icon.png` at its root. The archive metadata uses a development version;
  repository metadata remains on the stable version.

### P2 — Install and verify the copied metadata

- Prerequisite: record the currently installed plugin name, identifier, and
  version. The development archive version must be intended to sort after that
  installed copy and before the next stable release.
- Action: open the archive, wait for Bob's asynchronous installation to finish,
  then inspect the metadata from Bob's copied plugin rather than the original
  archive.
- Expected: Bob installs or updates `Pop` / `jiahaoh.pop`, and the copied name,
  identifier, version, and minimum Bob version match the archive. A lower or
  equal installed version is not mistaken for a successful update.

Run P2 in Bob 1.8.0 and in the current supported Bob release before a stable
release when both environments are available.

## Settings rendering

### S1 — Common setup order

- Prerequisite: the development package is installed.
- Action: open the service settings and scan the form from top to bottom.
- Expected: API Key, model, custom model, API URL, reasoning, streaming,
  additional requirements, Custom command, Custom instruction, and Custom user
  template render in the order defined by `public/info.json`; labels and
  descriptions are readable without clipped or overlapping controls.

### S2 — Field types and defaults

- Prerequisite: use a fresh service instance so saved values do not hide
  defaults.
- Action: inspect every control and select each menu value once.
- Expected: API Key is secure; text areas have usable heights; the model,
  streaming, reasoning, and Custom user-template defaults match
  `public/info.json`; Auto, Model default, Fast, Standard, and Deep are each
  selectable.

### S3 — Custom model and action editing

- Prerequisite: settings form is open.
- Action: select Custom model, enter a raw model ID, then edit additional
  requirements plus all three Custom action fields and insert each advertised
  keyword.
- Expected: values can be saved and reopened unchanged; Bob preserves the
  unusual schema field `keyWords`; no undocumented conditional rendering is
  assumed.

## Provider validation

### V1 — Valid configuration

- Prerequisite: an explicitly supplied working API key and a supported provider
  configuration.
- Action: run Bob's service validation.
- Expected: validation completes once and reports success. Official OpenAI and
  Gemini may use model listing; Azure OpenAI, MiniMax, and OpenAI-compatible
  configurations use a small generation request according to their adapter.

### V2 — Invalid key

- Prerequisite: replace the key with an intentionally invalid, non-secret test
  value.
- Action: run validation once.
- Expected: validation completes once with a useful authentication/secret-key
  error and a troubleshooting link; Bob does not hang or report success.

### V3 — Invalid complete API URL

- Prerequisite: no live credential is needed.
- Action: enter a URL that does not end in `/responses` or
  `/chat/completions`, then run validation.
- Expected: configuration fails before network transport with a clear parameter
  error explaining the required complete URL shape.

## Action requests

Use harmless inputs with visibly different expected shapes. Record the action,
input shape, Bob languages, observed output, and pass/fail result, but not the
API key or full wire payload.

### T1 — Six actions and routing

- Prerequisite: valid configuration; set the Custom alias to `/s`, instruction
  to `Summarize the text. Return only the summary.`, and user template to
  `$text`.
- Action: run each row once. For commandless rows, remove the command and set
  Bob's languages as shown.

| Case | Input | Bob languages | Expected evidence |
| --- | --- | --- | --- |
| Ask | `/q What is 2 + 2?` | Any | Direct answer containing `4`, not a translation of the question |
| Custom | `/s Bob plugins run in JavaScriptCore. They use Bob globals.` | Any | One summary following the saved task, not a built-in action |
| Grammar | `/g She go to work yesterday.` | English → English | Corrected text plus a divider and brief explanation |
| Polish | `/p This sentence is a little awkwardly written.` | English → English | Only smoother English text |
| Translate | `/t Hello, world!` | English → Simplified Chinese | Only the Chinese translation |
| Wording | `/w A polite way to decline a meeting` | English → English | 3–5 candidates with tone labels and differences |
| Default Translate | `Hello, world!` | English → Simplified Chinese | Same task shape as explicit Translate |
| Default Polish | `This sentence is a little awkwardly written.` | English → English | Same task shape as explicit Polish |

- Expected: every case reaches its intended task; the Custom alias works;
  built-in short aliases are recognized; no transform action executes an
  instruction embedded in its data.

### T2 — Non-streaming request

- Prerequisite: valid configuration with streaming disabled.
- Action: run one deterministic sample once.
- Expected: no partial updates are emitted; one terminal result appears; model
  formatting and blank lines are preserved inside one Bob paragraph; there is
  no JavaScriptCore runtime error.

### T3 — Streaming request

- Prerequisite: the same provider/model with streaming enabled.
- Action: run the same sample once and watch partial output.
- Expected: output grows cumulatively without duplicated MiniMax prefixes or
  exposed reasoning; exactly one terminal result follows; a Responses stream
  without `response.completed` is not accepted as success.

### T4 — Cancel a request

- Prerequisite: streaming enabled and an input/provider combination that runs
  long enough to cancel intentionally.
- Action: start the request, wait for visible progress if possible, then cancel
  it from Bob.
- Expected: the underlying Bob request stops, no late success replaces the
  canceled state, and the service does not hang or call completion repeatedly.
  Record Bob's observed cancellation presentation because static tests only
  prove that `cancelSignal` is forwarded.

## Errors and privacy

### E1 — Provider API error

- Prerequisite: use a safe failure such as an invalid model ID; retain a valid
  key only if the provider requires it to reach model validation.
- Action: run one streaming and one non-streaming request.
- Expected: each request terminates once with a useful `ServiceError`; partial
  streaming text is not converted into success after a provider terminal error.

### E2 — Network error

- Prerequisite: configure a harmless unreachable test endpoint with a valid
  complete API path.
- Action: run validation or a request, then restore the prior endpoint.
- Expected: Bob receives a network error with the underlying useful message and
  troubleshooting link; the request does not hang until after the plugin's
  120-second timeout.

### E3 — Log redaction

- Prerequisite: Bob logging/export is available and an intentional failure has
  been produced.
- Action: inspect the relevant Bob logs and exported diagnostic data.
- Expected: no API key, `Authorization`/`api-key` header, or request body/source
  text is present. Diagnostic messages remain attributable to this plugin.

## Evidence boundary

| Evidence | Can prove | Cannot prove |
| --- | --- | --- |
| `bun run lint` | Formatting rules, TypeScript contracts, unused/fallthrough checks | Runtime host or provider behavior |
| `bun run test` | Mocked request shapes, parsers, terminal branches, metadata/docs consistency, package helpers | Actual `$http`, Bob UI, installation, or live APIs |
| Opt-in live tests | A direct provider API accepts a tested request with an explicit credential | Bob `$http`, JavaScriptCore, packaged metadata, or other providers |
| `bun run build` | A CommonJS browser-target bundle and copied public assets are produced | Bob can load or execute it |
| `bun run check:runtime` | Expected exports, metadata equality, unique languages, and absence of selected forbidden tokens | Full JavaScriptCore syntax/API compatibility or callback semantics |
| Archive inspection | Flat files, integrity, and archive-local metadata | Bob accepts, copies, or activates that version |
| Installed Bob smoke test | Actual settings, update behavior, `$http`, callbacks, cancellation, and JavaScriptCore execution for that environment | Every provider/model or future Bob version |

## M0 risk register

| ID | Risk or open assumption | Impact | Required follow-up |
| --- | --- | --- | --- |
| R1 | Static checks do not execute the bundle in Bob's JavaScriptCore | Unsupported syntax or host behavior can escape CI | Run P2 and T1–T3 in Bob before runtime releases |
| R2 | Streaming correctness depends on Bob delivering stream chunks and one terminal handler with observed ordering | A host difference can duplicate, truncate, or hang output | Observe T3 and T4; keep the callback-style transport contract |
| R3 | Non-streaming completion assumes Bob's `query.onCompletion` does not throw | A throwing callback could cause a second completion attempt | Verify normal Bob behavior; add a shared terminal guard if future evidence requires it |
| R4 | Passing `cancelSignal` is statically tested, but Bob's cancellation terminal behavior is not | Late output or a hanging request can remain | Record T4 behavior in supported Bob versions |
| R5 | Development version precedence and asynchronous copy behavior are Bob-specific | Bob may silently keep an older installed copy | Compare archive and copied metadata in P2 |
| R6 | Exact OpenAI model mappings are reused for an OpenAI-compatible endpoint only when the same model ID is configured; unknown and namespaced IDs omit controls | A partial gateway may still reject a reasoning parameter | Test representative gateways before claiming support |
| R7 | Bob's option form is static and saved-setting migration is a release contract | New Pop settings can become crowded or break saved values | Freeze identity and migration decisions in M1 before changing metadata/settings |
| R8 | Multiple comma-separated API keys are selected randomly, including during validation | One bad key can make validation intermittent | Keep keys individually valid or add deterministic diagnostics in a future scoped change |
| R9 | Provider model and reasoning contracts can drift after repository documentation is verified | Valid request bodies can become stale | M3 sources were refreshed on 2026-08-31; recheck again during M4 release validation |
| R10 | Direct live tests use Bun/browser-style APIs, not Bob `$http` | A provider probe can pass while the plugin fails in Bob | Treat live tests as supplemental; complete T1–T3 in Bob |

## Historical M0 handoff to M1

- Pop will be an independent product with its own name, identifier, and Appcast.
- The exact release identity and metadata changes belong to M1, not M0.
- M0 does not change product behavior, the stable version, or release metadata.
- M1 must explicitly define saved-setting and installation coexistence behavior
  before metadata or configuration keys change.
- Bob's installed behavior remains authoritative when it disagrees with types,
  documentation, Bun mocks, or assumptions from Node.js/browser runtimes.
