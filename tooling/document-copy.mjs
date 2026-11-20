// Website wording updates tied to newer manuals in the same source snapshot.
// Do not rewrite evidence, configuration keys, commands, or persisted format identifiers.
export function documentCopy(meta, raw) {
  // Execution notes are archived outside the published site. Keep this route as a technical index.
  if (meta.sourcePath === 'docs/development-v3.md') return `# 历史实现参考

早期实现涉及的同步协议、恢复机制和验证范围，可通过以下文档继续查阅。当前可用能力请以[使用指南](/docs/zh/start/index.html)与[当前实施状态](/docs/zh/reference/implementation-status.html)为准。

## 同步与恢复

- [多库、多目标同步配置](/docs/zh/reference/pipeline-v3.html)
- [恢复与一致性](/docs/zh/reference/recovery.html)
- [消息目标与投递协议](/docs/zh/reference/messaging-v3.html)
- [数据校验与修复](/docs/zh/start/data-validation.html)

## 部署与验证

- [多节点部署与恢复](/docs/zh/start/multi-node.html)
- [兼容性与能力边界](/docs/zh/start/compatibility.html)
- [验证记录汇总](/docs/zh/reference/validation.html)
- [性能与运行时记录](/docs/zh/reference/performance.html)
`

  let text = raw
  if (meta.sourcePath.endsWith('/implementation-status.md')) {
    text = text
      .replace(/^(?:The SDD contains the current totals and requirements\. |进度总数和逐项状态以 SDD 为准。)/gm, '')
      .replace(/^\| DO-01 \|.*\n/gm, '')
      .replace(/^\[(?:Complete task list|完整任务清单)\].*\n\n/gm, '')
      .replace(/^.*\[progress-reports\.json\].*\n?/gm, '').trimEnd() + '\n'
  }
  if (meta.sourcePath.endsWith('/browser-sessions.md')) {
    text = text
      .replace(/ Specification: RM-SDD-001.*|规格：RM-SDD-001.*/g, '')
      .replace(/^A Store interface.*$/m, 'Standalone uses a bounded in-memory session store and requires sign-in after restart. Multiple Controllers can keep sessions with the configured [shared access store](shared-access.md).')
      .replace(/^会话存储有 Store 接口.*$/m, '单机模式使用有界内存会话存储，重启 Controller 后需重新登录。多 Controller 可通过[共享访问存储](shared-access.md)保持会话。')
  }
  if (meta.sourcePath.endsWith('/node-registry.md')) {
    text = text
      .replace(/ This feature shares observations;.*$/m, ' See [global task control](global-control.md) and [shared access](shared-access.md) for the corresponding deployment requirements.')
      .replace(/本页描述共享节点观察.*$/m, '[全局任务控制](global-control.md)和[共享访问](shared-access.md)各有独立部署条件。')
  }
  if (meta.sourcePath.endsWith('/validation.md')) {
    text = text.replace(/ · \[SDD验收\]\((?:\.\.\/)?sdd\/[^)]+\)/g, '')
  }
  if (meta.sourcePath.endsWith('/release-inventory.md')) {
    text = text.replace('SDD status and evidence, local links', 'acceptance evidence, local links').replace('SDD 状态与证据、文档链接', '验收证据、文档链接')
  }
  if (meta.locale === 'zh' && meta.group !== 'evidence') text = text.replaceAll('服务政企信创迁移', '服务信创迁移').replaceAll('Rivomesh 面向政企的数据库迁移', 'RivoMesh 支持信创改造中的数据库迁移').replaceAll('政企迁移目标', '信创改造目标')
  if (/\/(pipeline-v3|console-and-deployment)\.md$/.test(meta.sourcePath)) {
    // These manuals predate the bounded SQL recovery acceptance. Keep commands and evidence verbatim.
    const zh = meta.locale === 'zh'
    const recovery = zh
      ? 'PostgreSQL / MySQL 指定事务型目标已提供[提交确认](commit-acknowledgement.md)、[事务跳过](transaction-skip.md)、[缺口复核](gap-verification.md)、[补偿](transaction-compensation.md)和[手工修正](manual-correction.md)。按[首版部署基线](first-release.md)启用对应能力。业务切换需独立规划。'
      : 'Transactional PostgreSQL and MySQL have scoped profiles for [commit confirmation](commit-acknowledgement.md), [transaction skipping](transaction-skip.md), [gap verification](gap-verification.md), [compensation](transaction-compensation.md) and [manual correction](manual-correction.md). Configure the corresponding gates in the [first-release baseline](first-release.md). Plan business cutover separately.'
    const recoveryParagraph = zh
      ? /(?:已提供逐行校验和共同暂停点的审阅修复；失败事务手工补丁\/跳过、映射迁移和业务切换向导仍未完成。|独立手工补数\/跳过和自动切换工作台仍待完成。|手工补数\/跳过、行级校验修复、切换回退及其 Web 操作仍在实现范围内。|手工跳过、补偿和缺口台账仍未完成。)/g
      : /(?:Row validation and reviewed repairs at a common paused cut are available; failed-transaction patches\/skips, mapping migration and business cutover remain open\.|independent corrective entry\/skip and automated cutover remain open\.|Manual repair\/skip, row reconciliation, cutover\/failback and their Web workflows remain in scope\.|manual skip,compensation and gaps remain open\.)/g
    let reused = false
    text = text.replace(recoveryParagraph, (match) => {
      const open = match.startsWith('Row validation') ? 'Row validation and reviewed repairs at a common paused cut are available. '
        : match.startsWith('已提供逐行') ? '已提供逐行校验和共同暂停点的审阅修复。' : ''
      if (reused) return open + (zh ? '限定恢复档案见[当前实施状态](implementation-status.md)。' : 'See [implementation status](implementation-status.md) for scoped recovery.')
      reused = true
      return open + recovery
    })
    text = text
      .replace('have explicit accepted profiles;', 'have explicit accepted profiles. ')
      .replace('Default legacy profiles do not upgrade automatically;', 'Default legacy profiles do not upgrade automatically. ')
      .replace('Row comparison/repair, UI and cutover workflows remain pending.', 'See [managed validation](managed-validation.md) and [reviewed repair](managed-repair.md) for the initial SQL profiles. Business cutover remains open.')
      .replace('UI configuration editing remains pending.', 'See [configuration revisions](configuration-editor.md) for supported console changes.')
      .replace('行级对账、修复及界面/接管工作流仍待完成。', '行级校验与审阅修复见[管理界面校验](managed-validation.md)和[管理界面修复](managed-repair.md)，业务接管需另行规划。')
    if (meta.sourcePath.endsWith('/console-and-deployment.md')) {
      text = text.replace(/^.*(?:The wizard supports Gauss|向导提供 Gauss).*$/m, zh
        ? '各任务以隔离 JVM 运行，可限制堆内存和并发。多库多目标向导可配置关系数据库、分析系统和八种消息目标，并支持本地或外部日志。各产品的版本与验证范围见[连接器目录](/docs/zh/start/connectors.html)。旧单库单目标任务格式仍可运行。'
        : 'Independent tasks run in isolated JVMs with bounded heap and concurrency. The multi-database wizard configures relational, analytical and eight messaging destinations plus local or external journals. See the [connector catalog](/docs/en/start/connectors.html) for product profiles. Legacy single-target tasks remain supported.')
        .replace('Process probes without database side effects or authentication','Unauthenticated process probes. Readiness returns 503 if configured control services are unavailable.')
    }
  }
  // These guide sentences predate the recovery operations accepted in RC-03 and RC-05–08.
  const recentRecovery = {
    'transaction-skip': [
      ['RC-08 verified gap closure remains open.', 'RC-08 has bounded [data-gap verification](gap-verification.md) acceptance.'],
      ['RC-08验证关闭缺口仍未完成。', 'RC-08 已验收指定 SQL 档案的[数据缺口复核](gap-verification.md)。']
    ],
    'commit-acknowledgement': [
      ['Skipping,before-image compensation,manual data correction and gap ledgers remain separate unfinished features.', 'Use the separate guides for [skipping](transaction-skip.md), [compensation](transaction-compensation.md), [row correction](manual-correction.md) and [gap verification](gap-verification.md).'],
      ['跳过、前镜像补偿、手工补数据和缺口台账是其他尚未完成的功能。', '[跳过](transaction-skip.md)、[补偿](transaction-compensation.md)、[手工修正](manual-correction.md)及[缺口复核](gap-verification.md)各有独立流程。']
    ],
    'failure-review': [
      ['Editing/skipping,native SKIP/compensation receipts and gap tracking remain open.', 'Administrators can use separate reviewed operations for [whole-transaction skip](transaction-skip.md), [compensation](transaction-compensation.md) and [target corrections](manual-correction.md).'],
      ['跳过和补偿仍未实现。', '指定 SQL 目标可通过独立审批执行[事务跳过](transaction-skip.md)或[补偿](transaction-compensation.md)。'],
      ['修改/跳过、原生 SKIP/补偿凭据及缺口台账仍待实现。', '指定 SQL 目标的[跳过](transaction-skip.md)、[补偿](transaction-compensation.md)和[目标行修正](manual-correction.md)需要单独审批。']
    ],
    'managed-validation': [
      ['Manual skip, constraint rebuilding and cutover remain open.', 'Constraint rebuilding and business cutover remain open. Consult [transaction skipping](transaction-skip.md) for its separate SQL recovery profile.'],
      ['手工跳过、约束重建或业务切换仍未完成。', '约束重建与业务切换待实现。[事务跳过](transaction-skip.md)有独立的 SQL 恢复档案。']
    ],
    'managed-repair': [
      ['Failed-transaction before-image compensation,manual skip/consistency gaps,nonempty adoption,constraint restoration and cutover are separate pending workflows.', 'For a failed transaction, see [compensation](transaction-compensation.md) or [reviewed skip](transaction-skip.md). Nonempty adoption, constraint restoration and cutover remain open.'],
      ['失败事务前镜像补偿、手工跳过、一致性缺口、非空接管、约束恢复和切换仍属于后续工作。', '失败事务可以按对应条件使用[前镜像补偿](transaction-compensation.md)或[审阅跳过](transaction-skip.md)。非空接管、约束恢复和业务切换仍待实现。']
    ],
    'reconciliation-workflow': [
      ['failed-transaction compensation and cutover remain pending.', 'see [transaction compensation](transaction-compensation.md) for the separate SQL workflow. Business cutover remains open.'],
      ['其他补偿模式和业务切换尚未完成。', '失败事务另有[补偿手册](transaction-compensation.md)，业务切换仍待完成。'],
      ['失败事务补偿或业务切换仍未完成。', '失败事务补偿见[独立手册](transaction-compensation.md)，业务切换仍待完成。']
    ],
    'rename-migration': [
      ['Transaction-skip UI integration and the full compatibility matrix remain open in SDD.', 'See [implementation status](implementation-status.md) for current recovery evidence and outstanding compatibility profiles.'],
      ['待开发的事务跳过界面及完整兼容矩阵仍按 SDD 跟踪，不因本次更名变为已完成。', '当前恢复验收与待验证环境见[实施状态](implementation-status.md)。']
    ],
    'recovery': [
      ['manual repair/skip, v2-to-v3 migration and automated business cutover remain unfinished.', 'current-format transactional SQL targets have separate [reviewed recovery](failure-review.md) profiles. Configuration-format migration and automated business cutover remain open.']
    ]
  }
  const stem = meta.sourcePath.split('/').at(-1).replace(/\.md$/, '')
  for (const [from, to] of recentRecovery[stem] || []) text = text.replace(from, to)
  if (meta.sourcePath.endsWith('/global-control.md')) {
    text=text.replace('控制器关闭目前仍会停止其 Worker，独立执行生命周期、自动迁移、排空、调度和旧 Worker 隔离属于 CP-04/07。','默认组合模式的控制器退出仍会停止本机 Worker。显式管理/Agent 分离的已验收范围见[独立执行生命周期](execution-lifecycle.md)；自动迁移、排空、调度和跨 Agent 隔离仍单独推进。')
    text=text.replace('下一阶段按[独立执行生命周期合同](../sdd/001-control-recovery-compatibility/design-execution-lifecycle.md)实现；该合同尚未完成，不能把管理实例退出时Worker仍可独立运行写成现有能力。','显式管理/Agent 分离的指定档案已经验收，见[独立执行生命周期](execution-lifecycle.md)。默认组合模式仍耦合，不能将分离档案的结果套用到全部部署。')
    text=text.replace('Controller shutdown still stops its Workers. Independent execution, relocation, drain, scheduling and stale-Worker fencing remain CP-04/07.','Default combined controllers stop their local Workers on exit. The explicit separated profile is covered by [execution lifecycle](execution-lifecycle.md); relocation, drain, scheduling and cross-Agent fencing remain separate work.')
    text=text.replace('Next implementation follows the [independent execution lifecycle contract](../sdd/001-control-recovery-compatibility/design-execution-lifecycle.en.md).It is not complete; independent Worker survival after management exit is not a current capability.','The explicit controller/Agent profile now has scoped acceptance; see [execution lifecycle](execution-lifecycle.md). Default combined deployment remains coupled, and additional profiles need independent verification.')
  }
  if (meta.sourcePath.endsWith('/node-registry.md')) {
    text=text.replace('目前任务页和所有操作仍是本机。','默认任务页和操作针对本机；可选固定执行节点全局模式见[全局控制手册](global-control.md)。').replace('Task pages/actions remain local.','Task pages/actions are local by default; optional fixed-owner routing is described in [global control](global-control.md).').replace('Remote commands, data/secret/report reachability, shared permissions/audit and controller HA require later acceptance.','Shared access, global commands and explicit separated execution have distinct profiles; see [global control](global-control.md) and [execution lifecycle](execution-lifecycle.md) for current acceptance.').replace('跨节点命令、配置/密钥/报告可达性、全局权限/审计与控制器HA另行验收。','跨节点命令与共享资源的当前边界见[全局控制](global-control.md)，显式管理/执行分离见[独立执行生命周期](execution-lifecycle.md)。')
    if (meta.locale === 'zh') {
      text = text.replace('本页描述共享节点观察，任务配置/命令、账号、审计和浏览器会话当前仍由各自控制器管理；全局远端控制及接管尚未完成。', '本页描述共享节点观察。账号、会话与审计可显式启用[共享访问](shared-access.md)；默认任务页和操作针对本机；可选固定执行节点的[全局模式](global-control.md)已接入 HTTP 与管理界面，显式管理与 Agent 分离已有首批验收，自动跨 Agent 接管及其他高可用档案需另验。')
      text = text.replace('各节点账号及会话尚不共享，不应把多个入口放到无会话连续性方案的统一负载均衡后声称已完成HA。', '仅启用节点目录时，各节点账号及会话仍独立；需要统一身份和会话连续性时，按[共享访问](shared-access.md)部署。共享访问本身不等于控制面高可用。')
      text = text.replace('当前共享目录只含观察，不能只恢复它就恢复任务', '节点目录只含观察；启用共享访问后还需备份共享账号、会话与审计，不能只恢复节点目录就恢复任务')
      text = text.replace(/开发预览将提供两个入口读取同一目录：[\s\S]*$/, '双入口的部署与验证方式见[共享访问](shared-access.md)及当前[实施状态](implementation-status.md)。历史测试地址不代表有常驻预览服务。\n')
    } else {
      text = text.replace('This feature shares observations; task/configuration commands, accounts, audit and browser sessions remain controller-local. Global remote control/failover are unfinished.', 'This feature shares node observations. Accounts, sessions and audit can be shared by explicitly enabling [shared access](shared-access.md); task/configuration operations are local by default. Optional fixed-owner [global control](global-control.md) is integrated; explicit controller/Agent separation has initial acceptance, while automatic relocation and additional failover profiles remain open.')
      text = text.replace('Accounts/sessions are not shared; load balancing independent controllers is not controller HA.', 'Registry-only accounts/sessions remain local. Enable [shared access](shared-access.md) for shared identity/session continuity; this does not provide controller HA.')
      text = text.replace(/^(# .+)$/m, '$1\n\nFor current deployment, see the [multi-node guide](/docs/en/start/multi-node.html). Accounts, sessions and audit can now be shared by explicitly enabling [shared access](shared-access.md). Registry-only installations keep them local. Task operations are local by default. Optional fixed-owner [global control](global-control.md) is integrated; explicit controller/Agent separation has initial acceptance, while automatic relocation and the full HA matrix remain open.')
    }
  }
  // Keep public manuals and acceptance records focused on the operating procedures.
  return text
    .replace(/Follow \[RC-05 design\]\(\.\.\/sdd\/[^)]+\)\. |实现与验收追踪见 \[RC-05 设计\]\(\.\.\/sdd\/[^)]+\)。/g, '')
    .replace(/ See \[SDD\]\(\.\.\/sdd\/[^)]+\) for acceptance progress\.|，完整验收进度见\[SDD\]\(\.\.\/sdd\/[^)]+\)/g, '')
    .replace(/ Contract: \[CP-01\]\(\.\.\/sdd\/[^)]+\)\.|设计合同：\[[^\]]+\]\(\.\.\/sdd\/[^)]+\)。/g, '')
    .replace(/\s*· \[[^\]\n]+\]\(\.\.\/sdd\/[^)]+\)|\s*\[[^\]\n]+\]\(\.\.\/sdd\/[^)]+\) · |[ 	]+\[Contract\]\(\.\.\/sdd\/[^)]+\)\./g, '')
    .replace(/and\[SDD\]\(\.\.\/sdd\/[^)]+\)|与\[SDD\]\(\.\.\/sdd\/[^)]+\)/g, '')
}
