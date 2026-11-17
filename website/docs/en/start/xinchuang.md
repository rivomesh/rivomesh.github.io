---
kind: docs
locale: en
title: Domestic database adaptation
---

# Domestic database adaptation

RivoMesh can copy existing MySQL data and subsequent changes into an independent domestic database environment for Xinchuang adaptation, parallel validation and migration preparation.

| Target | Current profile |
| --- | --- |
| openGauss / GaussDB | openGauss 7.0.0-RC3 partially verified; commercial/distributed GaussDB requires separate verification |
| DM | Experimental DM8 UTF8 profile with snapshot, CDC and recovery records |
| Kingbase | Experimental V9 PG/UTF8 profile with snapshot, CDC and recovery records |
| GBase 8c | Experimental PG/UTF8 profile; 8a and 8s remain separately planned |
| OceanBase | Experimental MySQL-mode tenant; full mixed recovery acceptance remains incomplete |

See the [connector catalog](connectors) for product manuals and exact boundaries. These are target adapters, not capture sources or vendor certification.

Start with an empty target and representative business tables. Validate Chinese text, NULL/empty strings, temporal precision, decimal values, JSON, keyless duplicates, generated columns and index/constraint conversions. Rehearse outages and restart recovery. Application SQL compatibility, constraints, write cutover and rollback need their own plan. Managed row-level validation and repair currently have a MySQL/PostgreSQL acceptance profile.

## Source expansion

MySQL is the implemented capture source. PostgreSQL and Oracle sources are planned and are not currently runnable. The source adapter interface allows additional database types to be added with their own snapshot, transaction-log and recovery-position semantics. Other products, including domestic database sources, require separate implementation and acceptance; no delivery date is promised.

[Multi-node deployment](multi-node) · [Compatibility](compatibility) · [Roadmap](roadmap) · [Platform design](../reference/platform-design)
