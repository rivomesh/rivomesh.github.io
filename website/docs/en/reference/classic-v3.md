---
kind: docs
locale: en
title: "ActiveMQ Classic"
sourcePath: docs/en/classic-v3.md
---

# ActiveMQ Classic

中文：[Classic 手册](/docs/zh/reference/classic-v3.html).

The implementation uses native OpenWire persistent local transactions, an event
queue and a separately retained receipt queue on one fixed broker. Independent actual-release Java8 native acceptance passed persistent publication,
selected-consumer ACK, invalid-selector/purge refusal, restart and actual old
nonempty-backup protection. MySQL8.4+PostgreSQL17 pipeline acceptance also passed snapshot/CDC, process kill,
broker outage, SQL constraint repair/retry and purge isolation; this does not
establish cluster acceptance.
The fixture broker is Apache ActiveMQ 5.19.12. Java8 requires client5.16.8 (class
version52); current5.18/5.19 clients require Java11. Client JMS/SLF4J/Hawtbuf
packages are isolated from other SDKs. Client5.16 is an inactive line; maintain
its dependency/security lifecycle separately from the current broker. See
[Apache downloads](https://activemq.apache.org/components/classic/download/) and
[archived releases](https://activemq.apache.org/components/classic/documentation/download-archives).

Use [config/classic-v3.yml](/files/config/classic-v3.yml). Product is
`ACTIVEMQ_CLASSIC`, endpoint `activemq://host:61616` (or `activemqs://host:61617`),
explicit `messaging.broker`, `stream` prefix and authenticated HTTP(S)
`messaging.adminUrl` ending `/api/jolokia/`. Credentials are separate from URLs.
`check` connects to OpenWire and reads broker/JMX capabilities without creating
business queues. Wire broker ID/name must match management; persistent,
non-slave KahaDB is required. HTTP redirects and ambiguous JSON/JMX responses
cannot become confirmations. TLS requires a separately verified certificate and
JVM trust configuration; no real TLS acceptance yet.

## Resources and consumer contract

The physical event queue is `<prefix>.<64-character binding hash>`; the receipt
queue appends `.receipts`. Both retain a persistent OWNER record with a random
shared owner nonce, binding and both queue names. Source journal identity binds
the nonce; native progress binds a receipt JMSMessageID and batch content digest.

Consumers MUST use exactly:

```text
rivomesh_record_type = 'EVENT'
```

The application reads channel/key/event-ID properties and the ordinary V3 JSON
bytes envelope. Deduplicate stable event IDs and stage/validate transaction
boundaries, counts and ordinals before business commit. A producer confirmation
is not consumer completion. Acknowledge events only after durable downstream
commit; multiple consumers still need transactional staging/order handling.
Never consume OWNER records or any receipt messages. Queue size includes the
retained owner; it does not equal the number of outstanding event messages.

Before publication, management checks that event subscriptions have the
exact selector and that receipt queues have no subscriptions. External JMS
browsers also count; use JMX browsing for administrative inspection. Broker ACLs
must deny readers access to `.receipts` and deny OpenWire accounts permission to
create missing queues. Bootstrap uses explicitly authorized JMX `addQueue`.
An operator must retain OWNER/receipt records, disable inactive-destination GC,
avoid expiry/discard policies and configure KahaDB `journalDiskSyncStrategy=always`
and `enableJournalDiskSyncs=true`. The current standard MBeans do not prove all
those policy/flush settings at runtime; provision and audit broker configuration.
The isolated fixture illustrates the contract and is not a production secret file.
Management needs read/search and narrowly authorized `addQueue`/`getMessage`;
destructive operations belong to a separately controlled recovery process.

## Confirmation and recovery

One local JMS transaction writes the event batch and a persistent receipt, then
native receipt content is read back. Only then can the fenced source journal
save transport progress and schema/snapshot/transaction confirmation. Lost
responses can replay the same application event IDs; no distributed XA or
exactly-once downstream guarantee is claimed. An older owner's in-flight request
cannot be revoked by journal fencing; shared pause remains explicitly unconfirmed
until quiescence is established.

Resume validates both ownership records and the last saved receipt before any
resource creation/publication. Missing initialized queues, owner changes, missing
or changed receipts require a recovery/rebuild plan. Normal EVENT consumption
retains ownership and receipts. Whole-store rollback can retain old owner IDs;
the later receipt is still required. Arbitrary selective deletion of historical
events is not a complete-history checksum and cannot be repaired by ordinary resume.

Receipt retention/compaction is not implemented. Metadata grows per publication
batch, and native message lookup can scan retained queue history. Capacity/soak,
replication/failover, network connectors, TLS and broader mixed-product pipeline acceptance remain
required; do not extrapolate single-broker transport checks to those profiles.

## FAQ

**Why separate receipts?** Ordinary queue consumers remove events. A durable
receipt must survive consumer acknowledgments to verify a later restart/backup.

**Wrong selector or lost owner?** Stop the consumer, preserve remaining history,
review the gap and repair/rebuild under a plan. Resume retries the failed source
transaction; it never recreates ownership over initialized empty queues.

**Broker outage?** Connection/HTTP transport failures retry from the persisted
checkpoint. Authentication, policy or confirmed-history failures pause this target.
Other target subscriptions keep their independent checkpoints.

**Can I use a failover URI or several independent brokers?** Not in this first
profile. Keep one direct endpoint and management for that same broker; future
replicated/failover profiles need separate identity and store acceptance.

**HTTP403 from a current broker?** Classic5.19.12 also defaults Jetty management
access to loopback IPs. Authorize the synchronization worker's actual management
network using explicit InetAccessHandler include rules, retaining authentication
and Jolokia permissions. HTTP403 is not evidence of a missing queue. Queue
existence uses successful exact-MBean searches because the server may redact
exception types; failed management calls never authorize resource recreation.

**Strict origin checks with a Java8 worker:** Java's URLConnection does not send
a manually supplied Origin header by default. The client sends Referer containing
the management endpoint's own scheme/authority. Allow that exact origin in Jolokia
CORS policy and retain strict checking; no global JVM header override is required.
Jolokia explicitly supports Referer fallback in its [security manual](https://jolokia.org/reference/html/manual/security.html).
Native HTTP200 plus Jolokia status403 remains an access failure, not a queue absence.

The accepted fixture policy allows both `http://classic:8161` and
`http://classic:8161/`: this Jolokia version compares the full Referer value,
including its trailing slash. For another deployment, allow the exact value
`<management-scheme>://<management-authority>/`, retaining strict checking.

## Recorded acceptance

`target/classic-subscription-selector-fixed.log`:2 SDK classification tests and
63 core/API tests passed,0 failures/errors/skips. `target/ui-classic-first.log`:20
DOM passes. `target/classic-native-selector-fixed.log`: actual release/native
Java8 acceptance described above. Release145723459bytes SHA256
1a1945e3f91658e3f666a79af66b5da1d6ec0eb8ea2ff00cd3d9f8242a017115.
Earlier native logs failed and are not acceptance. `target/classic-pipeline-first.log` built successfully but its harness failed
because the Maven Java8 image has no Python; it is not acceptance. The corrected
`target/classic-pipeline-prebuilt.log` passed ONE actual release pipeline case,
with host verification of fresh source/tests and native inspector classes
compiled against that release. Source/MySQL and target/PostgreSQL were real,
with LOCAL H2 journal. Both pre/post SHA256 were
6eb2a8bb053fcf777b765713e5c21aeb675e586f53c79098e5dffb2103afb954,
145723578bytes. Snapshot/current rows were reconstructed from received envelopes
by stable IDs, row identities and completed transactions. The consumer persists
its received batch before ACK. Worker SIGKILL, broker outage/catch-up, PostgreSQL
CHECK failure with Classic continuing, removing the constraint/resuming its
original error generation, and purging the initialized Classic queue with SQL
continuing all passed. Pause reports SQL FENCED and MQ UNCONFIRMED.
Run `bash tests/classic-pipeline-run.sh`; an unchanged verified release can use
`RIVOMESH_TEST_PREBUILT=1`. Python runs on the host for verification, not as a
runtime dependency in the Maven/JRE8 containers. All own resources were cleaned.

Final package: `target/classic-final-unit-package.log`2 SDK +63 core/API passes,0fail/error/skip; UI20 passes. Current145723617-byte release SHA256290adcc746a64c427ccefc6de712b8fbb7bbdc7ed4d48fcd2757485e99b6c2fe. All65091 class files were compared with the accepted pipeline release; only AdapterCatalog.class changed (status text). Runtime protocol resources are byte-identical. See [archived evidence](/docs/zh/evidence/2026-11-15-classic.html).
