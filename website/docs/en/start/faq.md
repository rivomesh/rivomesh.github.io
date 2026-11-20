---
kind: docs
locale: en
title: Frequently asked questions
---

# Frequently asked questions

## Where should I start?

Read the [introduction](introduction), then use the [quick start](quick-start) with a small MySQL source and an independent empty target. Database administrators should review logging, replication and snapshot privileges.

## What does V3 in the console mean?

It identifies the task configuration format, `formatVersion: 3`, for multi-database, multi-target tasks. Keep the default for new tasks; changing the number does not migrate an old task's persisted state.

## Are other capture sources available?

Yes. [PostgreSQL 17/18 logical replication](../reference/postgresql-source) and [Oracle 26ai archived capture](../reference/oracle-source) have experimental profiles. Check each source’s log, destination and recovery requirements.

## Can I start with a populated target?

Start an ordinary new task with empty business tables. For data already copied to PostgreSQL, run the [read-only adoption preview](../reference/nonempty-target-preview). The bounded single-table adoption flow requires a write freeze, reviewed plan and durable receipt.

## Does recovery skip failed transactions?

No. Fix the cause, then retry the original transaction. Reviewed data repair is a separate workflow with a documented target profile.

## Is global task control available?

Optional global mode provides shared task views and durable commands. Eligible new tasks can select an Agent automatically. Administrators can approve the transfer of a stopped task after preparing and durably freezing the original writer. See [multi-node deployment](multi-node) for the supported profiles.

## Does this website collect database credentials?

No. It is a static product/documentation site. Your actual console runs in your own deployment. Local search loads a static document index from this site.

[Feedback and contribution](/en/community.html) · [Known limitations](compatibility)
