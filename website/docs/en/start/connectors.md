---
kind: docs
locale: en
title: Connector catalog
---

# Sources and targets

Check the direction, status and exact product profile before selecting a connector. MySQL is the primary capture source. [PostgreSQL](../reference/postgresql-source) and [Oracle](../reference/oracle-source) provide experimental capture profiles.

<ConnectorCatalog />

Relational, analytical and messaging targets have different acknowledgement and recovery protocols. Multiple targets acknowledge independently; messaging consumers still need protocol-level deduplication.

## Connector capabilities in the console

<ScreenshotPreview name="connector-catalog" locale="en" alt="Connector capabilities in the RivoMesh English-language console." />
