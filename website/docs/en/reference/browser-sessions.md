---
kind: docs
locale: en
title: "Browser sessions"
sourcePath: docs/en/browser-sessions.md
---

# Browser sessions and login recovery

中文：[浏览器会话](/docs/zh/reference/browser-sessions.html).

## Sign-in and recovery

Sign in with an existing configured or managed-account token. The page exchanges Bearer credentials once through `POST /api/session`, clears the input, then authenticates with an HttpOnly cookie. Long-lived tokens are never saved in localStorage, sessionStorage or URLs. Reloading or opening the same site first calls `GET /api/session` to restore identity, grants and CSRF credentials, then loads tasks. Invalid sessions return to sign-in. Language preference may still use localStorage.

Standalone uses a bounded in-memory session store and requires sign-in after restart. Multiple Controllers can keep sessions with the configured [shared access store](/docs/en/reference/shared-access.html).

Sign-out clears UI permissions, drafts and raw differences immediately, then revokes the server session. BroadcastChannel tells other tabs to sign out; without it, their next request/poll discovers revocation. Sign-in and sign-out are serialized within each page so a delayed login response is also revoked. Late API responses cannot revive cleared UI state. If refresh discovers a different cookie session, it clears the previous identity drafts/details before restoring current grants. Failed server sign-out is reported and can be retried; clearing the page alone is not proof of revocation.

## Configuration

`PlatformConfig.sessions` and the Helm top-level `sessions` have the same fields:

| Field | Default | Meaning |
|---|---|---|
| enabled | true | Permit browser-session exchange; disabling it preserves Bearer APIs |
| secureCookie | true | Production `__Host-rivomesh-session` cookie; requires HTTPS, HttpOnly, SameSite=Strict, Path=/ and no Domain |
| publicOrigin | unset | Exact external origin behind a proxy, e.g. `https://sync.example.com`, with no trailing slash, path, query or user info |
| idleSeconds | 1800 | Idle deadline after the last validated API request, including automatic polling; 30–86400 seconds |
| absoluteSeconds | 28800 | Hard lifetime since sign-in, at least idleSeconds and at most 604800; polling cannot extend it |
| rememberBrowser | false | Default session cookie; true adds Max-Age bounded by the absolute lifetime, but restart still invalidates it |
| maximum | 1000 | Active sessions per controller, 1–10000; expired entries are purged on creation and capacity rejects new sign-ins |

These are adjustable policies, not throughput claims. Polling extends server idle time; a human-inactivity timeout is a separate future policy. Browser session-restore features may retain session cookies, so closing the browser does not replace sign-out.

Production proxy configuration:

```yaml
sessions:
  secureCookie: true
  publicOrigin: https://sync.example.com
  idleSeconds: 1800
  absoluteSeconds: 28800
  rememberBrowser: false
  maximum: 1000
```

Terminate TLS at the proxy; the controller remains HTTP. Restrict backend access to authorized networks and provide HTTPS to browsers. `publicOrigin` declares the external origin; client-supplied X-Forwarded-* headers are not trusted. Without it, origin validation expects `https://Host`. Cookie-authenticated mutations require an exact Origin and matching `X-CSRF-Token`.

The HTTP development preview at `http://127.0.0.1:18088` and local examples explicitly set `secureCookie: false`, using `rivomesh-dev-session`. Use the HTTPS settings above in production. Helm defaults to Secure; local port-forward preview can explicitly use `--set sessions.secureCookie=false`. Production can set `--set sessions.publicOrigin=https://sync.example.com`. Edit the same ConfigMap fields for native Kubernetes manifests.

## API and revocation contract

| Request | Authentication/result |
|---|---|
| POST /api/session | Valid Bearer only; returns identity, CSRF credential and absolute expiry, and issues Set-Cookie; browser Origin must match configuration |
| GET /api/session | Cookie returns identity, scope, csrfToken and expiresAt; Bearer retains its previous identity view and does not issue a cookie |
| POST /api/session/logout | Cookie + Origin + X-CSRF-Token; revokes the session and clears the cookie; available to all roles |
| Other APIs | Cookie mutations validate Origin/CSRF, then retain role, task-scope, revision, request-ID and audit checks |

An explicit Authorization header always uses Bearer validation and never falls back to a cookie. Valid credentials for different accounts return 409 `AUTHENTICATION_CONFLICT`. Same-account explicit Bearer uses API rules without cookie CSRF. CLI/API clients need not adopt cookies. Session IDs and CSRF credentials never enter audit records; identity and operation outcomes do.

The current strict directory-revision policy invalidates **all existing browser sessions on that controller after any managed-account creation, modification, enable/disable, deletion, token rotation or managed activation**. This includes the administrator making the change, who must sign in again. After a confirmed self-token rotation, the page can exchange the newly saved token for a fresh session automatically. Bearer credentials are still checked against the current directory on each request. Config-mode identity changes require restart, which clears sessions. Sign-out does not undo already executed task operations; inspect their operation records.

## FAQ and recovery

- **Sign-in appears after reload:** check absolute expiry, controller restart, directory changes, cookie policy and origin. Requests switching between controllers are not yet supported.
- **HTTP sign-in does not persist:** Secure cookies are not sent over HTTP. Explicitly disable Secure only for local development; configure HTTPS in production. Different hostnames/protocols do not share the session.
- **Independent deployments on different ports sign each other out:** cookies are not isolated by port. Use different hostnames to avoid overwriting same-name cookies. The application uses root paths and does not support multiple controllers under different URL subpaths on one site.
- **403 ORIGIN_REJECTED:** align the browser URL, publicOrigin, TLS and proxy configuration; preserve Origin/CSRF checks.
- **403 CSRF_REJECTED:** reload to recover the current CSRF credential. Credentials from old pages/sessions cannot be reused.
- **Account edits sign everyone out:** this is the current strict revision policy. Sign in again; disabled or rotated old tokens remain invalid.
- **409 SESSION_CAPACITY_REACHED:** closing a page does not revoke its session. Sign out unused sessions, wait for expiry, or increase maximum within the memory budget. Restart clears all sessions but is not routine capacity management.
- **Sign-out was not confirmed:** restore connectivity/audit availability and retry sign-out. Another administrator can disable the account or rotate its token to trigger revision revocation. An API failure is not success.

Acceptance covers single-controller real HTTP, a TLS proxy, expiry/revocation, Bearer conflicts and DOM races. Full-browser/accessibility and multi-controller acceptance remain separate. Consult this iteration's archived evidence for actual results.
