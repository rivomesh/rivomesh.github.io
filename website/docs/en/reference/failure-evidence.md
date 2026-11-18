---
kind: docs
locale: en
title: "Failed transaction evidence"
sourcePath: docs/en/failure-evidence.md
---

# Failed-transaction evidence storage

[中文](/docs/zh/reference/failure-evidence.html) · [Contract](/docs/en/sdd/design-failure-evidence.html) · [Recovery](/docs/en/reference/failed-transactions.html)

Storage/capture now backs [managed review](/docs/en/reference/failure-review.html),including administrator/task authorization,audit and protocol5 gates. This page explains files/limits. Successful retention does not prove destination non-commit or authorize skip,compensation or takeover. Earlier internal acceptance is distinct from the [current managed profile](/docs/zh/evidence/baseline.html).

## Contents and identity

Immutable evidence binds review/request IDs,actor/time,task,original execution node/directory,configuration revision,stream generation/epoch,error generation,ACK and whole-transaction hashes. It retains raw/existing normalized transactions and their referenced historical schemas. Missing normalization remains explicit;review does not normalize or change keyless identities.

Schema lookup uses only referenced`tableId/schemaVersion`pairs,not the full catalog. Missing,corrupt or mismatched schemas refuse capture. Published evidence remains readable after journal collection. It records a historical observation;execution still requires fresh configuration,position,native receipt and drift checks.

`FailureEvidenceCapture.capture`first checks an existing review ID against request,actor,revision,destination and error generation,returning the original result without requiring retained journal history. Changed content,identity or request parameters cannot overwrite the original.

## Private files and quotas

- Defaults:256MiB directory budget,1000records,8MiB per record,configured through internal`FailureEvidenceStore.Limits`. Files,keys,authority and orphan temporaries count toward the budget;this is not total disk-block/database/backup capacity.
- Directories use0700;created records,keys,authority and lock files use0600. Reject symlinks including parent paths. Preserve private permissions in installation and backups.
- A random32-byte`evidence.key`authenticates records;`authority.json`binds original task/node/directory. Content hashes and strict JSON parsing refuse truncation,duplicate fields and trailing JSON.
- Cross-process locking,private temporaries,file fsync,atomic publication and directory fsync protect publication/quotas. Busy locks refuse explicitly;callers retry the original request.
- Full quotas refuse new evidence without deleting old records. Automatic expiry/GC/key rotation is not exposed. Orphan`.pending`files are not valid evidence,remain counted and are not silently deleted. Physical disk/power-loss acceptance remains open;unit tests do not establish it.

## Summaries and pages

Summaries expose identity,phase,positions,hashes and event counts without row images or SQL. Raw/normalized events paginate separately,at most100events/256KiB per page. A single oversized event refuses rather than returning truncated images. Every page carries the immutable evidence hash and next index.

Journal inspection still limits combined raw/normalized content to4MiB and historical schemas to2MiB. Streaming large-transaction review remains open. File/page limits do not bypass capture limits.

## FAQ

**Can a lost key be regenerated?** No. Existing authority/evidence without the key refuses initialization;wrong keys fail signatures. Restore key,authority,evidence and original directory identity together,including private permissions.

**Can files be copied to another Agent for automatic takeover?** No. Changed owner/directory identity refuses. Explicit migration,authorization and checkpoint handoff remain open.

**Does retention freeze destination commit status?** No. Capture does not connect to or activate business destinations and never assumes non-commit. Manual native-checkpoint reconciliation remains RC-05.

**Is the file a skip plan?** No. Native receipts,fresh state checks,approval,gaps and idempotent recovery are still required. Manual skip/independent corrective entry are not exposed.
