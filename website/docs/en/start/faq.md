---
kind: docs
locale: en
title: Frequently asked questions
---

# Frequently asked questions

## Where should I start?

Read the [introduction](introduction), then use the [quick start](quick-start) with a small MySQL source and an independent empty target. Database administrators should review logging, replication and snapshot privileges.

## What does V3 in the console mean?

It identifies the task configuration format, `formatVersion: 3`, for multi-database, multi-target tasks. It is not a database version or a development stage you need to learn. Keep the default for new tasks; changing the number does not migrate an old task's persisted state.

## Are other capture sources available?

MySQL is implemented. PostgreSQL and Oracle sources are planned; the source adapter interface allows other database types to be added with independent log, snapshot and recovery acceptance. Support as a target does not imply source capture support.

## Can I start with a populated target?

First-use target business tables must be empty. Nonempty takeover is a separate migration concern; RivoMesh does not silently clear or merge existing business data.

## Does recovery skip failed transactions?

No. Fix the cause, then retry the original transaction. Reviewed data repair is a separate workflow with a documented target profile.

## Is global task control available?

An optional fixed-owner global mode supports shared task views, durable commands, configuration and read-only queries. Default operation is local. An explicit separated controller/Agent profile has initial acceptance. Automatic owner relocation and the full HA matrix remain open. See [multi-node deployment](multi-node).

## Does this website collect database credentials?

No. It is a static product/documentation site. Your actual console runs in your own deployment. Local search loads a static document index from this site.

[Feedback and contribution](/en/community.html) · [Known limitations](compatibility)
