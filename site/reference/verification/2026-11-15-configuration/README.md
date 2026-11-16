---
sourcePath: docs/verification/2026-11-15-configuration/README.md
---

# Configuration editing acceptance / 配置编辑验收

2026-11-15. Final release: `rivomesh-app-0.1.0-SNAPSHOT.jar`, 145744770 bytes,
SHA-256 `8c9fc8fb41356fd4bb5ca4bad0e3a52967193ca8ce9f8876e27008bc10bba281`.

- `unit.log`: 2 Classic SDK +86 application unit/API tests, no failures/errors/skips; full reactor package successful.
- `ui.log`: 25 DOM interaction tests passed. These do not establish visual/accessibility acceptance in a real browser.
- `native.log`: freshly compiled external fixture uses only the exact final release. Real Java8 controller/HTTP/worker JVMs, MySQL8.4 and PostgreSQL17.12: initial snapshot, stopped target-password rotation (old credentials fail CHECK), opaque references/idempotent update, continued CDC, reviewed historical restore, controller restart with canonical/worker projections removed, original stream and snapshot identities retained. Isolated Compose resources cleaned.
- `artifact.log`: release bytecode/resource/service-provider verification.
- `index.json`: SHA-256 of each unmodified archived log.

本记录证明配置编辑及恢复在上述配置下可保持同步断点。它不证明全部产品版本、全部源账号DDL、所有JDK/HA组合、真实浏览器外观或完整安全审计。历史版本含旧凭据，需保护整个私有数据目录；配置恢复不回退数据库断点。

No source account ALTER USER acceptance: this case rotates the PostgreSQL target role.
Historical credentials remain in private revision files. Immutable configuration provenance
is separate from global security auditing, per-task authorization and migrations.
