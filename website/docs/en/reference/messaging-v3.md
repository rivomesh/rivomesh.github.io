---
kind: docs
locale: en
title: "Messaging targets"
sourcePath: docs/en/messaging-v3.md
---

# Messaging targets: configuration, consumption and recovery

中文：[消息目标](/docs/zh/reference/messaging-v3.html). Example: [messaging-v3.yml](/files/config/messaging-v3.yml). Source/journal operations: [V3 manual](/docs/en/reference/pipeline-v3.html).

## Implemented scope

Each supported V3 message destination has its own delivery thread, publication and snapshot checkpoint, and error generation. The current profiles cover Kafka, Pulsar, RabbitMQ, RocketMQ, ActiveMQ Classic, Artemis, Redis Streams and NATS JetStream. They can run alongside SQL destinations. A stalled destination leaves other delivery threads running. All subscriptions govern journal retention.

The contract is **confirmed at-least-once publication**. The broker and journal database do not share a transaction. Lost confirmations, or a crash between confirmation and receipt persistence, can cause duplicates. Retries retain event IDs and content; consumers must deduplicate durably. A publisher checkpoint means broker confirmation, not completion of downstream business processing or readiness for cutover.

## Configuration and UI

Choose a message product in the V3 wizard, map each source database to a message namespace and add other SQL/message destinations. The UI provides topic/stream, Kafka security/SASL mechanism, Pulsar admin/cluster, RocketMQ prefix/cluster/broker/retention, token, replica count and size limit, masks credentials, and saves a stopped configuration. Import YAML for multiple endpoints or advanced deployment settings. Namespaces start with a letter and contain only letters, digits and underscores, up to 63 characters.

`url` and `messaging.endpoints` reject embedded credentials and query parameters. Use separate username/password fields or `messaging.token` for NATS. Passwords/tokens support `${ENV_NAME}` references and are excluded from events/status. Check opens connections and reads capabilities; it creates no business queues, streams or replication connection. Artemis uses a temporary non-durable management reply channel. Destination cards expose only product, mapping, consistency and consumer topic/stream names; connection URLs and credentials are excluded. A broker confirmation and the downstream consumer's business checkpoint are distinct.

| Setting | Meaning |
|---|---|
| `autoCreate` | Create resources before first publication. False requires pre-provisioning. Previously initialized missing resources are never recreated automatically |
| `replicas` | JetStream/Kafka replicas, Redis total copies (primary included), or the initial quorum queue member count; does not provision broker nodes |
| `maxMessageBytes` | Complete UTF-8 JSON envelope limit, default 1 MiB; broker limits also apply |
| `connectTimeoutMillis` / `requestTimeoutMillis` | Connection and confirmation/management timeout, 100–120000 ms |
| `endpoints` | Additional entrances to the same broker cluster, never independent replacement clusters |
| Kafka `topic` | Dedicated topic for this subscription; all mapped databases/tables share it |
| Kafka `securityProtocol` / `saslMechanism` | PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL; SASL supports PLAIN and SCRAM-SHA-256/512 |

For Rabbit's default `/` vhost use `amqp://host:5672` or `amqp://host:5672/%2f`. `amqp://host:5672/` selects an empty vhost name under the AMQP URI specification. Additional nodes must use the same scheme/vhost. `amqps://` and NATS `tls://` use JVM trust configuration. Username/password or token authentication is implemented; NKey/JWT files, certificate wizard and a complete TLS acceptance matrix remain pending.

## Resources and confirmation

Each namespace uses `namespace.__schema`, `namespace.__transactions` and `namespace.table`. Names containing routing syntax, excessive length, or a `__`/`_rm_` prefix use `_rm_` followed by SHA-256(table ID) for the table channel. The envelope/schema retain the original database/table names. Control channels are reserved.

Kafka writes all logical channels into `messaging.topic`, retaining the channel in the `rivomesh_channel` header. A dedicated single-partition topic is required, with acks=all, enable.idempotence=true and max.in.flight=1. This is not a native transactional Kafka producer; the same at-least-once contract applies. Replicas match configuration, min.insync.replicas is `replicas/2+1`, unclean election is disabled, retention.ms/bytes are -1 and cleanup.policy is delete. Plan consumer archival/retention; compaction must not silently evict history. Partition growth or policy changes require a plan. One partition has hardware throughput limits.

Every broker must disable `auto.create.topics.enable`; explicit first-time Admin creation remains available. Otherwise producer metadata refresh could recreate a deleted empty topic and conceal lost history. Preparation checks every broker and requires the relevant DescribeConfigs permission. Topics need Describe/DescribeConfigs/Write and initially Create. Existing replica/ISR/size/retention mismatches block rather than being overwritten. The stable Kafka clusterId is bound in the journal; reconnecting to another cluster raises `BROKER_IDENTITY_CHANGED`.

For replication factor 3, check the data partition's ISR separately from the KRaft controller quorum. The Rivomesh topic requires a minimum ISR of 2 and `acks=all`. Two of three controllers can still commit metadata while a particular topic has only one in-sync data replica. Use `kafka-topics.sh --bootstrap-server <broker>:9092 --describe --topic <topic>` to see the partition Leader and ISR, and `kafka-metadata-quorum.sh --bootstrap-server <broker>:9092 describe --status` for KRaft metadata. If the publication receipt is stalled with `KAFKA_RETRY` and too few replicas are in sync, restore original broker storage and wait for the partition ISR to recover. The staged source transaction keeps its original event IDs when retried. [Kafka KRaft guide](https://kafka.apache.org/39/operations/kraft/) · [Kafka 3.9.2 minimum ISR contract](https://kafka.apache.org/39/javadoc/constant-values.html#org.apache.kafka.common.config.TopicConfig.MIN_IN_SYNC_REPLICAS_DOC)

Stage event bytes and identifiers durably before committing a consumer group offset. Kafka commits the offset of the next record to read. Keep that offset separately from Rivomesh's publication receipt and use the event ID for replay deduplication. [Kafka consumer offset API](https://kafka.apache.org/39/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)

The [Kafka native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kafka-cluster-run.py) uses Apache Kafka 3.9.2, a one-partition RF3 topic, three KRaft voters and a broker-only node to isolate data ISR loss. It injects deterministic source transactions into the durable JDBC journal and uses the packaged Kafka transport and native consumer group commits. The fixture covers process failure with retained disk volumes. Live source CDC, TLS, controller-quorum loss, disk loss and workload capacity have separate acceptance scopes.

In the five-check Temurin 21 run, the partition elected a new leader after SIGKILL. With one replica in sync, Kafka still committed a metadata change while the publication receipt stayed at sequence 2. After the broker restarted, the publisher delivered the same retained transaction at sequence 3. The consumer reopened its offset at 7, staged six pending records, and committed 13. A fresh consumer then found no pending records and all 13 original event bodies remained readable.

#### Review the preceding Kafka receipts

When Kafka is paused on a complete incremental apply failure, pause the entire pipeline and use the target error generation.

```bash
java -jar rivomesh.jar review-kafka-recovery config.yml kafka 1
```

`PRECEDING_KAFKA_RECEIPTS_VERIFIED` reports the native offset and bytes digest of each mapped namespace's preceding `COMMIT` for the acknowledged sequence. The command reads at most the last 512 partition offsets with a group-less, read-committed consumer. It checks the bound cluster and the observed topic identity, rejects a moving partition view and rechecks the journal after the broker read. Missing evidence or a later visible `BEGIN`/`COMMIT` fails admission. The observed topic UUID describes this read. The journal's existing transport binding records the cluster only.

The result is recovery evidence for the preceding acknowledged transaction. A journal pause leaves any outstanding Kafka producer unconfirmed. A durable Kafka gap notice would require a separate, reviewed operation and broker fencing. This command leaves the original event, broker records, consumer offsets and journal acknowledgment in place. The focused native profile is `tests/kafka-cluster-run.py --only-recovery-review`.

In shared management, enable `cluster.recoveryReview` on Controllers and Agents running the same release. An administrator with access to the task and its assigned Agent can select **Review Kafka receipts** on a paused Kafka destination after pausing the entire task. The task history shows when the request completes. **View receipt** opens the verified offsets and digests. **Find receipt by request ID** works after the request leaves recent history or the Agent goes offline.

API clients send `POST /api/tasks/<task>/actions` with a stable `X-Request-ID` and a body such as `{"action":"REVIEW_KAFKA_RECEIPTS","expectedRevision":"<current task revision>","subscriptionId":"kafka","errorCount":1}`. HTTP 202 records admission for owner dispatch. Poll `GET /api/tasks/<task>/recovery-receipts/<request>` for the outcome. A successful receipt contains `kafkaReview`, including the observed epoch, error generation, sequence numbers and digests. `KAFKA_RECOVERY_PUBLICATION_UNCERTAIN` leaves the receipt without verified offsets. Use a new request ID and current revision for a fresh observation. A receipt describes its observation time and gives no approval to skip or replay the failed transaction.

Use `tests/kafka-cluster-run.py --only-managed-recovery-review` to exercise the packaged HTTP management flow against four KRaft brokers. The isolated fixture uses two loopback management entries with a shared H2 control store and checks replay through the second entry, lookup with the owner offline, partial-publication rejection and unchanged target progress.

#### Review a Kafka notice plan

An administrator can preview a failure notice for a pre-owned Kafka control topic. Set the optional `recoveryNotice` fields under the Kafka destination’s `messaging` configuration, and apply the configuration before reviewing the predecessor receipt.

```yaml
messaging:
  topic: sales.events
  recoveryNotice:
    controlTopic: rivomesh.sales.recovery
    clusterSha256: "<SHA-256 of KAFKA: followed by the native cluster ID>"
    topicId: "<Kafka topic UUID in its native string format>"
    reservationId: "<UUID for the pre-owned topic reservation>"
```

The control topic must differ from every configured Kafka business topic in the task. Management also checks logical destination conflicts across known bootstrap addresses. The planner verifies that the dedicated topic already exists in the original Kafka cluster, with one partition, at least three replicas, a majority minimum ISR, indefinite retention and automatic creation disabled. Publication stays blocked with `KAFKA_NOTICE_GLOBAL_OWNERSHIP_UNVERIFIED` because logical endpoint claims cannot establish physical separation across every external or aliased destination.

Set `cleanup.policy=delete`, `retention.ms=-1`, `retention.bytes=-1`, `unclean.leader.election.enable=false` and `remote.storage.enable=false` on the control topic. Use a `max.message.bytes` value from 2048 through 65536 and set `min.insync.replicas` to a majority of configured replicas. Set `auto.create.topics.enable=false` on all Brokers. The planner needs business-topic read access and access to Kafka topic and Broker configuration metadata.

Pause the entire task, run a new successful Kafka receipt review, and select **Review Kafka notice plan** inside its receipt. API clients can send `POST /api/tasks/<task>/kafka-notice-plan` with `{"expectedRevision":"<current task revision>","predecessorRequestId":"<successful review request ID>"}`. The owner rechecks the authenticated predecessor, task revision, administrator, original failure and Topic UUID. The response contains a deterministic plan digest and notice payload digest and always returns `executionAuthorized: false`. Generate a fresh receipt after a configuration or owner change, or when the original receipt predates the failure-content binding.

Use `tests/kafka-cluster-run.py --only-managed-notice-plan` to exercise the read-only plan through two management entries and a real Kafka cluster.

### Capture physical ownership for new business publications

Set `kafkaPhysicalOwnershipEvidence: true` in the managed owner Agent's startup configuration to observe new Kafka publications. The Agent checks the exact active shared configuration and the projected Worker file at launch. The Worker receives a signing key scoped to that configuration and owner directory. The first eligible COMMIT per configuration and journal generation records the physical Kafka Topic UUID, the confirmed offset and the exact payload digest. The publication checkpoint stages the proof. The successful subscription ACK and final proof commit in the same journal transaction.

On Linux and Docker, set the option at the root of the executing member's platform YAML and restart that member. For manual Kubernetes, edit the Agent ConfigMap's `platform.yml`, apply the manifest and roll out the Agent. With Helm, set `platform.kafkaPhysicalOwnershipEvidence=true` on the Agent release or on a combined shared-task release that runs Workers.

An enabled Worker checks the receipt tables and its SQL permissions before publication. With schema creation rights, it can provision missing receipt tables. If that check reports `KAFKA_PHYSICAL_JOURNAL_NOT_READY`, check the journal schema and the Worker's SELECT, INSERT and DELETE privileges on the pending receipt table and its SELECT and INSERT privileges on the history tables. MySQL receipt tables use InnoDB with utf8mb4_bin collation. PostgreSQL-protocol receipt tables use permanent ordinary tables. Leave the option disabled to keep using an ordinary journal without the receipt tables.

The shared control authority signs the issuing Agent's node, incarnation, lease epoch and lease time window. This proves the lease observed when the grant was issued. The journal stamps and signs the publication checkpoint and subscription ACK in UTC milliseconds. It compares only those two journal times, so clock differences between the control store, journal and Kafka cannot establish event order. If the journal clock goes backward between the writes, the business ACK still commits and that COMMIT remains unverified. A restart in the same configuration can preserve the original Agent witness on a pending receipt. Older physical receipts stay unchanged and lack the new member and time evidence. A newly observed COMMIT can supply the new evidence for the same configuration.

The Kafka business identity needs READ access to re-read the confirmed offsets. A WRITE-only identity continues to publish and ACK while its physical ownership remains unverified. The profile can read back up to 16 namespaces and retries an unavailable observation at most once every 30 seconds per Worker. The proof begins at its recorded ACK. Older writes and configurations remain unverified. No earlier evidence is backfilled and notice publication stays blocked.

Administrators can read exact retained evidence through either managed entry. With the task still paused, open a successful Kafka receipt review and choose **Check physical receipt**. API clients send `POST /api/tasks/<task>/kafka-physical-receipt` with `{"expectedRevision":"<current task revision>","predecessorRequestId":"<successful Kafka receipt review>"}`. The owner checks the current failure and verifies the saved signatures, exact preceding ACK and Kafka Topic identity. `VERIFIED` returns the receipt digest and its journal timestamps. `MISSING` includes older receipts that do not cover that exact ACK, unverified signatures and changed physical Topic identities. `UNREACHABLE` means an owner, journal or broker read could not complete. Refresh the predecessor review if the task or failure changes. This read provides no authorization to publish.

Native Kafka 3.9.2 testing uses TLS/SCRAM-SHA-512 and two Controller entries routed to the same Agent. A new Kafka Topic with the same name returns missing evidence. With Temurin 21, run `python3 tests/kafka-notice-writer-run.py --managed-physical-receipt <application-jar>` to exercise the retained receipt. [Native evidence](/docs/zh/evidence/baseline.html#managed-signed-receipt-queries-with-a-native-kafka-broker)

The preview reports `catalogCoverage` for the managed task catalog. `VERIFIED_SINGLETON` covers one task, one configuration and one Kafka destination. For a bounded catalog with up to four tasks, eight total retained configuration versions and twelve Kafka routes, `VERIFIED_AT_REVIEW` checks the current physical Kafka cluster and Topic UUID of each business route. The check includes stopped tasks and retained versions offered by configuration history. The current owner reads broker metadata using each configuration on file. A physical match with the control topic returns `CONFLICT`, including when the task uses a different bootstrap alias.

When the catalog exceeds these limits, a broker or owner is unreachable, or a retained configuration can no longer be resolved, coverage is `INCOMPLETE`. A concurrent catalog or configuration update requires a new review. Each owner applies its current Worker secret-reference grants and protected environment rules before reading Kafka metadata. A revoked historical reference blocks that route's probe. Coverage describes where the retained configurations can connect today. Historical physical custody, wider Kafka authorization and approval evidence remain required for publication. All previews keep publication blocked.

An owner Agent can additionally inspect a dedicated writer with `kafkaNoticeWriters` in its private startup configuration. Each entry contains `taskId`, `targetId`, `clusterSha256`, `topicId`, `bootstrapServers`, `username` and `password`. Use Agent-only secret references for credentials and a trusted list of Kafka `host:port` bootstrap addresses. The writer connects to these addresses even when the task uses different aliases. The two roles must use distinct passwords and usernames. Both sessions use hostname-verified `SASL_SSL` with the Kafka target's SCRAM mechanism and the Agent JVM's trusted CA.

The preview reports `writerEntitlement` with the broker's observed effective permissions. The business identity needs metadata access to both topics and read-only access to the control topic. The dedicated identity needs `WRITE` and its implied `DESCRIBE` on the control topic and at least `DESCRIBE` on the selected business topic, with no permissions to mutate it. The check requires the broker's effective operation list for both roles. Installations can exercise the contract with `python3 tests/kafka-notice-writer-run.py <application-jar>`. A verified observation covers the reviewed roles and topics at that time. Publication remains blocked pending complete managed coverage, broader broker policy and approved transactional dispatch.

### Enroll a new task for first-send evidence

For a new task with a Kafka target and a `LOCAL` journal, set `kafkaHistoryFromFirstSend: true` at the task YAML root before creating it through a shared management entry. Enable `kafkaPhysicalOwnershipEvidence` on the owning Agent before starting the task. Standalone runs, external journals and changes to the enrollment setting on existing tasks are refused.

Task creation signs the initial configuration and assigned journal generation in the control store. Before the first Worker starts, the Agent commits the same origin and empty first-attempt records with the local journal job and subscriptions. It rechecks the live Agent lease and active configuration before marking the origin ready. Restart verifies the existing journal and generation. Keep the owner data directory and control-store backups together. If a ready journal is missing or its origin does not verify, stop and investigate its original storage. A replacement journal cannot be enrolled by restarting the task.

For each Kafka target, the journal commits a signed digest before the first business publish attempt. The digest binds the active configuration projection, journal generation, subscription, lease epoch and exact first wire batch. It contains no raw message data or credentials. Each schema, snapshot or incremental send runs the origin check. A failed or ambiguous first publish leaves the first attempt at `UNKNOWN`, including after ordinary business replay and ACK. Keeping one first attempt per Kafka subscription bounds storage. Later sends and broker-internal retries have no entries in this profile. When no physical Topic is configured, Produce uses the Topic name. First-intent evidence alone leaves historical ownership unresolved. Keep independent control-store and local journal backups coordinated.

### Bind new Kafka business routes to physical Topics

For the approval-and-dispatch profile, create each business Topic before creating the task. Set the following fields on every Kafka target, along with the normal endpoints, credentials, mappings and the Topic policy above.

```yaml
kafkaHistoryFromFirstSend: true
targets:
  - id: orders-kafka
    product: KAFKA
    messaging:
      autoCreate: false
      securityProtocol: SASL_SSL
      saslMechanism: SCRAM-SHA-512
      topic: orders.events
      physicalTopic:
        clusterSha256: "<SHA-256 of KAFKA: followed by the native cluster ID>"
        topicId: "<native business Topic UUID>"
```

Enter the UUID from Kafka's topic description and the cluster ID from Kafka's cluster administration API. The managed task signs these routes with the initial configuration and journal generation. The Worker sends schema, snapshots and incremental records to each assigned UUID with Produce v13. It saves the latest confirmed COMMIT offset and digest per target and configuration. The owner Agent verifies the exact native record when an administrator reviews a failure. A UUID change needs a newly enrolled task and a reviewed migration. Retained configurations that previously sent by name still block full-history approval. [Kafka 4.1 protocol](https://kafka.apache.org/41/design/protocol/)

Use Kafka 4.1 or later with transaction version 2 finalized for the dispatch profile. The packaged notice transport uses an isolated Kafka 4.1.2 SDK. Ordinary name-addressed synchronization uses the separate Kafka 3.9.2 SDK. Kafka's CLI or Admin API must report the original physical identifiers after failover. Same-name Topic recreation creates a different identity and requires a recovery decision.

Configure the writer on the owning Agent. Grant the business identity the cluster `DESCRIBE` operation to inspect ACLs affecting the reserved control Topic. Give the notice identity one literal `WRITE` grant on that Topic and transaction access to Rivomesh's `rivomesh-kafka-notice-` identifiers for its assigned notices. Keep Kafka administrators and their maintenance access under the broker's operational controls. Exclude external business writers from the dedicated control Topic. The native check verifies matching literal, wildcard and prefix ACLs before enabling dispatch. [Kafka authorization](https://kafka.apache.org/41/security/authorization-and-acls/)

### Approve, check and send a gap notice

Pause the task and open the successful Kafka receipt review. Preview the affected subscription and use **Record approval** when the managed catalog verifies the complete configured routes. The older profile offers **Record conditional approval**. Approval records bind the exact failure, actor, configuration version, control Topic UUID, route digest and notice payload. Re-review a changed configuration, writer entitlement or physical Topic.

API clients send `POST /api/tasks/<task>/kafka-notice-approvals` with `X-Request-ID`, `expectedRevision`, `predecessorRequestId` and `approvalScopeSha256`. A successful response is `RECORDED` for an eligible approval or `RECORDED_BLOCKED` when proof is missing. Both record types return `executionAuthorized: false`.

The original approver uses **Check sender prerequisites**. The equivalent route is `POST /api/tasks/<task>/kafka-notice-approvals/<request-id>/preflight` with `expectedRevision` and `approvalScopeSha256`. The service checks the original approval and audit record, revalidates the routes and writer, and reads the exact preceding ACK. `SENDER_READY` enables **Send gap notice**. A blocked check shows the missing evidence or broker requirements.

The send action posts to `/api/tasks/<task>/kafka-notice-approvals/<request-id>/dispatch` with the same two fields and a new stable `X-Request-ID`. Either entry can retrieve the delivery operation with `GET /api/tasks/<task>/recovery-receipts/<dispatch-request-id>`. An uncertain outcome stays visible until the owner verifies the native Kafka receipt. Reuse the same request ID after a lost HTTP reply. A successful notice records the physical Topic, native offset and payload digest. The failed source transaction, subscription ACKs, business Topics and consumer offsets remain at their original positions during notification.

If the owner is interrupted before Kafka commits, the ledger retains the exact native offset and waits. Only Kafka's terminal abort and exact retained bytes permit another attempt. On a lost commit response, the owner reads the original committed notice and preserves its receipt. A missing or changed control Topic leaves the operation unresolved.

```sh
python3 tests/kafka-cluster-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/kafka-cluster-proof
```

Rabbit uses durable, nonexclusive, non-auto-delete queues, direct routing through the default exchange, persistent messages, publisher confirms and mandatory/return. Returns/nacks never advance the receipt. Quorum is the default; classic is selectable. Created queues use reject-publish overflow. Broker policies must not silently discard old/expired messages or dead-letter redeliveries without a recovery consumer. Production quorum requires multiple nodes and appropriate replicas. Single-node tests do not establish majority-loss or power-loss guarantees.

For three-node RabbitMQ, set `messaging.queueType: quorum` and `messaging.replicas: 3` before the first queue declaration. Use one broker as `url` and the other two as `messaging.endpoints`, all from the same cluster and virtual host with the same TLS mode. The replica setting is the initial declaration size. Verify actual `members`, `online` and `leader` with `rabbitmqctl list_queues -p / name type durable leader members online`. Publisher confirms from a quorum queue depend on the available majority. [RabbitMQ quorum queues](https://www.rabbitmq.com/docs/4.1/quorum-queues) · [Publisher confirms](https://www.rabbitmq.com/docs/4.1/confirms)

If a leader fails and a majority remains, Rivomesh reconnects through a surviving endpoint while RabbitMQ elects the new leader. If the majority is unavailable, retain the RabbitMQ volumes and policies. Start one of the original replicas, confirm the majority has returned, then start the next replica. The native 4.1.4 fixture observed a Mnesia startup failure when two stopped brokers started together. Retrying the affected broker after its peer was ready restored all three original members. [RabbitMQ reliability](https://www.rabbitmq.com/docs/4.1/reliability)

A broker confirmation advances the publication receipt. A consumer should stage the original event ID and bytes before acknowledging and deduplicate retries by event ID across connections. The native profile received 19 deliveries with 18 distinct IDs. The repeated ID matched its original bytes, and manual ACK emptied all three queues after local staging. The consumer's acknowledgement and its business checkpoint have separate meanings. [RabbitMQ consumer acknowledgements](https://www.rabbitmq.com/docs/4.1/confirms)

Run the isolated profile against a frozen release artifact with Python 3.11 or later and a local Temurin 21 JDK. The fixture uses plain AMQP with loopback host bindings. It checks broker process failures, retained source GTIDs, broker publication receipts, original consumer bytes and manual ACK on three persistent RabbitMQ nodes. TLS, storage loss, performance and consumer business transactions require separate acceptance. [Native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rabbit-quorum-run.py)

```sh
python3 tests/rabbit-quorum-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/rabbit-quorum-proof
```

NATS uses JetStream publish ACKs and `Nats-Msg-Id`, never volatile Core NATS. Streams require File storage, Limits retention, Discard New, no age expiry, exact `namespace.*` subjects and configured replicas. The description binds pipeline/subscription/generation; incompatible existing streams are rejected rather than altered. Finite capacity rejects new publication. The publisher does not automatically delete consumer history: plan capacity, archival and consumer checkpoints. Broker fsync, replication and disk determine power-loss durability.

The three-member NATS 2.11.8 profile uses `tls://` for the primary and each explicit failover endpoint, `messaging.replicas: 3`, and a JVM trust store with the broker CA. The client verifies the endpoint name against the certificate and uses the configured entrances. The native profile verifies leader loss, refusal to confirm without a majority, and original-event-ID retry after recovery. The broker-to-broker routes and mutual TLS require separate validation. [JetStream clustering](https://docs.nats.io/learn/topologies/jetstream-in-a-cluster) · [Evidence](/docs/zh/evidence/baseline.html#nats-jetstream-tls-and-quorum)

Pre-provisioned streams with `autoCreate: false` must match the same properties and binding. The binding is `rivomesh:` plus `SHA-256(pipelineId + ':' + subscriptionId + ':' + generation)`. Read generation from initialized status; prefer service creation for a new task rather than guessing it.

### Redis Streams

The first Redis profile supports a **direct standalone primary running Redis 7.2 or newer**. Use `redis://host:6379/0` or `rediss://host:6379/0`, a database number, separate ACL username/password and `messaging.stream`. Additional endpoints, Sentinel, Cluster routing and proxy failover are not implemented in this profile. `rediss` verifies the server hostname using the JVM trust configuration.

All logical channels share one physical stream. Each entry contains `body`, `rivomesh_event_id`, `rivomesh_channel`, optional `rivomesh_key`, and transport headers. Redis-generated entry IDs are transport positions, not event identities or MySQL order. Consumers use the same envelope staging/deduplication rules as other message targets. The reserved marker consumer group `_rivomesh_stream_marker_v1` creates an empty stream without a fake business event; it is not a consumer checkpoint.

Preparation requires AOF enabled, `maxmemory-policy=noeviction`, no TTL on either stream or ownership keys, and a writable non-cluster primary. Ownership is bound per stream in `_rivomesh_publication_owners_v1`. Existing unowned streams require an adoption plan; another binding is rejected. Previously initialized missing resources are not silently recreated. `XADD NOMKSTREAM` prevents accidental recreation after deletion while connected. Administrators must not purge/trim/expire these keys; same-name replacement or an old storage backup still requires reconciliation.

Each batch uses `XADD` followed by **WAITAOF on the same physical connection**. Both returned fsync counts must satisfy local >=1 and replicas >=`replicas-1`; a timeout alone is not confirmation. The socket factory forbids SDK socket reopening: retries construct a new authenticated client with the configured database, preventing accidental writes into database 0. Server run ID and client ID are also compared around publication to reject hidden connection replacement. AOF write failure, insufficient replicas, OOM under noeviction and disconnection preserve the receipt and retry. `replicas: 1` confirms only local AOF, without Redis failover durability. Higher counts require the corresponding live replicas with AOF; they do not provision replication or prove lossless promotion. RDB alone and volatile Pub/Sub are insufficient.

The publisher ACL needs connection/auth/select as applicable, INFO, CONFIG GET maxmemory-policy, CLIENT ID, EXISTS/TYPE/PTTL, HGET/HSETNX, XGROUP CREATE, XADD and WAITAOF, limited to the selected stream and ownership hash. Consumers need their own read/group permissions. `check` reads capabilities without creating keys. WAITAOF and fsync can affect latency; measure against the actual storage and replication topology. No automatic stream trimming is performed; capacity and consumer-safe archival remain an operator responsibility.

The direct-primary profile can use an externally managed stable entrance. Fence the unavailable primary before promoting the original AOF replica. Verify its stream entries, ownership binding and consumer group state against the retained checkpoints. Point the existing entrance at the promoted replica and restore enough AOF replicas to meet the configured `replicas` count. With `replicas: 2`, an unavailable second fsync keeps the publication receipt unchanged. An earlier local `XADD` can already be visible, so consumers deduplicate by event ID and wait for COMMIT and the expected rows. [WAITAOF](https://redis.io/docs/latest/commands/waitaof/) · [REPLICAOF](https://redis.io/docs/latest/commands/replicaof/)

Stage the raw event and its stream entry ID before `XACK`. If the consumer must preserve its acknowledgements on AOF replicas, run `WAITAOF` on the same connection after `XACK` and check both counts. Recover the failed consumer's pending entries with `XAUTOCLAIM` before processing new records. The idle threshold should account for the time a healthy consumer needs to finish processing. [Redis Streams replication](https://redis.io/docs/latest/develop/data-types/streams/) · [XAUTOCLAIM](https://redis.io/docs/latest/commands/xautoclaim/)

The [Redis native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/redis-promotion-run.py) uses Redis 7.4.2, Temurin 21 and source events seeded into the packaged JDBC journal. It exercises operator-driven promotion, loss and restoration of a replica fsync, immutable retry bytes, consumer acknowledgements and pending-entry recovery, and a cold restart on the promoted primary's original AOF volume. Sentinel, Redis Cluster, cross-node TLS replication and loss of the acknowledged storage have separate acceptance scopes.

A separate Redis 8.0.2 native fixture used Temurin 21, a private CA, hostname verification, a restricted ACL username and password, and DB 2. Untrusted CA, a hostname absent from the certificate and invalid credentials create no keys. An AOF cold restart preserves the original native IDs and snapshot. The publisher resumes to ACK 2. Run `python3 tests/redis-tls-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar --java-home "$JAVA_HOME" --output target/redis-tls-proof` with local Redis 7.2 or newer and OpenSSL. [TLS acceptance record](/files/docs/verification/baseline.json)

The six-check native run kept the publication receipt at sequence 1 until the second fsync returned, then delivered the original transaction at sequence 2. It retained 11 stream entries with 10 unique event IDs. The repeated event had identical bytes. Four earlier consumer acknowledgements stayed effective, and the recovered consumer claimed the three pending IDs. After the promoted primary restarted, its original stream IDs, group cursor and empty pending list were intact.

```sh
python3 tests/redis-promotion-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/redis-promotion-proof
```

### Pulsar

Pulsar uses a dedicated **persistent, non-partitioned topic** for all mapped namespaces. Configure `url: pulsar://host:6650`, `messaging.adminUrl: http://host:8080`, `cluster`, and `topic: persistent://tenant/namespace/topic`. The tenant/namespace must already exist and belong to exactly the configured cluster; geo-replication needs a separate plan. The first profile uses one service endpoint with native broker discovery; extra `endpoints` and username/password authentication are rejected. Token authentication uses `messaging.token`. TLS requires both `pulsar+ssl://` and HTTPS admin access with hostname verification. A single-broker TLS and Token profile verifies the configured CA, hostname, credentials and history after broker restart. The transport also has a two-broker and three-bookie recovery profile. Configure a reachable service and admin endpoint for the surviving cluster, and allow the Worker to reach all broker addresses advertised by discovery.

For a private CA, mount the PEM bundle on the Worker and on any Agent that runs Check. Use its absolute path in `messaging.tlsTrustCertsFilePath`. The transport uses that CA for both broker traffic and HTTPS administration. Broker names advertised by the service must appear in their certificate SANs. The Token needs the cluster, namespace and topic permissions required by the configured provisioning policy. [Pulsar TLS](https://pulsar.apache.org/docs/4.0.x/security-tls-transport/) · [Pulsar Token authentication](https://pulsar.apache.org/docs/4.0.x/security-token-admin/)

```yaml
url: pulsar+ssl://pulsar.example:6651
messaging:
  adminUrl: https://pulsar.example:8443
  cluster: pulsar-production
  topic: persistent://tenant/namespace/rivomesh-events
  token: ${RIVOMESH_PULSAR_TOKEN}
  tlsTrustCertsFilePath: /run/secrets/pulsar-ca.pem
```


Every active broker must disable automatic topic creation and inactive-topic deletion and enable topic-level policies. Namespace overrides must not re-enable automatic creation. The publisher reads these settings through advertised admin endpoints, requiring cluster/broker/namespace management-read permissions as well as topic operations. Native reconnect must not recreate a deleted empty topic. Restrict administrative policy changes during publication; existence/binding checks cannot detect every purge or restoration of an old backup.

Initial creation atomically binds `rivomesh.owner` to the common pipeline/subscription/generation binding and marks `rivomesh.provision=BUILDING_V1`. Only that unfinished owned topic is provisioned: infinite retention in both time and size, TTL 0, inactive deletion disabled, BookKeeper persistence, and backlog policies that reject producers rather than evict consumers' history. Applied policies are verified before marking `READY_V1` and opening a producer. Asynchronous policy propagation retries without publishing. Existing READY policy mismatches, unowned topics or another binding require a plan and are not overwritten. Pre-provisioning with `autoCreate: false` requires matching ownership, READY_V1 and all policies; missing initialized topics never get an empty replacement.

`replicas` means **minimum BookKeeper ACK copies** for this profile. Fresh topics use ensemble/write/ACK quorum all equal to this value. An existing compatible topic may use a larger ensemble/write quorum if its ACK quorum meets the configured minimum. This setting does not provision bookies, broker replicas or failure domains. Confirmations rely on BookKeeper's durable journal/replication configuration and recoverable metadata. A single-bookie test is not a production HA or power-loss guarantee. Retention is infinite, so plan capacity, archival and consumer-safe history removal.

The local quorum fixture uses Pulsar 4.0.14, two active brokers, three BookKeeper nodes and one ZooKeeper node. It checks the original topic binding and the 2/2/2 ensemble, write and ACK policy. After the serving broker exits, the publisher can reopen the existing topic through the surviving service endpoint. The message sink closes an unconfirmed publisher before retrying the same event through a fresh connection. With two bookies offline, a publication that needs two acknowledgements cannot be confirmed. After the original bookies return on their volumes, the transport reopens the existing topic and retries the same stable event ID. Consumers must deduplicate retry attempts. This profile uses an isolated plaintext network. The secure quorum profile combines broker TLS and Token with a three-node metadata quorum. Capacity and storage failure domains require separate acceptance. [Pulsar cluster configuration](https://pulsar.apache.org/docs/4.0.x/deploy-bare-metal/) · [Verification](/docs/zh/evidence/baseline.html)

The secure fixture uses a private CA with a separate certificate for each broker's advertised name. Both broker entry points require HTTPS, Pulsar TLS and Token authentication. With one ZooKeeper leader removed, the two surviving nodes elect a leader. The transport then creates and confirms a new owned Topic and rechecks the original confirmed history. The storage and ZooKeeper peer networks are local to the fixture. Production network cryptography and cross-host durability require their own validation. [Pulsar TLS](https://pulsar.apache.org/docs/4.0.x/security-tls-transport/) · [ZooKeeper and BookKeeper](https://pulsar.apache.org/docs/4.0.x/administration-zk-bk/)

Publication sends bytes synchronously with batching/chunking disabled and bounded pending requests. Message properties carry immutable event ID, logical channel and transport headers; the Pulsar key carries the logical row/transaction key. BookKeeper-confirmed send completion precedes the journal receipt. Pulsar message IDs and broker-side deduplication are not substitutes for event-ID deduplication and transaction staging. Native Pulsar transactions are not used; the common at-least-once contract applies across producer replacement and source lease handoff.

Rivomesh pins Pulsar client 4.0.14 behind `rivomesh-pulsar-transport`. Its logging, crypto, Jackson annotations and protobuf are isolated from core dependencies. The installed Worker uses Temurin 21. Build the reactor with `mvn verify` so the private SDK is packaged before the application. The transport test runs with the core JAR first on the classpath and verifies both dependency sets coexist; it also verifies read-only check, ownership, send/read, broker restart, retention refusal and lost-topic protection. Full mixed-pipeline recovery acceptance is recorded separately in [validation](/docs/en/reference/validation.html).

Broker startup and source catch-up are different measurements. The failure harness first verifies that SQL continues while stopped brokers report automatic retry, then waits for broker health, then measures catch-up without manual Resume. A broker whose admin service or storage is still starting cannot be treated as a ready destination. Recovery diagnostics include safe error codes such as `PULSAR_ADMIN_HTTP_503`; no row data or credentials are copied into status.

Pulsar references: [Java baseline decision](https://github.com/apache/pulsar/blob/master/pip/pip-421.md), [topics and resource management](https://pulsar.apache.org/docs/4.0.x/admin-api-topics/), [retention versus TTL](https://pulsar.apache.org/docs/4.0.x/cookbooks-retention-expiry/), [broker configuration API](https://pulsar.apache.org/docs/4.0.x/admin-api-brokers/). Server storage identity and recovery must be validated for the chosen deployment.

## Envelope and consumer rules

Version 1 includes pipeline/subscriptionId/generation/event ID, kind/namespace, table/schema version, source position and sequence. Publication IDs include subscription identity to prevent deduplication across different mappings; Change.eventId still identifies the logical source event. Values are interpreted through the schema. Numeric strings retain precision; `present: false` means absent and `present: true, value: null` means SQL NULL. JSON `null` is a JSON text value and differs from SQL NULL.

| Kind | Meaning |
|---|---|
| `SCHEMA` | Columns/types/identity/source indexes; message sinks do not execute DDL/index conversion |
| `SNAPSHOT_BEGIN`, `SNAPSHOT_ROW`, `SNAPSHOT_END` | Snapshot ID/baseline/parts/row ordinals/counts; complete only after END and deduplicated counts match |
| `BEGIN`, `ROW`, `COMMIT` | Source commit boundary/order/before/after images; COMMIT is published after all row confirmations |

Primary-key updates expose both `beforeKey` and `afterKey`: remove the old identity and insert/update the new identity. Keyless duplicate rows each have a separate rowId. Delete the specified occurrence, not all equal rows. Snapshot and CDC share these occurrence identities.

Transaction controls include global `totalChanges`, per-namespace `expectedChanges`, transactionKind and source attributes; controls preserve BARRIER changes at their original ordinals. Row ordinals cover the whole transaction projected to that destination. Consumers should durably stage and deduplicate events, await the required rows and COMMIT, verify counts/order, then atomically commit their business work and consumer checkpoint. Different queues/subjects can be consumed at different speeds: an application may observe COMMIT before all rows arrive.

COMMIT contentHash is the `Codec` SHA-256 of the normalized `SourceTransaction` projected through this destination's mappings. A consumer subscribed to every mapped namespace can reconstruct it from BEGIN's transaction ID/generation/position/kind/attributes and ordered ROW.change values. A consumer of only some namespaces cannot claim to verify the entire hash. Transport epochs are headers outside immutable bodies. Track generation/sequence to prevent late old publications from overwriting newer state; timestamps are not source order.

Neither the NATS duplicate window nor Rabbit message IDs replace durable consumer deduplication. Consumer ACKs, crashes, transaction staging capacity, missing rows and long outages require a consumer recovery protocol; this version does not ship an automatically running materialization consumer.

Kafka producer idempotence also does not cover all replay after replacing a producer instance. Broker offsets are not source sequences. Handle late old-owner publications through generation/epoch/logical sequence/event ID, not physical offset alone. Consumers selecting one namespace filter envelopes and verify that namespace's expectedChanges.

## Recovery and FAQ

**Disconnect/restart:** retryable failures preserve checkpoints, reconnect, revalidate established resources and replay unconfirmed work. Permanent permission/routing/property failures pause only that destination. Repair and select its generation-bound Resume action in the UI.

**Missing queue/stream:** `MESSAGE_DESTINATION_MISSING_REBUILD_REQUIRED` requires restoring original broker storage or a recovery plan covering consumers, missing history and a new snapshot. Creating an empty resource and pressing Resume cannot prove historical completeness. An administrator purging/replacing a same-name resource or changing broker policies cannot be detected by an existence check alone; reconcile the data.

**Cross-target atomicity:** destinations confirm independently. One may succeed while another fails. There is no cross-database/broker distributed transaction. Source history remains until lagging subscribers catch up; quota exhaustion stops capture rather than dropping their data.

**Pause/cutover:** message destinations return `UNCONFIRMED_IN_FLIGHT_PUBLICATION`. A journal epoch cannot retract a broker request already in flight. Fence/stop old producers, establish downstream catch-up barriers, reconcile and isolate business writes before cutover. Automated cutover remains in development.

**Oversized messages:** `MESSAGE_TOO_LARGE` preserves the transaction checkpoint. Align application/broker limits and consumer memory. Transparent fragmentation/external LOB storage is unimplemented. Large source transactions, catalog memory and growing receipt history still require resource work; there is no hardware-independent capacity guarantee.

**Redis confirmation does not arrive:** inspect AOF health, required replica AOF fsyncs, replication lag, disk and ACL. `REDIS_DURABILITY_NOT_CONFIRMED` or `REDIS_CONNECTION_CHANGED_DURING_CONFIRM` leaves publication unconfirmed and replayable, even if XADD already reached the server. Fix the cause without deleting stream history or weakening a running task's durability configuration. The UI's source snapshot rows are source preparation progress; per-destination snapshot confirmations are separate and still do not prove consumer completion.

**Verification:** run `SYNC_MAVEN_CACHE=/path/to/cache bash tests/messaging-run.sh`. It creates/restarts/removes only its own Compose project. See [validation](/docs/en/reference/validation.html) for versions, results and remaining cluster/TLS acceptance.

Protocol references: [Kafka 3.9 Java baseline](https://kafka.apache.org/39/operations/java-version/), [producer configuration](https://kafka.apache.org/39/configuration/producer-configs/), [Rabbit Java client/Java 8 baseline](https://www.rabbitmq.com/client-libraries/java-client), [Rabbit reliability](https://www.rabbitmq.com/docs/reliability), [NATS Java client](https://github.com/nats-io/nats.java), [JetStream](https://docs.nats.io/learn/jetstream/). Protocol documentation does not substitute for this project's environment acceptance.

Redis references: [WAITAOF same-connection semantics and returned counts](https://redis.io/docs/latest/commands/waitaof/), [persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), [Jedis](https://github.com/redis/jedis). The current client is Jedis 8.0.2 using its single-connection API.

## RocketMQ native TCP profile

The `ROCKETMQ` publisher is implemented using Java-8-compatible native client 5.5.1 with isolated dependencies. Real native-broker confirmation, client/broker restart, unsafe flush refusal and lost-topic protection passed (`target/rocketmq-transport-cached.log`); mixed snapshot/CDC, worker kill and three broker restart rounds passed (`target/messaging-rocketmq-mixed.log`, 49 executions). The earlier single-broker acceptance leaves ACL and TLS for separate verification. The default profile is a single `ASYNC_MASTER` broker group with **one local synchronous disk copy**, not a synchronous replicated or Raft guarantee. The default profile uses `replicas: 1`. Username, password and token remain reserved for an authenticated profile. Use a trusted network for this profile.

Configure `rocketmq://nameserver:9876`, optional additional NameServers in `messaging.endpoints`, `cluster`, `broker`, `topic` and `minimumRetentionHours`. The URI is a native TCP NameServer, not a 5.x gRPC Proxy. `topic` is a prefix of 1–48 characters (letter first, then letters/digits/underscore/hyphen). The physical topic is `<prefix>_<64-hex task/subscription/generation binding>`. The UI exposes that actual name once the journal generation exists. New generations receive different names; restarting the same generation reuses its name. Reserve these names exclusively for Rivomesh and prohibit external creation, deletion, expansion or writes.

### Opt in to Controller broker promotion

Set `messaging.rocketmqControllerEndpoints` to the trusted native Controller addresses and `messaging.replicas` to `2`. The target URL and additional `messaging.endpoints` continue to be NameServer addresses. In the console's RocketMQ target settings, enter the Controller addresses with ports, separated by commas. The wizard sets the minimum copy count to two. Leaving the field empty uses the original single asynchronous-master profile.

```yaml
url: rocketmq://rocketnamesrv:9876
messaging:
  cluster: BusinessCluster
  broker: broker-a
  topic: sales_events
  replicas: 2
  rocketmqControllerEndpoints:
    - rocketmq://rocketnamesrv:9877
```

Prepare one broker group with exactly three configured data replicas and independent storage. The trusted Controller must use clean election. Before publication, its current master address and replica ID must agree with the NameServer's active route and the live broker settings. Every active SyncStateSet member must be live, and at least two must remain. Use Controller mode with `SYNC_MASTER` on the active broker, `SYNC_FLUSH`, `allAckInSyncStateSet=true`, `minInSyncReplicas=2`, `syncFromLastFile=false` and `asyncLearner=false`. Apply the retention, forced-cleanup and automatic-topic settings below to all replicas. This profile uses the AutoSwitch CommitLog, with DLedger CommitLog disabled. [RocketMQ Controller deployment](https://rocketmq.apache.org/docs/deploymentOperations/03autofailover/)

Each physical topic includes its journal generation. An uninitialized binding can create its topic on the proven active broker. The adapter waits for the exact one-queue configuration to become visible on the safe SyncStateSet before writing the owner or events. An initialized binding always checks retained metadata and its native history. If topic configuration or a safe route is still catching up after promotion, the publisher retries and keeps the last durable confirmation. Fewer than two live synchronized copies prevent publication.

When the confirmed master or term changes, the adapter closes the old SDK connection. It sends synchronously directly to the validated active address, verifies the native message and checks the same Controller and replica view before accepting the receipt. It retains the existing topic generation and `ROCKETMQ_OFFSET_V1` coordinates. A lost or uncertain acknowledgement can still replay an event ID. A confirmed payload mismatch requires investigation before recovery. Conversion between durability profiles requires an explicit migration plan because the Controller profile has its own configuration fingerprint.

The RocketMQ 5.5.0 acceptance used a running embedded Controller and three independent Broker volumes. The production publisher retained queue offset 1 and physical offset 451 through master epoch 1 to 2, confirmed the next event at 2 / 906, and reopened from its native receipt. After the remaining follower stopped, the confirmed receipt and the broker queue tail stayed unchanged. Controller outage, broker-data loss, DLedger CommitLog, TLS, ACL and a full CDC Worker switchover have separate acceptance requirements. Keep NameServer, Controller and broker traffic on the trusted network. [Native fixture and reproduction](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rocketmq/controller-promotion.md)

### Topic and retention settings

Preparation reads broker configuration and creates exactly one read/write queue on the selected broker group. The broker must have `flushDiskType=SYNC_FLUSH`, `transientStorePoolEnable=false`, `autoCreateTopicEnable=false`, `cleanFileForciblyEnable=false`, and `fileReservedTime >= minimumRetentionHours` (default 87600 hours). The default mode rejects replicated groups. The optional Controller profile requires the live checks above. Deploy these durability settings at broker startup; do not change storage mode live. The client sends persistent synchronous messages with waitStoreMsgOK and accepts only `SEND_OK`; disk/slave timeout statuses do not advance the journal checkpoint. Retries can duplicate events with the same stable ID.

Queue offset 0 contains an ownership manifest identified by user property `rivomesh_publication_manifest`. Consumers must filter this manifest before decoding JSON envelopes. Subsequent messages use the common event envelope and `rivomesh_event_id`, `rivomesh_channel`, `rivomesh_key` properties. All logical tables/control channels share queue 0. Consumers still deduplicate and verify SNAPSHOT_END / COMMIT and row counts; native broker confirmation does not mean application completion.

The manifest permits a crash between topic creation and publication to finish on restart. A nonempty topic with another manifest, missing initialized topic, changed queue/policy, or expired offset 0 blocks with a recovery error. Each publication batch rechecks broker settings, topic shape and manifest. No automatic empty-history replacement is permitted. Retention is **finite**: plan downstream archival and a verified rebuild before its horizon; large retention values are not infinite storage. Storage loss, manual cleanup, quota and retention expiry require a recovery plan. Monitor broker disk capacity; do not lower retention to clear pressure silently.

Run `bash tests/rocketmq-transport-run.sh` for the actual release-JAR/broker test. The test uses isolated native broker 5.5.0, no host ports, startup data-volume ownership initialization and removes only its Compose project. The default anonymous single-node test does not validate ACL, TLS, power loss, controller/DLedger, replica failover or sustained throughput. Protocol references: [server configuration](https://rocketmq.apache.org/docs/4.x/parameterConfiguration/02server/) and [native client source](https://repo.maven.apache.org/maven2/org/apache/rocketmq/rocketmq-client/5.5.1/rocketmq-client-5.5.1-sources.jar).

A matching manifest alone does not prove retained confirmed history. RocketMQ now also persists and verifies a native confirmation receipt as described below. Other message transports still need their own rollback-detection profiles; do not infer that this protects every broker product.

RocketMQ broker-native promotion is verified. The original default profile refused Controller mode. The optional profile uses the requirements above. [Native evidence](/docs/zh/evidence/baseline.html#rocketmq-broker-controller-promotion-and-topic-metadata)

### RocketMQ native confirmation receipts

After a successful publication batch, the journal saves a generation-bound native receipt before schema/snapshot/transaction receipts advance. New table `publication_transport` contains one small row per subscription; this additive table is created when opening existing journals. Its update is lease-fenced and compares the previously read receipt, so a stale worker cannot replace a newer receipt. Confirmation loss or an uncertain metadata commit still replays stable IDs.

`ROCKETMQ_OFFSET_V1` binds the physical topic, queue offset, CommitLog byte offset and a SHA-256 digest of the stable event ID plus message body. On reconnect and before each publication batch, native `viewMessage` reads the CommitLog record and verifies that receipt. This avoids treating asynchronous ConsumeQueue indexing lag as lost confirmed data. Missing, replaced or changed confirmed records block that destination with `ROCKETMQ_CONFIRMED_HISTORY_*_REBUILD_REQUIRED`, before further publication or resource creation. Normal restart resumes against the saved receipt. An existing publication without its required native receipt blocks with `PUBLICATION_TRANSPORT_UPGRADE_REQUIRES_PLAN`; a new binary does not invent an unsafe baseline for an older task.

`target/rocketmq-native-progress-restore.log` passed the actual release-JAR test: stop broker, copy its nonempty volume after the first confirmation, restart and confirm another event, restore the older volume, verify the first event remains while the second is missing, and reject continuation with the saved later receipt. It also rejects a changed content digest and accepts a matching receipt through client restart. `target/messaging-native-progress.log` additionally passed 53 executions: the actual release JAR, six message products plus PostgreSQL, worker kill and three all-broker stop/start rounds with native receipt recovery.

These checks protect the saved confirmed record; they are not an arbitrary-history checksum or consumer business checkpoint. Keep the ownership/retention/storage requirements, consumer count/order verification and archival plan. Do not delete the transport receipt or force a lower offset to bypass failure. A validated recovery/rebuild plan is required when confirmed history has been lost. Receipt rows and other metadata require physical storage headroom beyond the logical event quota.

`target/v3-native-progress-external.log` passed 47 executions, including the native receipt persistence/CAS/lease/reopen contract against actual MySQL, PostgreSQL and openGauss journal storage, plus V3 SQL fan-out and HTTP controls. `target/ui-native-progress.log` passed 16 DOM tests.

## Artemis Core retained-queue profile

`ACTIVEMQ_ARTEMIS` is a separate product from ActiveMQ Classic. Configure `artemis://host:61616`, username/password, explicit database mappings and `messaging.stream` as a 1–48-character queue prefix (letter first, then letters/digits/underscore/hyphen). `messaging.broker` optionally checks the broker name. The first profile accepts one entrance, `replicas: 1` and no token/extra endpoints. The physical queue is `<prefix>.<64-hex pipeline/subscription/generation binding>`; the UI exposes it after generation initialization.

The client speaks Core protocol through isolated `rivomesh-artemis-transport`. Rivomesh pins Core client 2.19.1 with private Netty 4.1.130 and separate logging and JSON libraries. The archived profile used broker 2.57.0, which has its own runtime. Current Workers use Temurin 21. This is a tested compatibility profile, not a claim that every older client/broker/security configuration is supported.

The broker must enable persistence, transactional and nontransactional journal sync; preparation reads these runtime attributes. Keep `journal-datasync=true` in the broker configuration: the management attributes used here do **not** independently expose/verify that setting. The supplied [broker fixture](/files/tests/artemis-broker.xml) sets it explicitly and uses NIO. Physical storage durability and power-loss acceptance remain separate requirements. A synchronous Core transaction commit precedes publication receipts; lost confirmations still permit stable-ID duplicates.

Use a dedicated address-settings match such as `rivomesh.#` for that prefix. Disable auto-create queues/addresses and all auto-delete variants for business resources; the service explicitly creates its first reserved queue. Disable expiry (`no-expiry=true`, or all expiry delays -1), last-value/ring/purge behavior and delivery discard (`max-delivery-attempts=-1`). PAGE/BLOCK/FAIL address policies are accepted; DROP is rejected. A persistent non-destructive ANYCAST queue with exactly one queue bound to its address is required. Existing incompatible resources are refused. Do not change `journal-datasync` or these policies underneath a running task.

Management travels over the same authenticated Core connection, not a separate HTTP admin URL. It uses a temporary non-durable `activemq.management.<uuid>` reply queue. Grant the needed management, temporary-queue create/delete, send/consume/browse rights and allow cleanup for this internal prefix. Check creates no business objects; its temporary control channel closes afterward. Do not apply the business no-create policy to this reply prefix. The example fixture separates these address settings; merge the relevant settings into an existing deployment rather than replacing its entire broker configuration blindly.

Queue offset/record ordering is internal to Artemis. A retained ownership message carries `rivomesh_publication_manifest`; consumers filter that property **before** decoding subsequent bytes as the common JSON envelope. Published properties carry `rivomesh_event_id`, `rivomesh_channel`, `rivomesh_key` and the common headers. Normal consumer ACK does not delete messages from this non-destructive queue. After reconnect consumers may receive older events again and must use durable deduplication/business checkpoints. Native Core byte consumption is tested; AMQP/JMS consumer variants still need their own interoperability acceptance.

The service binds the broker's persistent node ID and queue ID in the journal after preparation. Missing initialized queues, changed incarnations, wrong ownership or unsafe queue shape block before publication receipts advance. Preparation can finish an interrupted empty reserved queue; initialized resources are not replaced. The identity is rechecked around publication. After each confirmed batch, the journal also saves `ARTEMIS_RECORD_V1` with physical queue, native message ID, event ID and a length-prefixed event/body SHA-256. Before resuming or sending another batch, a filtered Core browser checks that exact persistent record and content. Missing/changed history blocks even when a restored older nonempty backup retains the same node/queue IDs. This checks the last saved confirmation, not every earlier record or downstream business checkpoint. Existing publications without a native receipt require an explicit migration/rebuild plan; never clear metadata to continue. An empty initialized replacement is rejected without writing a new ownership message.

**Why does ACK retain history?** This profile intentionally keeps the publication log. Plan disk capacity, consumer archival and an explicit rebuild/retention workflow; normal consumer ACK does not reclaim this queue. **Can I use an ordinary destructive queue?** No; it fails profile validation. **Can I point this at ActiveMQ Classic?** No; Classic has a distinct protocol/profile and is not implemented by this adapter. **Why did Check fail with permissions?** In addition to data access, Core management needs its temporary reply-channel grants. The response does not expose credentials or message contents.

`target/artemis-transport-volume-fixed.log` passed Java 8 client/current-broker publication, exact bytes/key/channel, non-destructive consumer ACK, broker/client restart with stable identities, unsafe queue refusal and missing initialized queue protection. Its first failed log concerned isolated data-volume permissions, not protocol acceptance. `target/artemis-wiring-unit.log` passed 44 core executions; `target/ui-artemis-fixed.log` passed 17 DOM cases after fixing a product-switch credential visibility bug. Earlier seven-message-product runs failed (timeouts); the later focused case passed as separately recorded below. Cluster, paging-pressure, TLS, power-loss and broader version/security acceptance remain pending. [Management API](https://artemis.apache.org/components/artemis/documentation/latest/management.html), [persistence](https://artemis.apache.org/components/artemis/documentation/latest/persistence), [address settings](https://artemis.apache.org/components/artemis/documentation/latest/address-settings.html).

`target/artemis-native-progress-final.log` passed against the actual release JAR: snapshot the stopped isolated broker volume after one confirmed record, publish a later record, restore the older nonempty volume, prove node/queue IDs are unchanged, and reject the later receipt. Matching receipts resume; altered digests, malformed receipts and empty replacement queues are rejected. The empty replacement remains empty. `target/ui-artemis-native-progress.log` passed 17 DOM cases. Seven-product mixed recovery is being rerun separately after a previous run recorded source/HTTP timeouts during host sleep. These results do not prove cluster, TLS, paging pressure or power-loss behavior.

### Shared-store primary and backup

Configure one stable TCP entry for the active member of the same shared-store pair. Share the bindings, message journal, paging and large-message directories. Route new connections only to the active Core broker. The publisher still uses one `artemis://` endpoint and the retained queue identity. [Artemis shared-store HA](https://artemis.apache.org/components/artemis/documentation/latest/ha)

The Artemis 2.57.0 fixture uses two processes, one local named volume and a stable loopback entry. The standby activated after primary SIGKILL. The publisher kept the previous confirmation while the entry was isolated. After rerouting, it verified the native receipt, broker and queue identity and confirmed the same pending event. Ordinary consumer ACK left both events in the retained queue. Validate storage failure domains, broker TLS, automatic failback and capacity in the deployment. [Native evidence](/docs/zh/evidence/baseline.html#artemis-shared-store-primary-and-backup)

## Admin retry diagnostics and focused recovery reruns

`PULSAR_ADMIN_TIMEOUT` means a client-side admin timeout; `PULSAR_ADMIN_CONNECT_RETRY` means a failed connection. The SDK can wrap either in an exception whose default status is 500, without receiving an HTTP 500 response. Check broker access logs before diagnosing a server error. `PULSAR_ADMIN_REQUEST_FAILED` preserves an ambiguous generic SDK failure without inventing an HTTP response. Actual HTTP response failures retain their status codes. Credential-provider/TLS rejections are permanent configuration faults; this classification does not constitute TLS interoperability acceptance.

Snapshot preparation now emits deduplicated retry diagnostics with exception classes and stack locations, excluding exception messages, credentials, SQL and rows. A transient network fault retains RUNNING and the existing error generation; no manual resume should be needed. Inspect host/VM load, heap/direct memory, broker readiness, network and configured request timeouts rather than assuming a hardware-independent startup/catch-up deadline.

After a full build, a focused fault rerun can reuse the accepted release and compiled tests:

```bash
RIVOMESH_TEST_PREBUILT=1 bash tests/messaging-run.sh
```

The checker refuses changed Java sources, stale tests/assets or an invalid release, and verifies the pinned Java-8-compatible JUnit console checksum. This runs **one pipeline case**, not the full 54-execution Maven suite. Default invocation still builds and runs the wider suite. Failed runs retain full Pulsar logs and bounded other-broker logs under `target/broker-tests/<project>/`; cleanup affects only that test project. Optional `RIVOMESH_TEST_JAVA_OPTIONS` supplies JVM diagnostic flags to the isolated test and worker processes, for example `-Xlog:gc` on Temurin 21. It is a test setting, not a production sizing recommendation.

Archived focused acceptance `target/messaging-pulsar-gc-diagnostics.log`: **one real pipeline case passed, zero failed/skipped**, on the actual Java 8 release JAR (256 MiB worker heap). PostgreSQL plus Kafka/RabbitMQ/NATS/Redis/Pulsar/RocketMQ/Artemis complete snapshot/CDC, worker kill and three all-message-broker stop/start rounds; SQL continues during broker outage, retry diagnostics persist and clear automatically after catch-up. Finally deleting Artemis's initialized queue pauses only that target while all other subscriptions catch up. Native receipts restore through restart. This took about 590 seconds on the busy shared host, with Java 8 GC diagnostics enabled; no heap/deadline increase was used. It is one focused case, not a fresh pass of the entire 54-execution Maven suite, nor a general capacity/recovery-time promise.
