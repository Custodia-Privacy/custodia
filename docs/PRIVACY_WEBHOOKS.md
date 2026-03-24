# Privacy webhooks (consent & preferences)

Custodia can POST JSON to **your** HTTPS endpoint when:

1. **Consent** — a visitor saves choices via the banner SDK (`/api/banner/[siteId]/consent`). Configure per **site** (dashboard → site → **Consent webhook**).
2. **Preferences** — a subscriber saves choices on the public preference center. Configure per **preference center** (dashboard → **Preference Centers**).

## Security

- **TLS:** Production accepts **https** URLs only. **http** is allowed when `NODE_ENV !== "production"` (local testing).
- **Signing:** Each request includes:
  - `X-Custodia-Event` — e.g. `consent.recorded`, `preferences.created`, `preferences.updated`
  - `X-Custodia-Signature: sha256=<hex>` — HMAC-SHA256 of the **raw** JSON body using your webhook secret (UTF-8).
- **Secret handling:** When you first save a webhook URL (or rotate the secret), the app shows the secret **once** in the browser. Store it in your secret manager; it is not retrievable again from the API.

## Payload shapes (examples)

### `consent.recorded`

```json
{
  "event": "consent.recorded",
  "timestamp": "2026-03-22T12:00:00.000Z",
  "orgId": "…",
  "siteId": "…",
  "siteDomain": "example.com",
  "consentLogId": "…",
  "visitorId": "…",
  "consent": {},
  "action": "accept",
  "jurisdiction": "gdpr",
  "ipCountry": "DE"
}
```

### `preferences.created` / `preferences.updated`

```json
{
  "event": "preferences.updated",
  "timestamp": "2026-03-22T12:00:00.000Z",
  "orgId": "…",
  "centerId": "…",
  "centerName": "Marketing prefs",
  "userPreferenceId": "…",
  "email": "user@example.com",
  "externalId": null,
  "preferences": { "marketing_email": true },
  "source": "web"
}
```

## Delivery semantics

- Delivery is **best-effort** (fire-and-forget). Failures are logged server-side; there is **no** automatic retry queue yet.
- Validate the signature before trusting the body; reject replayed or tampered requests in your receiver.

## Data inventory export (connectors)

For DSAR / systems handoff without a live connector, use **Data Map → Export inventory JSON** (`governance.exportDataInventory`). The file lists `dataStores` and `dataFlows` for your org.
