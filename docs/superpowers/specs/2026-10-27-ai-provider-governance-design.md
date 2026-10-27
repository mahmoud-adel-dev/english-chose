# AI Provider Governance Design

## Intent

Upgrade the existing Flutter admin panel from a manually maintained Gemini-only model list into a provider-governance screen where an administrator can securely add provider credentials, verify whether each credential works, discover the models that credential can access, and see only the quota, usage, balance, and reset information reported by the provider itself.

The main reason is operational trust: the administrator must be able to tell whether a credential is usable, why it is not usable, which models it authorizes, and how much provider-assigned capacity remains without relying on invented application-side quota numbers.

## Current state

- `AiProvider.apiKeySecretKey` stores only the name of an environment variable; the admin UI cannot enter or rotate a real credential.
- The runtime router has hard-coded adapters for Gemini and the mock provider.
- The providers endpoint can create a database row but cannot test credentials, discover models, synchronize provider metadata, or read provider quota.
- Models, context windows, and prices are entered manually.
- The analytics screen calculates estimated cost from locally stored token prices. It does not represent provider-reported balance or quota.
- The Flutter screen combines providers and models into static cards and offers only an “Add Model” dialog.

## Goals

1. Provide a catalog of first-class providers: OpenRouter, OpenAI, Google Gemini, Anthropic, Groq, Mistral, DeepSeek, xAI, Cohere, Together AI, Fireworks AI, Perplexity, and a custom OpenAI-compatible provider.
2. Make OpenRouter a first-class integration. With an inference key, call `/api/v1/key` for key-level usage, remaining limit, reset policy, expiry, and free-tier status, and call `/api/v1/models` to discover models and metadata. Allow an optional OpenRouter management key for account-wide credits from `/api/v1/credits`.
3. Accept a provider inference credential and, only where the provider requires it, an optional admin/management credential for organization usage, cost, or limits.
4. Encrypt credential values at rest on the backend. Return only masked labels and credential metadata to clients. Never log, echo, or include a credential in an error.
5. Test credentials server-side and classify the result into actionable states rather than a single active/inactive boolean.
6. Discover only the models accessible through the configured credential, normalize their capabilities, context length, and provider-reported pricing when available, and let the administrator select which discovered models to import or activate.
7. Display only provider-reported quota/balance/usage data. Never substitute locally configured quota or locally estimated cost into a provider-quota field.
8. Preserve local request analytics for operational history, clearly labeled “local observed usage” and visually separated from provider-reported quota.
9. Keep task routing compatible with the selected active models and add OpenAI-compatible execution support for providers using that protocol.

## Non-goals

- Creating, increasing, or overriding provider quotas from this application.
- Promising account balance or quota data when the provider does not expose it to the supplied credential type.
- Managing provider billing methods or purchasing credits.
- Supporting every AI company in existence with a bespoke adapter in the first release. New providers must be addable through the provider registry or the custom OpenAI-compatible option.
- Rebuilding unrelated admin tabs, user quotas, or the learner experience.

## Anti-goals

- Do not display guessed quota, scraped dashboard data, or a static public tier limit as if it belonged to the configured key.
- Do not mark a valid key inactive because of a temporary `429`, provider outage, or network timeout.
- Do not validate a key only by its prefix or format.
- Do not send credentials to Flutter after they are saved.
- Do not make a paid generation request when a read-only authenticated endpoint can verify the key; if a minimal generation probe is unavoidable, label that provider behavior before the administrator runs the test.

## Selected approach

Use a capability-driven provider registry with dedicated connectors for providers whose authentication, model catalog, or quota APIs differ, plus a reusable OpenAI-compatible connector for compatible inference APIs.

This was selected over two alternatives:

1. **One generic OpenAI-compatible connector for everything:** less code, but cannot accurately support Gemini/Anthropic authentication, provider-specific quota, OpenRouter key information, or reliable error classification.
2. **A fully custom implementation for every provider:** maximum specialization, but too costly to maintain and makes adding new compatible providers unnecessarily slow.
3. **Selected hybrid:** dedicated connectors for OpenRouter, OpenAI, Gemini, and Anthropic; shared protocol connectors for compatible providers with provider-specific capability hooks. This gives accurate key and quota behavior while keeping extension practical.

## Provider capability contract

Each registered provider declares:

- identity, display name, base URL defaults, and credential fields;
- whether it supports model discovery;
- whether provider quota is available from the inference key, an admin key, response headers, or not programmatically available;
- supported quota dimensions such as credit balance, monetary limit, usage, RPM/RPD, TPM/TPD, audio seconds, and reset time;
- whether the test is read-only or may incur a minimal charge;
- model metadata and inference protocol support.

The backend connector exposes four operations:

- `validateCredentials`: authenticate using the least expensive read-only request available and return normalized status, latency, provider error code, and safe explanation.
- `discoverModels`: return only credential-accessible models when the provider supports such filtering; otherwise label the catalog scope returned by the provider.
- `fetchProviderQuota`: return normalized provider facts plus source, scope, retrieval time, and unsupported fields.
- `execute`: perform inference for the application router using the stored credential.

## Credential and security design

- Add an application encryption key in server configuration. Encrypt inference and management secrets with authenticated encryption before storing them.
- Store ciphertext, initialization vector/nonce, authentication tag, key version, last four characters, and credential type. Never store plaintext.
- Saving a replacement credential is write-only. An empty credential field means “keep existing”; explicit removal requires a separate confirmation action.
- Provider HTTP clients receive decrypted values only inside the server process for the duration of a request.
- Sanitize provider errors before persistence or response. Audit credential creation, replacement, removal, testing, model synchronization, and provider activation without secret values.
- Admin authorization remains mandatory for all governance endpoints.

## Credential health states

The UI and API use these normalized states:

- `UNTESTED`: saved but not tested.
- `ACTIVE`: authenticated and the required provider endpoint succeeded.
- `ACTIVE_LIMITED`: valid but missing permission for some optional capability, such as billing or admin usage.
- `QUOTA_EXHAUSTED`: valid, but provider-reported credit/spend/daily quota is exhausted; include reset time when available.
- `RATE_LIMITED`: valid but temporarily rate-limited; include retry/reset time.
- `INVALID_CREDENTIAL`: missing, malformed, expired, revoked, or rejected authentication.
- `PERMISSION_DENIED`: credential is recognized but lacks required access or the project/organization is restricted.
- `BILLING_DISABLED`: billing/prepay requirement prevents use.
- `PROVIDER_UNAVAILABLE`: provider returned a server outage.
- `NETWORK_ERROR`: DNS, TLS, timeout, or connection failure.
- `UNKNOWN_ERROR`: sanitized unclassified provider response.

HTTP status alone is not sufficient. Provider-specific error codes/messages determine the state; for example, a `429` can mean a temporary rate limit or an enforced monthly spend limit.

## Provider quota semantics

Every quota snapshot includes:

- `source`: provider endpoint or response headers;
- `scope`: API key, project, workspace, organization, or account;
- `retrievedAt` and optional `resetsAt`/reset policy;
- provider-reported limit, remaining, and used values with units;
- availability state: available, requires management credential, unsupported, permission denied, or temporarily unavailable.

The application must not conflate “API key” with quota scope. Gemini limits are project-scoped, Groq limits can be project/organization-scoped, and provider admin APIs can return organization-wide usage even when authenticated separately.

When a normal inference key cannot retrieve quota, the UI says exactly why, such as “OpenAI usage requires an organization admin credential” or “Gemini exposes this quota in AI Studio and not through this API key.” No value is synthesized.

## OpenRouter behavior

- The inference key test calls `GET https://openrouter.ai/api/v1/key`.
- The response supplies key label, usage, daily/weekly/monthly usage, configured monetary limit, remaining limit, reset policy, expiration, and free-tier status.
- Model synchronization calls authenticated `GET https://openrouter.ai/api/v1/models` and imports identifier, name, context length, modalities/capabilities, and input/output pricing.
- If a management key is supplied, `GET https://openrouter.ai/api/v1/credits` adds total purchased credits and total usage. Without it, the key-level data remains complete and account-wide credits are labeled as requiring a management key.
- OpenRouter execution uses its OpenAI-compatible chat/completions API with the stored inference key.

## Admin API design

Extend the admin backend around these resource actions:

- list provider catalog and configured provider connections;
- create or update a provider connection and its write-only credentials;
- test a saved credential or test an unsaved credential without persisting it;
- fetch/refresh provider quota;
- discover models for a provider connection;
- import selected discovered models with an upsert, preserving administrator activation choices;
- activate/deactivate a provider or model without treating manual disablement as credential failure;

Responses return normalized view models and never raw Prisma rows containing ciphertext. Concurrent refreshes are guarded so a stale test cannot overwrite a newer credential state.

## Data design

Refine the current provider/model records and add focused records for:

- encrypted provider credentials and credential type;
- last credential-test result, timestamp, latency, safe reason, and provider error code;
- quota snapshots as provider-reported structured JSON with source/scope timestamps;
- model discovery snapshots with raw provider metadata for traceability;
- model activation/import state separate from discovery availability.

Provider status (enabled/disabled by the administrator) remains separate from credential health. Existing task routings continue to reference imported `AiModel` rows.

Each provider catalog identifier is globally unique in configured connections. The administrator can configure only one connection and one inference credential per provider. A provider may additionally hold one management credential when its official quota/usage API requires a separate credential; that management credential belongs to the same connection and does not create a second provider entry.

## Admin interface

Replace the static models tab with a provider management workspace:

1. A catalog/add-provider action with searchable provider cards, including OpenRouter.
2. Configured provider cards showing enabled state, credential health, last checked time, accessible-model count, quota availability, and a concise quota summary.
3. A provider details drawer/page with sections for credentials, connection test, provider quota, discovered models, imported models, and diagnostics.
4. Credential fields are write-only password fields with masked saved-state indicators. The management-key field appears only when supported.
5. “Test & discover” runs credential validation, quota fetch when possible, and model discovery, but presents the three results independently so optional quota failure does not hide a valid key or models.
6. Model discovery supports search, capability filters, select all/none, and bulk import. Imported models show provider metadata and whether pricing is provider-reported.
7. All status reasons are actionable and safe, for example “Key rejected (401)”, “Valid key; billing permission missing”, or “Temporary rate limit; retry after 42 seconds.”

The existing Costs & Analytics tab remains the place for locally observed requests and estimated/actual recorded costs. Provider quota appears in provider management with explicit provider scope.

Providers that already have a configured connection are marked as configured in the catalog and cannot be added again. Their existing card opens edit/replace-credential actions instead.

## Error handling and refresh behavior

- Tests and quota refreshes have timeouts and do not retry authentication or payment errors.
- Temporary network, `429`, and `5xx` conditions preserve the last successful quota snapshot, mark it stale, and show the current refresh error.
- Credential replacement resets health to `UNTESTED` and invalidates prior model-discovery authorization until a new test succeeds.
- Model synchronization does not delete imported models automatically when a provider stops returning them; it marks them unavailable and warns about task routings that use them.
- All external calls use bounded response sizes and pagination where required.

## Custom OpenAI-compatible connection

The first release supports an administrator-supplied HTTPS base URL and bearer API key using the standard `/v1/models` and `/v1/chat/completions` paths. It does not accept arbitrary custom headers or arbitrary endpoint templates, because those would expand the secret surface and make validation unpredictable. If the server does not implement model discovery, the administrator may add model identifiers manually under that connection; quota is shown as unsupported unless the server returns standard rate-limit headers.

## Existing configuration migration

Existing provider rows, manually imported models, and task routings remain in place. Existing environment-variable credential references are represented as an `ENV_REFERENCE` credential source and continue to work without copying their plaintext values into the database. The administrator can later replace an environment reference with an encrypted stored credential through the write-only UI. The current Gemini and mock adapters remain operational until their connections are explicitly migrated to the registry-backed runtime.

## Refresh policy

- Credential validation and model discovery run only when an administrator saves/tests a connection or presses refresh; there is no background scheduler in this release.
- Opening provider details refreshes provider quota only when the last successful snapshot is more than five minutes old. A manual refresh remains available.
- A failed automatic refresh preserves and labels the last successful snapshot as stale. These read-only refreshes are not recorded as credential-change audit events.

## Unavailable model routing

- A model missing from a later provider discovery snapshot is marked unavailable but not deleted.
- Unavailable models cannot be assigned to new task routings.
- An existing routing whose primary model becomes unavailable skips that primary and uses its configured active fallback.
- If no active fallback exists, the task fails with an explicit no-available-model error and the admin UI shows a routing warning; the system does not silently choose an unrelated model.

## Testing and acceptance criteria

- Unit tests cover secret encryption/decryption, error redaction, status classification, quota normalization, stale snapshot behavior, and provider connector parsing.
- Route tests cover admin authorization, write-only secrets, credential replacement, test/discover/quota endpoints, invalid input, concurrency protection, and audit events.
- Connector tests use recorded/synthetic HTTP responses rather than real paid keys.
- Flutter tests cover provider cards, masked credentials, separate test/quota/model results, unsupported quota explanations, and model bulk import.
- OpenRouter acceptance: a valid inference key is reported active, `/api/v1/key` quota fields are displayed with their correct units/reset, accessible models are discoverable, selected models import successfully, and invalid/expired/limited keys show the provider-derived reason.
- No backend response or log contains a submitted secret.

## Constraints and builder calls

- Keep the existing Next.js API, Prisma/PostgreSQL, Flutter/Provider, and current authentication architecture.
- Follow test-driven development for backend and Flutter behavior.
- Prefer native `fetch` clients and the existing dependency set unless a provider SDK materially improves correctness.
- Provider catalog metadata can be code-defined; configured credentials, health, snapshots, and imported models are database-backed.
- Exact route naming, widget decomposition, migration names, pagination sizes, and visual polish are left to the builder as long as the behavior above is preserved.

## Delivery boundary

This is one project delivered in vertical slices: secure credential foundation and provider registry; OpenRouter end-to-end; shared OpenAI-compatible providers; dedicated OpenAI/Gemini/Anthropic quota behavior; remaining catalog integrations; Flutter provider workspace; then routing integration and full verification. Each slice must leave existing mock/Gemini flows usable or explicitly migrated.
