---
kind: docs
locale: en
title: "Security audit"
sourcePath: docs/en/security-audit.md
---

# Security audit, retention and export

中文：[安全审计](/docs/zh/reference/security-audit.html). This records management API/controller events separately from the 40-operation task history and configuration revisions.

## Scope and permissions

Only ADMIN can read/export or open **Security audit**. VIEWER/OPERATOR attempts are denied and audited. API requests record `HTTP_BEGIN`/`HTTP_END`: authenticated actor/role, fixed route category, known task ID, direct peer IP, HTTP status and safe error code. Authentication failures have no actor and status 401; authorization/Origin denials record 403. Health probes/static files are excluded. Raw URLs/queries, Authorization, bodies, credentials, rows and exception text are excluded. Client request IDs are SHA-256 hashes for correlation, not raw arbitrary headers. Forwarded IP headers are not trusted.

`HTTP_END` means response prepared, not delivered. A 202 is not successful execution. `OPERATION_COMMITTED` records durable PENDING and SUCCEEDED/FAILED outcomes, actor and operation-request hash; configuration edit/restore outcomes are included. Startup/orderly shutdown have separate events. Internal calls without HTTP attribution and older history are not assigned invented identities. CLI replication, business SQL and OS activity are outside this controller audit.

## Durability and failures

`dataDirectory/audit/events.mv.db` uses H2 transactions, synchronous writes, contiguous sequences and a SHA-256 chain. The private audit directory is 0700 and database 0600 where POSIX permissions exist; protect other platforms with ACLs. Startup verifies the retained chain/tail. The controller registry binds the audit store identity: deleting/replacing it with a new empty database refuses startup. Stop the controller and coherently back up registry, audit, configuration revisions and journals; copying a live H2 file is not a consistent backup.

An API begin event must persist before the request executes. Failure returns 503 `AUDIT_UNAVAILABLE`, preventing that HTTP management action. Already accepted asynchronous results commit an outbox entry with controller state, then append the event. A crash between append and outbox removal replays by event ID without duplication. If completion was committed but audit/outbox cleanup failed, the operation may have happened: inspect/replay its original request ID and revision, rather than blindly submitting a new request. A BEGIN without an END means the result needs investigation.

Audit failures do not terminate independent replication workers. Management requests are blocked while process probes can remain healthy. Repair private volume capacity/permissions; restore coherent backups for chain corruption or identity mismatch. Never erase audit files to bypass verification.

## Retention

`auditMaxEvents` defaults to 1000000, range 1000–10000000. Set it in Linux/Docker platform YAML, Helm `--set platform.auditMaxEvents=2000000`, or the native ConfigMap, followed by a controlled restart. The UI/API expose the limit and pruning anchor. Each new-event transaction prunes the old prefix while retaining `anchorSequence/anchorHash`; the remaining history never pretends to start at zero. This count is not a physical disk byte quota: monitor H2/backup storage. Status polling also generates events; choose retention from measured request volume.

Pages use fixed `after/through` bounds, oldest first, 100 by default, maximum 1000. `after=0` selects the current retained beginning; `through=0` fixes the current head. Continue with `next` and the same `through`. A cursor overtaken by retention receives 409 `AUDIT_HISTORY_EXPIRED`, never silent data omission; invalid rollback/range changes receive409 `AUDIT_HISTORY_CHANGED`.

## Console and exports

ADMIN opens **Security audit**, reviews sequence/time/identity/route/task/result and uses **Next page**. **Refresh retained window** starts a new window. **Export this page** downloads only the current 100 events and proofs, not all history; changed boundaries prevent download. Close/sign-out clears records and fences late responses.

For a full streaming export, use a management machine with Python 3 and an environment-supplied ADMIN token:

```bash
export RIVOMESH_TOKEN='provide the ADMIN token through a secure channel'
python3 tools/audit-export.py --url http://127.0.0.1:8080 --output /private/rivomesh-audit.jsonl
python3 tools/audit-export.py --verify /private/rivomesh-audit.jsonl
# Verify one JSON page downloaded by the console:
python3 tools/audit-export.py --verify-page /private/rivomesh-audit-page.json
```

The full exporter fixes one tail, verifies sequence/chain/store identity/tail hash page by page, streams to a 0600 file, writes COMPLETE, then publishes the final filename. Memory is bounded by page size. Existing outputs are never overwritten and HTTP redirects are refused. Failures/expired retention leave `.partial`, without a successful final file; export to a new path. Events generated during export lie beyond its fixed tail. Successful single-page verification with non-null `continuation` proves that page, not full-history completeness.

## API

- `GET /api/audit?after=0&through=0&limit=100`: ADMIN pages, events/next/storeId and integrity boundaries.
- `GET /api/audit/export?...`: same range/permissions with JSON attachment headers; the streaming tool continues through this endpoint.

Only those three nonnegative integer query parameters are accepted; limit is 1–1000. Reads/exports themselves are audited.

## Security and acceptance boundaries

The local chain/registry detects ordinary corruption, missing rows and new empty-store replacement. It cannot resist an administrator rewriting all files/recomputing the chain or coherently rolling back every backup. External immutable/signature anchors, cross-controller aggregation, account management and its audit remain required work; exact task grants are documented in the [authorization handbook](/docs/en/reference/task-authorization.html). Keep exported tails/hashes in independent controlled custody. This is not an external immutable compliance audit service. See [validation](/docs/en/reference/validation.html) for tested profiles.

Local account changes record ACCOUNT_COMMITTED with subjectId and directory version; the UI shows the affected task/account. Directory mutation and audit outbox are saved together, with a separate durable version anchor unaffected by event retention. Legacy export payload/hash bytes are preserved; see [accounts](/docs/en/reference/account-management.html). External immutable anchoring remains pending.
