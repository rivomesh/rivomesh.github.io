---
kind: docs
locale: en
title: "OIDC sign-in"
sourcePath: docs/en/oidc-login.md
---

# Sign in with your organization

[简体中文](/docs/zh/reference/oidc-login.html)

Rivomesh can sign browser users in through one OpenID Connect (OIDC) provider across Controllers behind a shared HTTPS origin. Each provider identity must be explicitly bound to an existing Rivomesh account. The shared account directory supplies the role, task grants and node grants. Provider claims such as email, username, role and groups carry no Rivomesh authority. Existing browser token sign-in and Bearer API calls remain available.

## Prepare the provider and Controllers

Register a confidential OIDC client for authorization code flow, PKCE S256, token endpoint authentication with `client_secret_basic` and ID tokens signed with `RS256`. Register the exact callback, such as `https://sync.example.gov/auth/oidc/callback`. Use the immutable, case-sensitive `sub` the provider issues to this client. A pairwise subject can differ between OIDC clients for the same person. Authorization and token endpoints must be fixed HTTPS URLs on the configured issuer's origin. Obtain the correct `kid` and RSA public key from your provider through a trusted administrative channel. [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html), [OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)

Start from a working [shared global control deployment](/docs/en/reference/global-control.html). Upgrade all members to a build that understands external bindings before adding them. Apply the same OIDC profile and external origin to all Controllers serving the login URLs. The database account must be able to initialize the shared `rmc_oidc_attempt` table. Agents need no OIDC configuration or provider secret.

```yaml
sessions:
  enabled: true
  secureCookie: true
  publicOrigin: https://sync.example.gov
oidc:
  issuer: https://identity.example.gov/tenant
  authorizationEndpoint: https://identity.example.gov/tenant/authorize
  tokenEndpoint: https://identity.example.gov/tenant/token
  clientId: rivomesh-console
  clientSecret: "${RIVOMESH_OIDC_CLIENT_SECRET}"
  keyId: provider-rsa-2026
  rsaPublicKey: BASE64_DER_SUBJECT_PUBLIC_KEY_INFO
```

`rsaPublicKey` is standard base64 of the DER SubjectPublicKeyInfo for a 2048–4096 bit RSA public key. Remove whitespace and PEM delimiters from the exported public key. The client secret belongs in its Controller service environment. On Linux and Docker supply it with the platform configuration above. For manual Kubernetes mount the platform configuration through ConfigMap and supply `RIVOMESH_OIDC_CLIENT_SECRET` through `secretKeyRef` on the Controller pods. For Helm, apply the existing global-control values, set `sessions.publicOrigin` and set `oidc.enabled=true`. Use the same OIDC keys except `clientSecret`; set `oidc.existingSecret` and `oidc.clientSecretKey` for the Kubernetes Secret instead.

Route `/`, `/auth/oidc/*` and `/api/*` through the same HTTPS frontend. Keep callback query parameters out of proxy access logs. Check that the JVM trusts the provider's TLS certificate chain and that Controller clocks are synchronized. Once configured, the sign-in screen shows **Sign in with your organization**. Bookmarks can use `/auth/oidc/start` on the same hostname.

## Bind or revoke access

Sign in to the console as an administrator and open **Accounts and grants**. On the existing account, choose **Bind organization identity** and enter the case-sensitive subject issued for this client. The form shows the configured issuer, and the preview shows whether a subject was entered. Afterward, the account card shows the issuer and subject digest. Use **Replace organization identity** to supply a new subject or **Revoke organization identity** to remove the binding. Sign in again after a successful change.

Existing bindings can still be inspected and revoked when organization sign-in is disabled on this Controller. Reload the account directory before retrying a revision conflict. If a request result is uncertain and the current session still works, retry with the same fields to reuse its request ID. If the session ended, sign in again and check the account card.

### API

1. Sign in as an existing Rivomesh administrator and create or review the local account and its task and node grants.
2. Get the current directory revision with `GET /api/accounts`.
3. Send `PUT /api/accounts/{accountId}/external-identity` with a fresh `X-Request-ID`, the current revision, exact issuer and subject. Existing browser administrator sessions must send the matching `Origin` and `X-CSRF-Token`. An administrator can also use Bearer API authentication.
4. To remove the external identity, send `DELETE` to the same URL with a fresh `X-Request-ID` and just `expectedRevision`. The local account and its token remain usable unless separately disabled or rotated.

Example binding body:

```json
{
  "expectedRevision": "current-directory-revision",
  "issuer": "https://identity.example.gov/tenant",
  "subject": "subject-issued-to-this-client"
}
```

The account directory exposes the issuer and a SHA-256 digest of the subject to administrators. Each provider identity can be bound to one account. Binding, replacing and revoking follow the shared directory's revision policy and invalidate all existing browser sessions across Controllers. Admin actions are recorded as `ACCOUNT_EXTERNAL_BIND` and `ACCOUNT_EXTERNAL_REVOKE`. The audit trail records the local identity for a successful callback and omits provider codes, tokens and subjects.

## Troubleshooting and lifecycle

- **OIDC_LOGIN_DENIED**. Start again from the Rivomesh login screen. A callback can be used once, within five minutes, and only with the browser that started it. Repeated or invalid callbacks are denied. If a fresh attempt fails, confirm the exact issuer, provider subject, audience, signing key and current local account status.
- **OIDC_PROVIDER_UNAVAILABLE**. Check access from each Controller to the fixed token endpoint and the JVM's TLS trust, then start a new sign-in. A used callback cannot be retried. If the shared control store is unavailable, the response is `CONTROL_STORE_UNAVAILABLE`.
- **ACCOUNT_EXTERNAL_IDENTITY_CONFLICT**. Review the existing binding in the shared directory and explicitly revoke it before reassigning that identity.
- **Provider account disabled or signed out**. Revoke the local binding or disable the Rivomesh account to stop existing Rivomesh sessions immediately. Each OIDC session expires by the earlier of the signed ID token expiry and the configured session limit. Rivomesh logout ends the local session. Provider logout notifications and automatic provider-session checks are outside this profile.
- **Provider changes a signing key**. Coordinate a fixed profile update on all Controller entries and restart them with the replacement `kid` and public key. Pending sign-ins must restart after the profile changes. The profile uses a configured key and endpoints and has no runtime discovery or automatic key rotation. Local token sign-in remains available during the rollout.

The H2-backed HTTPS fixture covers invalid signatures and claims, one-time state and cross-entry revocation. Real Keycloak 26.7.4 also passed with two Controllers sharing PostgreSQL and one trusted HTTPS ingress. Chrome starts on A and completes S256 PKCE on B. A signed provider role leaves the local Viewer, task and node grants in force. Revoking the binding through B invalidates both entries while the provider session is active. [Native verification](/docs/zh/evidence/baseline.html#native-keycloak-login-across-two-controllers) · [Reproduce](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/keycloak-oidc/README.md)
