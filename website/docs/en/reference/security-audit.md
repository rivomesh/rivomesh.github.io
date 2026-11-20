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

## Verify against an independently retained checkpoint

From a trusted administrative export, record the verified audit-store ID, last sequence and SHA-256 chain hash. The checkpoint file contains these four fields including the format version. The command writes a new private file after validating the complete JSONL export.

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit.jsonl \
  --anchor-out /private/rivomesh-head.json
```

Place the checkpoint with a separately controlled audit custodian or in an external archive with retention and access controls. Choose an export cadence that keeps consecutive exported windows overlapping. To verify an export taken after new activity or backup recovery, supply the earlier checkpoint from that independent archive.

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit-later.jsonl \
  --against-anchor /independent/rivomesh-head.json \
  --anchor-out /private/rivomesh-head-later.json
```

`AUDIT_ANCHOR_MATCHED` confirms that the export contains the trusted sequence and hash for the same store. It can match either an exported event or the boundary immediately before the first event. Retain the newer checkpoint separately after a successful verification. The tool reports `AUDIT_ANCHOR_TAIL_ROLLBACK` for an older tail, `AUDIT_ANCHOR_HASH_MISMATCH` for changed history, or `AUDIT_ANCHOR_STORE_CHANGED` for a different store. If retention advances beyond the trusted sequence, `AUDIT_ANCHOR_OUTSIDE_EXPORT_WINDOW` requires an independently retained intermediate export to establish continuity.

### Signed checkpoints

An independent custodian can sign the checkpoint using OpenSSL. The example uses an existing ECDSA P-256 key on the custodian's machine. Verify the initial export's provenance and store identity before signing the first checkpoint. Keep the private key outside Rivomesh and the checkpoint archive. Preserve the original JSON bytes and detached signature as a pair. [OpenSSL signature commands](https://docs.openssl.org/3.0/man1/openssl-dgst/)

```sh
openssl dgst -sha256 -sign /custodian/keys/audit-signing.pem \
  -out /custodian/checkpoints/rivomesh-head.sig /custodian/checkpoints/rivomesh-head.json
```

Configure the PEM public key and expected `storeId` in the verifier's independent trust configuration. Obtain them from the trusted enrollment process. Read the latest trusted checkpoint from custody, then verify a later export using Python 3 and OpenSSL on `PATH`. Replace `your-enrolled-store-id` with the actual enrolled ID.

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit-later.jsonl \
  --against-anchor /independent/rivomesh-head.json \
  --anchor-signature /independent/rivomesh-head.sig \
  --anchor-public-key /trusted/audit-public.pem \
  --anchor-store-id your-enrolled-store-id \
  --anchor-out /private/rivomesh-head-later.json
```

`AUDIT_ANCHOR_SIGNATURE_VERIFIED` confirms signature validation and that the signed checkpoint matched the expected store and verified export. A missing required option, invalid signature, wrong key, changed store, or unavailable verifier fails the command without writing the next checkpoint. Once verification succeeds, the custodian can sign the new checkpoint separately. The signed checkpoint establishes the history hash at its sequence. A later portion of the export gains an independently authenticated hash when the custodian signs a newer checkpoint.

### Retain signed checkpoints in S3 Object Lock

Run `tools/audit-retain-s3.py` from the custodian's scheduled job after signing the verified export head. The job needs Python 3, OpenSSL, and AWS CLI v2 that supports `put-object --if-none-match` and `head-object --checksum-mode`. Configure the enrolled AWS Region, bucket name, 12-digit bucket owner account, audit `storeId`, and PEM verification key independently of the export. Use a general-purpose AWS S3 bucket with Object Lock enabled and an IAM workload identity. The tool ignores configured custom endpoints. [AWS S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)

Scope the job identity to its archive prefix with `s3:PutObject`, `s3:PutObjectRetention`, `s3:GetObject`, `s3:GetObjectVersion`, and `s3:GetObjectRetention`. With SSE-KMS, authorize the job's required KMS operations separately. Apply a bucket policy that requires `If-None-Match` on archive writes. Restrict deletion, governance bypass, and bucket administration to identities outside the scheduled job. Keep the signing key and AWS credentials outside job arguments, the checkpoint, and the receipt. [Conditional-write bucket policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes-enforce.html)

```sh
python3 tools/audit-retain-s3.py \
  --export /private/rivomesh-audit-later.jsonl \
  --checkpoint /custodian/checkpoints/rivomesh-head-later.json \
  --signature /custodian/checkpoints/rivomesh-head-later.sig \
  --public-key /trusted/audit-public.pem --store-id your-enrolled-store-id \
  --region us-east-1 --bucket your-enrolled-audit-bucket --bucket-owner 123456789012 \
  --prefix rivomesh/audit --retain-until 2030-01-01T00:00:00Z
```

Choose a future UTC retention deadline for each cut and retain that choice with the original signed files for retries. A Linux timer or Kubernetes CronJob can invoke the command for each signed export. The tool checks the export, detached signature, store identity, and exact export head before writing. It uploads one object per store and sequence, with `COMPLIANCE` retention and a SHA-256 checksum. After a write or a lost response, it confirms the exact S3 version's checksum, lock mode, and retention deadline before printing an `AUDIT_CHECKPOINT_RETAINED` JSON receipt. Store the receipt's object key and `versionId` with the independent archive catalog and alert on a nonzero exit. Retries accept the identical retained pair and sufficient retention. A conflicting body or unverifiable version needs review. [S3 conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html) [S3 version metadata](https://docs.aws.amazon.com/cli/latest/reference/s3api/head-object.html)

For recovery, set `RIVOMESH_ARCHIVE_KEY` and `RIVOMESH_ARCHIVE_VERSION` to the receipt's `key` and `versionId` and retrieve that version.

```sh
umask 077
aws s3api get-object --region us-east-1 --bucket your-enrolled-audit-bucket \
  --expected-bucket-owner 123456789012 --key "$RIVOMESH_ARCHIVE_KEY" \
  --version-id "$RIVOMESH_ARCHIVE_VERSION" --checksum-mode ENABLED /private/retained-audit.json
```

The versioned object is a JSON envelope with `formatVersion`, `checkpoint`, and `signature`. Decode the two Base64 fields to recover the original JSON and detached signature, then use signed-checkpoint verification above.

### Retain complete audit event windows

Add `--retain-events` to the same retention command to archive the original JSONL export with its signed final checkpoint in one `COMPLIANCE` object version. Keep the receipt in the independent archive catalog. It records the exclusive starting sequence, the final sequence, the event count, SHA-256 and the exact S3 version ID. Schedule exports before local pruning removes events beyond the last accepted cut.

For the first archive, the export must include the initial audit boundary at sequence zero. For later cuts, add `--previous-checkpoint /custodian/checkpoints/previous.json --previous-signature /custodian/checkpoints/previous.sig`, using the signed head from the last independently accepted full archive. The prior sequence must appear as an event or as the boundary just before the first event. If the export starts after that point, the tool returns `AUDIT_ANCHOR_OUTSIDE_EXPORT_WINDOW` before uploading. Recover an intermediate archived window or an earlier database copy to prove the missing interval. For retries, reuse the exact export and signing artifacts.

The first line of the retained object contains the signed checkpoint pair. The remaining bytes are the original JSONL export, including the first boundary and completion marker. Each command spools a private local copy before verifying it and uses bounded memory. The single S3 PUT accepts up to 5 GB per archive and allows ten minutes for the upload. Provision temporary space for the entire object, and choose an export cadence that fits the available disk, uplink and local audit retention. [S3 single-upload integrity](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html)

Recover the cataloged object version with the same `get-object` command above, saving it as `/private/retained-events.jsonl`. Use the independently configured key and store ID for offline verification. Supply the preceding checkpoint and signature for a rolling window.

```sh
python3 tools/audit-retain-s3.py --verify-event-archive /private/retained-events.jsonl \
  --public-key /trusted/audit-public.pem --store-id your-enrolled-store-id
```

Compare the printed `checksumSHA256`, `fromExclusive`, `sequence` and `checkpointHash` with the independent receipt. `AUDIT_EVENT_ARCHIVE_VERIFIED` confirms that the embedded signed head and each event chain link are valid. MinIO acceptance verifies exact version recovery, retention, retry, continuity and tamper detection. Validate the enrolled AWS identity and bucket policies in the deployment.

## API

- `GET /api/audit?after=0&through=0&limit=100`: ADMIN pages, events/next/storeId and integrity boundaries.
- `GET /api/audit/export?...`: same range/permissions with JSON attachment headers; the streaming tool continues through this endpoint.

Only those three nonnegative integer query parameters are accepted; limit is 1–1000. Reads/exports themselves are audited.

## Security and acceptance boundaries

The local chain and registry detect ordinary corruption, missing rows and replacement by an empty store. Offline comparison relies on independent custody of the latest trusted checkpoint. A signature authenticates checkpoint bytes and can remain valid on an older checkpoint. Keep the latest accepted sequence and enforce archive retention independently. S3 protects each confirmed `COMPLIANCE` object version until its recorded deadline. Storage policy and custody of the latest trusted sequence remain the operator's responsibility. See the [authorization handbook](/docs/en/reference/task-authorization.html) for task grants and [verification](/docs/zh/evidence/baseline.html) for tested profiles.

Local account changes record ACCOUNT_COMMITTED with subjectId and directory version; the UI shows the affected task/account. Directory mutation and audit outbox are saved together, with a separate durable version anchor unaffected by event retention. Legacy export payload/hash bytes are preserved; see [accounts](/docs/en/reference/account-management.html).
