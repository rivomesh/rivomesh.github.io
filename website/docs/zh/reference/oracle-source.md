---
kind: docs
locale: zh
title: "Oracle 源端"
sourcePath: docs/zh-CN/oracle-source.md
---

# Oracle 源、归档采集与预检

[English](/docs/en/reference/oracle-source.html)

Oracle 26ai 档案检查单一可写 CDB/PDB、归档模式、强制日志和最小补充日志、源身份及 Flashback 读取权限。归档采集到 PostgreSQL 和持久 SCN 恢复已在 ARM64 上使用 Oracle Free 23.26.4.0.0、Temurin 21 和 Oracle JDBC 23.26.4.0.0 复验。更多版本、类型、RAC 和切主继续由 SO-07 跟踪。

1. 在 Rivomesh JAR 旁提供与运行时匹配的 Oracle JDBC JAR。[Oracle JDBC 兼容矩阵](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-getting-started.html)
2. 为 CDB 根账号授予 `V_$DATABASE`、`V_$INSTANCE`、`V_$PDBS` 的读取权限，按所选 PDB 配置 `CONTAINER_DATA`。PDB 账号需要读取 `V_$PDBS` 中的自身身份，以及所选表的 `SELECT`、`FLASHBACK` 权限。[Oracle 容器数据权限](https://docs.oracle.com/en/database/oracle/oracle-database/26/dbseg/managing-commonly-and-locally-granted-privileges.html)
3. 参照[配置示例](/files/config/oracle-source-probe.yml)配置两个服务以及大写 `OWNER.TABLE` 表名。

```sh
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main probe-oracle config/oracle-source-probe.yml
```

报告包含 DBID、resetlogs SCN、PDB GUID 和共同快照 SCN。每张表都在这个 SCN 做 Flashback 读取，并显示是否有主键。遇到 `ORACLE_WRITABLE_PDB_REQUIRED` 时，检查 PDB 是否处于读写状态，以及 CDB 根账号是否可见该 PDB。遇到 `ORACLE_PDB_AUTHORITY_MISMATCH` 时，核对配置的服务和 PDB 身份。

[实库夹具](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/oracle-source-probe.py)验证有主键和无主键表、更新和删除后的历史值，以及将根服务配置为 PDB 时的拒绝行为。

追加 `--logminer` 运行原生归档验证。在同一提交 XID 看到更新前后 SQL 和无主键删除的撤销 SQL，已回滚的插入未出现在已提交集合。证据来自 LogMiner 查询。

设置 `archiveWindow.startScn` 和 `archiveWindow.endScnExclusive` 两个十进制字符串可检查指定归档区间。CDB 根账号需要读取 `V_$THREAD` 和 `V_$ARCHIVED_LOG`。检查绑定当前 resetlogs 世代和一个 redo 线程。`CATALOG_CONTIGUOUS` 表示目录里的归档段覆盖完整区间，`ORACLE_ARCHIVE_LOG_GAP` 表示至少一段缺失。恢复前保留原始区间，并用 LogMiner 验证物理日志。

设置 `archiveWindow.decodeCommitted: true` 后，预检用 LogMiner 读取已登记的归档文件。CDB 根账号额外需要 `LOGMINING`、`SYS.DBMS_LOGMNR` 执行权限和 `SYS.V_$LOGMNR_CONTENTS` 读取权限。结果包含已提交事务数、操作计数和有类型变更的 SHA-256。预检将 redo 和 undo 语句作为数据解析。目前接受支持范围内 `NUMBER(p,s)`、`VARCHAR2` 和 `DATE` 列的完整前后镜像，遇到跨区间事务、拆分语句、镜像缺失或未支持的操作及类型会拒绝。采集该区间之前，先为所选表配置相应的补充日志。

解码输出包含最后一笔事务的有类型提交坐标，包括提交 SCN 和 XID。解析器按完整事务分组，并在事务内编号事件。不同 XID 共用提交 SCN、顺序无法证明时会拒绝。实库还验证归档轮换后第二笔事务有独立提交坐标。

## V3 Oracle 到 PostgreSQL

按 [V3 样例](/files/config/oracle-source-v3.yml) 设置 `source.type: ORACLE`。首批实验档案为 ARM64 Oracle 26ai Free 23.26.4.0.0 到 PostgreSQL 17.12。显式列出大写源 OWNER 和表、目标 schema 映射及单一可写 PDB。CDB 根账号除上文归档和 LogMiner 权限外，还需读取 `V_$TRANSACTION`、`V_$PDB_INCARNATION`。每张源表启用全列补充日志。PDB 账号读取表、元数据和共同 Flashback SCN。

```sh
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main check config/oracle-source-v3.yml
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main run config/oracle-source-v3.yml
```

使用相同类路径启动拥有 Worker 的进程（组合模式使用 `serve`，分离模式使用 `agent`）。可在界面导入 V3 配置，或在新建任务选择 **V3 → Oracle**，分别填 CDB 根和 PDB 连接、PDB 名称及大写 `OWNER.TABLE` 表名。每个源 owner 显式映射到 PostgreSQL Schema，启动前在选定 Agent 上执行 **检查**。受监督的 Worker 继承所属进程类路径中的外置 Oracle 驱动。此档案支持有明确精度的 `NUMBER(p,s)`、`VARCHAR2` 和 `DATE`，覆盖有主键及无主键表。每次开始采集使用共同快照 SCN。未完成的快照可以重取 Flashback 视图，完成的快照可复用。

采集轮询已关闭的归档段。断点绑定 CDB DBID 与 resetlogs、PDB GUID、UID 和世代、已采集 SCN 及最早所需归档 SCN。快照时仍打开的事务可使最早归档位置保留在较早处，直到归档包含该事务提交后才会投递整笔。只有归档覆盖后续活跃事务采样的 SCN，才会释放更老的保留范围。按任务显示的最早 SCN 保留源归档，并按实际负载验证轮换与保留策略。

归档缺失、事件格式或顺序无法证明、未审核 DDL 会停止推进并保留原断点，可从界面查看采集恢复情况。Oracle 切主、RAC、在线 redo、原生二进制 JSON、LOB、其他生成表达式及更多目标档案另行验收。[Oracle 活跃事务](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-TRANSACTION.html) · [PDB 世代](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-PDB_INCARNATION.html)

### 归档 DDL 评审

所选 PDB 的归档 DDL 触发 `ORACLE_REDO_DDL_REQUIRES_PLAN` 后，在失败任务打开 **采集恢复**，也可以通过只读的 `GET /api/tasks/{id}/capture-recovery` 查询。报告绑定故障代次和末次持久化断点的哈希。`CURRENT_ORACLE_PDB_CATALOG_VS_JOURNAL` 对比会列出所选表的日志库结构版本、原定义摘要和当前可见定义的独立摘要，报告所支持的列名、类型、长度、可空性、列顺序和已记录主键的变化。断点准入用于核查保留的 Oracle 源能否重新读取该位置。

当前目录可能包含之后的 DDL，无法证明被阻断归档记录处的历史结构或实际 SQL。Oracle LogMiner 的多版本字典跟踪需要使用不同于当前在线目录的字典模式。当前结构超出支持范围或目录读取无法完成时，结果为 `UNAVAILABLE`，并附源端错误。所选表或已记录的元数据可能没有包含被修改对象，此时目录没有可见差异，归档仍可能有阻断记录。保留最早所需的源归档并审查替代基线。应用 Oracle DDL 或越过该归档边界须另行审批和验收。[Oracle LogMiner 字典跟踪](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html)

临时实库夹具使用 `tests/oracle-source-probe.py --logminer --pipeline --ddl-review`，并提供 Temurin 21 构件及 Oracle JDBC 驱动。夹具用同一个日志库断点分别对比第一次可见的当前结构、之后的修改，以及超出当前支持范围的结构。

如果触发停止的扫描获得一条完整、PDB 身份已核实的 `USER DDL` 或 `INTERNAL DDL` 记录，报告还会提供 `blockedArchiveEvent`。Oracle Free 26ai 实测的顶层 `USER DDL (PlSql=0 RecDep=0)` 也适用。报告包含 SCN、`RS_ID`、`SSN`、归档区间和 JDBC 所读 SQL 文本的 SHA-256。日志库在同一个采集租约事务内将事件指纹和故障代次一并记录，读取时再次核对断点摘要。后续目录查询或归档读取无法为同一故障替换记录。每个任务最多保留一条观测，新故障可用其自身代次更新存档。

旧故障、记录不完整或证据写入失败时，返回 `ORACLE_DDL_EVIDENCE_UNRECORDED`。记录损坏或绑定的断点不同，返回 `ORACLE_DDL_EVIDENCE_INVALID`。这两种结果都保留原 DDL 停止状态。指纹记录在线目录会话观察到的行。审批新增可空列仍需核实边界两侧的历史字典、完整 DML、结构差异和原断点的目标回执。为临时 DDL 评审夹具追加 `--ddl-fingerprint`，可用原归档记录核对指纹，再归档之后的 DDL 和 DML。

### 保存点和部分回滚

归档采集使用 LogMiner 的 `COMMITTED_DATA_ONLY`。Oracle Free 26ai 23.26.4.0.0 的嵌套 `SAVEPOINT` 与 `ROLLBACK TO` 夹具在未过滤归档中产生 7 条已撤销的写入和 7 条补偿记录。仅已提交模式两遍均只返回该事务的 4 条有效变更。测试覆盖同一有主键行的连续更新、撤销主键修改、撤销删除，以及重复的无主键行。[Oracle LogMiner](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html) · [Oracle 重做记录字段](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-LOGMNR_CONTENTS.html)

此验收限于单 Oracle 实例、已关闭归档和受测的标量列。如果所选记录仍带回滚标记，采集可能在 `SOURCE_DECODE` 阶段报 `ORACLE_REDO_PARTIAL_ROLLBACK_UNSUPPORTED` 并停止推进。与 DBA 检查采集状态，保留持久化 SCN、最早所需归档位置和日志库。目标跳过和补数据功能适用于已经入日志库的事务。源端解码失败需排查源端，或审核后按新快照基线重建。

提供用 Temurin 21 运行的 JAR 和 Oracle JDBC 驱动，执行 `tests/oracle-source-probe.py --logminer --savepoint-evidence` 可复现归档和 Flashback 对比。追加 `--pipeline --savepoint-pipeline` 可验证独立数据和元数据 Schema 的两个 PostgreSQL 订阅，并核查强制终止 Controller 和 Worker 后的原快照和目标回执。

### BLOB 与 CLOB 预检

所选 Oracle 表含 `BLOB` 或 `CLOB` 时，预检通过 `ALL_LOBS` 识别存储方式并拒绝归档采集。`ORACLE_SECUREFILES_LOB_UNDO_UNAVAILABLE` 对应 SecureFiles，LogMiner 缺少该 LOB 的撤销 SQL。`ORACLE_BASICFILES_LOB_REQUIRES_PROFILE` 对应 BasicFiles，完整镜像与重放仍需单独验证。`ORACLE_LOB_STORAGE_UNPROVEN` 表示 LOB 已分区或读取账号无法确认其存储方式。[Oracle LogMiner 数据类型与 SecureFiles](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html) · [Oracle ALL_LOBS](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/ALL_LOBS.html)

Oracle Free 26ai 23.26.4.0.0 的实测覆盖 BasicFiles 和 SecureFiles 的 BLOB、CLOB，Flashback 均读到原始非空值。四张表的 12 次短值更新，撤销 SQL 都显示 `PAYLOAD = NULL`，其中实际前值明确非 NULL。对长度为 5000 的值分别局部改写两个字节或字符后，日志出现状态为 2 的 `SEL_LOB_LOCATOR` 和 `LOB_WRITE`，且缺少撤销 SQL。两遍读取同一区间的归档均得到 30 条记录，内容逐字节一致。用临时 Oracle 实例复现时，为测试脚本提供 JAR、Oracle JDBC 驱动并追加 `--logminer --lob-evidence --lob-preflight`。

遇到预检拒绝时，与数据库管理员核对所选 OWNER、表和 LOB 存储。排查既有任务时保留持久化 SCN 及其归档。如果必须迁移该表，安排能处理 LOB 的独立迁移流程，切换前核对内容。LOB 定位器和片段不能单独代表完整值，空 LOB 和 SQL NULL 含义不同。

### 字符类型与填充

Oracle 源档案允许按字节或字符声明长度的 `VARCHAR2`。PDB 数据库字符集为 `AL32UTF8` 时可使用 `CHAR`。同时使用 `AL16UTF16` 作为国家字符集时可使用 `NVARCHAR2` 和 `NCHAR`。这三种新支持类型在 Oracle 字典中声明的长度须在 4000 字节以内。预检遇到不符条件的字符集或声明长度，分别返回 `ORACLE_CHARACTER_CHARSET_UNSUPPORTED` 或 `ORACLE_CHARACTER_STORAGE_UNSUPPORTED`。PostgreSQL 目标以变长文本存储源值，保留 Oracle 实际填充的空格。[Oracle 字符类型](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html)

Oracle Free 26ai 23.26.4.0.0 的受测 Flashback 和归档事务保留了补充平面字符、组合码点、引号及尾随空格。空字符输入变为 SQL NULL。Oracle 的 `CHAR(8 CHAR)` 按字符填充，`NCHAR(8)` 按 UTF-16 代码单元填充。LogMiner 对国家字符行生成带转义的 `UNISTR` 字面值，列提取与 Flashback 的 60 个必要镜像一致。采集解析 Unicode 转义及配对代理项，无需执行生成的 SQL。[Oracle 空值](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html) · [Oracle UNISTR](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/UNISTR.html)

重启验收使用两个 PostgreSQL 17.12 订阅。归档插入、更新、置 SQL NULL 及有主键与无主键删除之后，两个订阅均保留原快照，并与 Oracle Flashback 逐字节一致。最后两笔事务在 Controller 和 Worker 强制终止后提交。使用 Temurin 21 和 Oracle JDBC 驱动执行 `tests/oracle-source-probe.py --logminer --character-evidence` 可复现归档与 Flashback 核对。独立的双订阅重启夹具使用 `--logminer --pipeline --character-pipeline`。

### 原生二进制 JSON

Oracle SQL `JSON` 类型存储 OSON。所选表含该类型时，Rivomesh 预检返回 `ORACLE_REDO_COLUMN_TYPE_UNSUPPORTED`。临时 Oracle Free 26ai 23.26.4.0.0 PDB 成功启用全列补充日志后，传统 LogMiner 的归档扫描返回 24 条原生 JSON 表记录，状态为 2，重做和撤销 SQL 均为 `Unsupported`。四笔事务覆盖有主键与无主键行插入、文档整体更新、路径更新和删除。每笔事务的普通 `VARCHAR2` 标记都正常解码，两遍已关闭归档的扫描结果一致。[Oracle JSON 数据类型](https://docs.oracle.com/en/database/oracle/oracle-database/26/adjsn/json-data-type.html) · [Oracle LogMiner 支持类型](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html)

PDB 本地 LogMiner 会话读到了四个普通列对照值。对于这 24 条原生 JSON 记录，前后镜像的 `COLUMN_PRESENT` 均为 0，`MINE_VALUE` 均返回 SQL NULL，表示镜像未提供。JDBC Flashback 仍可读取完整文档，通过 `OracleJsonValue` 区分 SQL NULL、JSON null，并保留日期及二进制扩展标量的类型。受测 JDBC 驱动对原生 JSON 列的 `getBytes()` 返回 UTF-8 JSON 文本。使用 Temurin 21 和 Oracle JDBC 驱动执行 `tests/oracle-source-probe.py --logminer --native-json-evidence` 可复现实验。[Oracle LogMiner 列提取](https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_LOGMNR.html) · [Oracle JDBC JSON 值类型](https://docs.oracle.com/en/database/oracle/oracle-database/26/jajdb/oracle/sql/json/OracleJsonValue.html)

### 文本 JSON 列

Oracle `VARCHAR2` 列的声明长度上限为 4000 字节时，可通过一条启用、已验证且不可延迟的列级或表级 `CHECK` 将该列映射到 PostgreSQL `jsonb`。约束直接检查单列并要求严格语法及对象键唯一。其他 `VARCHAR2` 列沿用字符串映射。[Oracle SQL/JSON 约束](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/is-json-condition.html)

```sql
CREATE TABLE RIVO_APP.DOCUMENTS (
    ID NUMBER(12) PRIMARY KEY,
    PAYLOAD VARCHAR2(1000 BYTE)
        CHECK (PAYLOAD IS JSON (STRICT WITH UNIQUE KEYS))
);
ALTER TABLE RIVO_APP.DOCUMENTS ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
```

两个修饰词写在同一对括号内。Oracle Free 23.26.4 的 `CHECK` 会以 `ORA-02252` 拒绝拆开的 `IS JSON (STRICT) WITH UNIQUE KEYS`。

Flashback 和归档采集都验证 JSON 语法、完整单个值及重复对象键。SQL `NULL` 和 JSON `null` 分别保留。PostgreSQL `jsonb` 保存值语义，输出可能改变空白、成员顺序和数值表示。若源将文本 JSON 用作主键，预检返回 `ORACLE_TEXT_JSON_PRIMARY_KEY_UNSUPPORTED`，防止源上文本不同但目标 JSON 值等价的键冲突。Oracle 或 PostgreSQL 无法表示的值通过各自的错误和恢复流程处理。[PostgreSQL JSON 类型](https://www.postgresql.org/docs/17/datatype-json.html)

为已同步的列添加或删除这类约束会改变目标列的类型映射。先审核目标结构及已有数据，再按 DDL 恢复流程恢复采集。已有 `IS JSON` 约束时，Oracle 对同一列新增第二条会返回 `ORA-40664`。审核后可在同一次结构迁移中替换原约束。[Oracle ORA-40664](https://docs.oracle.com/en/error-help/db/ora-40664/)

## Oracle DATE 到 PostgreSQL

Oracle `DATE` 映射为 PostgreSQL `timestamp(6) without time zone`，保留年月日、时分秒与 SQL `NULL`。采集专用的 Oracle 会话固定使用公历和美式英语日期。PostgreSQL 读写使用 `LocalDateTime`，Worker 的时区在夏令时跳变期间也不会移动 Oracle 保存的本地时间。既有目标表的列同样须采用 `timestamp without time zone`。[Oracle DATE 类型](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html) · [Oracle 日期格式](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Format-Models.html) · [PostgreSQL JDBC 日期及时间类型](https://jdbc.postgresql.org/documentation/query/)

此档案接受 1582-10-15 至 9999-12-31 的日期。采集识别到更早日期时，包括公元前日期，会报告 `ORACLE_DATE_VALUE_OUT_OF_RANGE`。遇到尚未支持的 LogMiner 日期格式则报告 `ORACLE_DATE_FORMAT_UNSUPPORTED`。中断后先核对源值、受影响的表和持久化位点，再重试。Oracle 的各类 `TIMESTAMP` 另行验证。

用 `tests/oracle-source-probe.py --logminer --pipeline` 和冻结 JAR、Oracle JDBC 参数复现临时实库、强杀和恢复。加入 `--text-json` 验证严格文本 JSON，加入 `--date-values` 验证 Oracle DATE，均覆盖有主键、无主键表的 Flashback、归档 CDC 和恢复。[验收记录](/docs/zh/evidence/baseline.html#oracle-archived-cdc-and-restart)

## 整数虚拟列

Oracle 26ai 任务可在向导选中 **同步受支持的整数虚拟列**，或在 V3 YAML 设置 `source.oracle.allowVirtualNumericColumns: true`。启动前先执行检查。

支持三种虚拟 `NUMBER(p,0)` 表达式。可以将一个物理整数列乘以 1 至 999 的整数常量，也可以对两个物理整数列求和或求差。操作数和结果都须明确声明精度，最大 18 位，结果精度须覆盖所有操作数的完整取值范围。例如 `AMOUNT NUMBER(12)`、`ADJUSTMENT NUMBER(12)` 和 `TOTAL NUMBER(16,0) GENERATED ALWAYS AS (AMOUNT + ADJUSTMENT) VIRTUAL`。虚拟主键、函数表达式和小数操作数需要单独支持。 [Oracle 列表达式](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Column-Expressions.html)

Worker 在全量阶段读取历史 SCN 的虚拟值并独立核对。增量阶段从归档 redo 和 undo 的物理列分别计算前后镜像。PostgreSQL 接收保存计算值的普通数值列。同一事务内多次更新和无主键重复行保留原有语义。任一操作数为 SQL NULL 时，计算结果为 SQL NULL。

在创建日志时开启此项。设置会改变源指纹。已有任务应先审阅表结构与断点迁移，再启用此功能。

以冻结应用包及 Oracle JDBC 参数运行 `tests/oracle-source-probe.py --logminer --pipeline --virtual-columns --startup-timeout 480`。实库夹具检查前后值、无主键重复行、原快照续传，以及对不支持表达式的拒绝。 [验证证据](/docs/zh/evidence/baseline.html#oracle-virtual-column-feasibility)

## Oracle 虚拟生成列可行性

Oracle Free 26ai `23.26.4.0.0` 的目录显示虚拟 `NUMBER` 表达式 `"AMOUNT"*2` 没有物理段列。在同一历史 SCN，Flashback 读取了原生成值并保留无主键重复行数量。归档 redo 和 undo 包含同一行两次更新的基础值、SQL NULL 插入和无主键删除的前镜像，生成值未出现在归档语句中。独立的 `COLUMN_PRESENT` 探测对限定列标识返回 `ORA-00904`，无法使用该函数的存在标记。该次可行性试验确认了原生归档提供的操作数。

使用已冻结的应用包和 Oracle JDBC 参数运行 `tests/oracle-source-probe.py --logminer --virtual-evidence --startup-timeout 480`。该档案在临时 Oracle 实例中运行。 [验证证据](/docs/zh/evidence/baseline.html#oracle-virtual-column-feasibility)
