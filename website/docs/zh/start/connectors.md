---
kind: docs
locale: zh
title: 连接器目录
---

# 数据源与同步目标

选择之前，先确认“采集源”还是“接收目标”，再核对状态和专门手册。本目录直接读取核心源码的能力登记，源和目标分别显示，信创数据库目标优先列出。

信创改造可从 openGauss、达梦、金仓、GBase 8c 与 OceanBase 的指定适配范围开始，操作步骤见[信创数据库适配与改造](xinchuang)。主要采集源为 MySQL。[PostgreSQL](../reference/postgresql-source) 和 [Oracle](../reference/oracle-source) 已有实验性采集档案，可按实际版本、日志条件和目标组合试用。

<ConnectorCatalog />

## 投递语义

事务型数据库通过本地事务保存业务结果与断点；分析目标按物化与回执协议工作；消息目标为确认后的至少一次投递。多目标独立确认，消费者仍需按消息协议去重。

完整边界见[兼容性说明](compatibility)和各连接器手册。

## 控制台中的连接器能力

<ScreenshotPreview name="connector-catalog" locale="zh" alt="RivoMesh 中文控制台的连接器能力目录。" />
