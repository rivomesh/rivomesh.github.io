---
kind: docs
locale: zh
title: "首版验证基线 / Verification baseline"
sourcePath: docs/verification/README.md
---

# 首版验证基线 / First-release verification baseline

仅保留当前基线索引；开发过程中的重复源码/脚本副本、失败尝试和逐次快照已从工作树移除。Git提交历史保留追溯。操作文档见[中文实施状态](/docs/zh/reference/implementation-status.html)和[English](/docs/en/reference/implementation-status.html)。

The compact [baseline](/files/docs/verification/baseline.json) preserves the exact bounded acceptance provenance. Earlier results are not relabelled as fresh validation of cleanup changes. Current validation status is tracked in baseline.json. No production compatibility or full product matrix is implied.

| SDD | 已验收范围 / Accepted scope | 原验收产物 SHA-256 |
|---|---|---|
| CP-01 | Bounded profile | `e42cd685bcc9fb38a1e0e82819230ac58869a54f40c4417d39cd596337b91d11` |
| CP-07 | Java8 real CDC;fixed Agent;LOCAL/H2 journal;MySQL8.4 source;PostgreSQL17/MySQL8.4 targets;PostgreSQL17/MySQL8.4 control | `aa17cf5b6d9c21e302af818c5f48ff7c46bbb32d3a532ab1fa0491abe43403bf` |
| SE-01 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-02 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-03 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-04 | Bounded profile | `a1ec34fc060b4078cdaa10f357d5933f4df60f5b9616519433c851ddad69fa4a` |
| SE-05 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| RC-02 | Bounded profile | `bcaae9309898a33ecfe919d69bfa6c43227647524498f8269682df44942cbcbe` |
| RC-03 | Java8;MySQL8.4 two-database source;original fixed Agent;LOCAL/H2 journal;PostgreSQL17 business skip target;PG17/MySQL8.4 control stores;native PG/MySQL contracts;both pauses retained | `656245c6ed5d8c80c3017ed319e3802d8974f03e69f432a2ec64f0566660ac74` |
| RC-05 | Java8;MySQL8.4 source;original fixed Agent;LOCAL/H2 journal;PostgreSQL17/MySQL8.4 control stores;public real-CDC PostgreSQL confirmation;native PG/MySQL transaction contracts;whole task paused | `9f97b4d98c103e895c9d1262cd19dcd0946b21b6fc0f72fff2267e59c727de00` |

最新清理前的功能档案：Java8、MySQL8.4双库源、原Agent/LOCAL日志、PostgreSQL业务目标，PG/MySQL控制库各26项真实同步检查，PG/MySQL原生合同各34项、96 DOM及发布包51项专项。34项中含现已删除的开发版兼容探针；清理后的原生恢复回归改为32项，不能将两者相加。首次全量回归的租约过期与51项定向重跑情况在baseline.json中如实保留。

The cleaned baseline removes automatic control-mode migration and historical binary tests. Namespace mode remains fixed and mismatches refuse;lease fencing,data integrity and current recovery tests remain. V2/V3 execution consolidation is a separate pending cleanup batch.

当前公开缺口核验构建包：`3404041b03ed0a407777366056b509778f4c93e12dea0a4f14572b01670a63ce`。

- 87项扩展合同通过，最终改动后23项专项通过；重叠项不相加。
- PostgreSQL17/MySQL8.4日志及目标各54项发布包优先合同通过。
- 102项DOM重新运行通过，覆盖计划范围、摘要审批、取消、响应丢失重试、权限和退出登录。
- PG17/MySQL8.4控制库各27项真实CDC检查通过：Java8、MySQL8.4双库源、原固定Agent/LOCAL-H2日志、PostgreSQL17业务核验目标、MySQL8.4健康订阅；两管理入口审阅和重新扫描两张表，原子记录两条缺口。测试资源均清理。

RC-08首批SQL档案已验收；其他目标由RC-10/LG-03/LG-04跟踪，更广源/JDK/K8s矩阵仍未验收。[中文核验指南](/docs/zh/reference/gap-verification.html) / [English](/docs/en/reference/gap-verification.html)。

The same candidate passes bounded native and public real-CDC gap verification. Historical results above are provenance rather than fresh certification. No complete connector/source/JDK/K8s recertification is claimed.

RC-08水位收尾候选：`abee42cfb26ee3623c419f9d43d9dbe6a429508a8dd01da33da38338dcdcf372`。22项定向检查、103项DOM及PG/MySQL各58项原生合同通过。当前包复验只读水位、API/界面与原生恢复合同；未改变的审批/事务写入链路复用上面的3404041真实CDC27项/控制产品结果，不将旧结果改称本包重跑。复用理由及确切版本记录在baseline.json。

Coverage includes explicit SKIP;the contiguous SQL applied prefix stops before the first skip and is unchanged by historical verification. Broker/materializer acknowledgments have distinct semantics and never claim downstream-consumer completion. All incremental sequence fields used by this view are exact decimal strings.

RC-06 补偿候选包 `d1b1595b8efbe4a6e2258f899836fa53cf33b2c11d31f621c5fc4ca9955b67a3` 通过 32 项 Java 定向检查、104 项 DOM、PostgreSQL 17 和 MySQL 8.4 各 4 项原生检查，以及 18 项真实 CDC 检查。真实链路使用 MySQL 8.4 双库源、PostgreSQL 控制库、原 Agent 与 LOCAL/H2 日志。跨入口补偿 PostgreSQL 目标的主键冲突，恢复了三张表的四个受影响标识，再由正常 CDC 重放。MySQL 是健康对照订阅，MySQL 目标的补偿结论来自原生检查。

RC-07 手工修正候选包 `33a1d4dca6a381664855c0ae96100fa9da004a61070155b0ed7a646c6a2c4f25` 通过 39 项 Java 定向检查、107 项 DOM、PostgreSQL 17 和 MySQL 8.4 各 4 项原生检查及 18 项真实 CDC 检查。真实链路使用两个管理入口、原 Agent、LOCAL/H2 日志和 PostgreSQL 控制库。用原始 JSON 批次补回目标缺失行，按 ROW_ID 修改无主键行并删除多余行。管理员审批后显式恢复并重放原事务。任务记录只带范围和摘要。
