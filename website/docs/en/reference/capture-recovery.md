---
kind: docs
locale: en
title: "Source capture recovery"
sourcePath: docs/en/capture-recovery.md
---

# Capture recovery

[中文](/docs/zh/reference/capture-recovery.html)

When a V3 task enters `ERROR` during source connection, reading, decoding, snapshot, discovery, DDL or normalization, an administrator can open **Review capture recovery** in the failure card. In a fixed-Agent deployment either controller routes the read to the owning Agent. The report lists potentially affected subscriptions, the original checkpoint hash, source admission and the recovery steps.

```sh
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml
```

The review checks the pipeline identity, original position and snapshot dependencies. It performs admission reads against the source. Refresh and repeat the review if the task generation, checkpoint or configuration changes during the check.

| Observation | Recovery step |
|---|---|
| `SOURCE_LOG_GAP` | Preserve the GTID and any retained binlogs. Restore the missing logs or have the database operator restore an eligible primary with complete history. Retry the original checkpoint after review. |
| `POSTGRESQL_REQUIRED_WAL_UNAVAILABLE` | Preserve the original slot, required WAL, journal and LSN evidence. Evaluate whether the original slot and WAL can be recovered. Review a new baseline and the affected destinations when recovery is unavailable. |
| `SOURCE_CHECKPOINT_AVAILABLE` after decode, DDL or snapshot failure | Preserve the original event, resolve the decoder, schema or read permissions, then retry. Admission confirms the original source position meets the recovery checks. |
| `UNPROVEN_SOURCE_RANGE` | Verify transaction boundaries and contents against the original logs and checkpoint. Include every subscription in the potential impact. |

For a MySQL DDL failure, the report can compare the latest recorded schema with the current catalog. It lists bounded changed-table details, visible column changes, identity-key changes and definition hashes. The source catalog may already include later DDL. Resolve the required schema changes before retrying, and preserve the original binlog position.

### FAQ

**Why does the destination have data while capture remains paused?** The destination may retain data delivered before the failure. Check the source checkpoint and each subscription acknowledgment to establish its progress.

**When can I skip a transaction?** Use the [transaction skip](/docs/en/reference/transaction-skip.html) workflow when a complete destination transaction is available for review, the target state is established and the approval requirements are met. For a source-side exclusion, follow the MySQL log verification and administrator approval procedure on this page.

### Native MySQL transaction headers

For a supported `SOURCE_DECODE` fault, the review can show the first transaction after the durable checkpoint. It reads up to 256 native event headers from the same server and binlog file, requires continuous offsets through `Xid`, and lists the GTID, file coordinates and affected tables. The `nextTransactionHeaders` field uses `BINLOG_HEADERS_ONLY` as its scope. Retain the original binary log for row-content review and approvals. Rotation, a gap, a backend change, unfamiliar events or an incomplete boundary can leave the header evidence absent. Read permissions follow the existing MySQL replication account. [MySQL binary log event reference](https://dev.mysql.com/doc/refman/8.4/en/show-binlog-events.html) · [Native evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#mysql-decode-header-review)

Verify the complete transaction byte range once the capture lease has cleared. The supported initial profile covers one CRC32 binlog row transaction up to 4 MiB. The verification reads the retained source range over the replication connection, checks every event checksum and matches the GTID and file offsets through commit. The CLI prints the digest and metadata.

```sh
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml --verify-contents
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml \
  --retain-contents /var/lib/rivomesh/source-evidence
```

For retention, create the operator-owned directory with `0700` on a filesystem supporting hard links. Each `0600` archive contains the context, checkpoint hash and exact binary frames. Retrying the same retained evidence reuses its SHA-addressed file. Include the directory in your protected evidence retention and backup policy because the binary frames contain row values. Both commands preserve the original journal checkpoint. [Native evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#retained-mysql-binlog-contents)

### Retain from a management entry

An administrator can select **Retain original transaction** after reviewing the native boundary. In a separated cluster the durable command goes to the Agent that owns the task. The command binds the reviewed boundary hash, configuration revision and capture error generation. Inspect the command receipt for the archive file and SHA-256. The binary event contents stay in the Agent's private `capture-evidence/<taskId>` directory, with a 256 MiB per-task archive budget. The original capture position and error remain unchanged. A retry with the same request observes the same receipt across management entries.

For API clients use `POST /api/tasks/{id}/actions` with an `X-Request-ID` and the reviewed values.

```json
{
  "action": "CAPTURE_RETAIN",
  "expectedRevision": "<task revision>",
  "errorCount": 4,
  "boundaryHash": "<nextTransactionHeaders.boundaryHash>"
}
```

New archives retained through global task control also have a private authentication receipt. The original Agent signs the exact archive filename, byte count and SHA-256, together with the owner directory, task, configuration fingerprint, journal generation, checkpoint, error generation and reviewed boundary. The Agent creates this receipt before publishing the raw file. If interrupted between the two writes, retry recovers only when the original binlog can be read again and the bytes match. Back up the receipt and its Agent-local key alongside the raw archive under the same private access controls. Archives written before this change can still be reviewed through their existing recovery paths. An Agent can verify an archive with this receipt through [the handoff custody probe](/docs/en/reference/global-control.html). It grants no transfer or recovery authorization.

Native acceptance uses a full-image MySQL 8.4.13 commit that exceeds the configured row limit. The original Agent retains the native bytes, then replays the same GTID after an approved increase to the row limit. Both SQL destinations match the source, and the journal generation, fingerprint and snapshot IDs stay the same. After the task drains, the candidate verifies the separately mounted raw archive. The custody probe reports the original task owner and returns `executionAuthorized: false`.

After both Agents verify the same raw archive, open the handoff preparation and select **Stage reports and receipts**. The Controller verifies the preparation and sends the bound candidate the exact archive descriptor. The candidate stores the raw ZIP and its sealed binding in private `handoff-raw-staging` storage. The response adds `rawCapture` and the console shows the verified archive count. Retry the same staging request from either Controller to reverify the sealed copy after a shared mount outage. The original Agent keeps its HMAC key. Publishing this inactive archive leaves the source checkpoint and task owner at the reviewed cut.

A prepared PostgreSQL-managed writer handoff can publish this exact staged ZIP to the committed candidate's private `handoff-adopted` history while its Worker is stopped. Both Controllers serve `GET /api/tasks/{taskId}/handoff/raw-history` with the archive digest, size, capture count and the adoption digest. The administrator needs access to the task and both Agents. The endpoint verifies the private copy and remains available after a candidate restart, even if the shared mount is gone. The original Agent retains the archive, receipts and HMAC key. The adopted archive provides historical inspection. Transaction skip, target writes, and Worker start require their own authorization. If the task also retains signed failure records, the same preparation stages both kinds of history. The two history endpoints return one adoption digest after commitment. [Failure history handoff](/docs/en/reference/failure-evidence.html#preserve-history-during-an-agent-handoff)

### Approve a source transaction skip

After retention succeeds, select **Review source transaction skip** from the operation receipt. Check the single GTID, affected tables and all affected destinations. Enter a reason and confirm the impact. The task stays paused after the skip.

This profile requires a same-file, committed row transaction with the original checksummed binlog bytes retained. Mapped affected tables require a completed InnoDB snapshot with a primary key. Affected destinations use transactional SQL. Keyless tables, unsupported target protocols, incomplete snapshots or a native boundary that can no longer be verified require recovery of the original source or a reviewed rebuild. If MySQL purged required logs, retain the archive and recover the logs or choose an eligible source with the required history.

On success the journal records the exclusion and adds exactly that GTID to the capture position. Destination acknowledgments remain at their previous positions. After **Resume**, later transactions can be delivered, while each affected destination's contiguous applied position stops at the source gap. **View source gaps** shows the durable receipt after Agent restart. Reconcile the affected tables and verify a common cut before business takeover. The original exclusion remains in history.

API clients send `CAPTURE_EXCLUDE` to the same actions endpoint with an `X-Request-ID`, `expectedRevision` and the plan's `errorCount`. Include `captureExclusion` with `boundaryHash`, `archiveSha256`, `planHash`, `reason` and `acceptDataLoss: true`. Administrators can list receipts through `GET /api/tasks/{id}/capture-exclusions?limit=20`. Pass the returned `nextCursor` as `after` to read the next page.
