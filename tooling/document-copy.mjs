// Website wording updates tied to newer manuals in the same source snapshot.
// Do not rewrite evidence, configuration keys, commands, or persisted format identifiers.
export function documentCopy(meta, raw) {
  let text = raw
  if (meta.locale === 'zh' && meta.group !== 'evidence') text = text.replaceAll('服务政企信创迁移', '服务信创迁移').replaceAll('Rivomesh 面向政企的数据库迁移', 'RivoMesh 支持信创改造中的数据库迁移').replaceAll('政企迁移目标', '信创改造目标')
  if (meta.sourcePath.endsWith('/pipeline-v3.md')) {
    const replacements = meta.locale === 'zh' ? [
      ['English: [V3 pipelines]', 'English: [Multi-database pipelines]'],
      ['V3 可从 CLI 或 Web 运行；向导默认 v3，也保留 v2 单库单目标配置。两种格式和管理表隔离，尚未自动迁移旧任务。', '可从 CLI 或 Web 运行，向导默认使用多库、多目标任务格式，并保留旧的单库单目标任务格式。两种格式和管理表隔离，尚未自动迁移旧任务。'],
      ['使用默认 V3，', '保留默认任务格式，'],
      ['手工补数/跳过、行级校验修复及自动切换工作台仍待完成。', '管理界面的逐行校验与计划修复已提供 MySQL / PostgreSQL 首批验证，见[数据核对流程](../start/data-validation.md)；手工补数/跳过及自动切换工作台仍待完成。'],
      ['行级对账、修复及界面/接管工作流仍待完成。', '行级校验与计划修复的当前范围见[管理界面校验](managed-validation.md)和[管理界面修复](managed-repair.md)，业务接管工作流仍待完成。'],
      ['手工补数/跳过、行级校验修复、切换回退及其 Web 操作仍在实现范围内。', '行级校验与计划修复按专门手册的限定范围使用；手工补数/跳过、切换回退及其 Web 工作流仍待完成。']
    ] : [
      ['# multi-database, multi-target pipelines', '# Multi-database, multi-target pipelines'],
      ['[V3 运行手册]', '[多库、多目标运行手册]'],
      ['V3 runs through the CLI and Web console. The wizard defaults to v3 and retains v2 single-database tasks. Formats/metadata are isolated; automatic v2 state migration is not implemented.', 'Pipelines run through the CLI and Web console. The wizard defaults to the multi-database, multi-target format and retains the older single-database format. Formats/metadata are isolated; automatic migration of old state is not implemented.'],
      ['Keep V3 selected,', 'Keep the default task format,'],
      ['Manual repair/skip, row reconciliation and automated cutover remain unfinished.', 'Managed row validation and planned repair have initial MySQL/PostgreSQL acceptance; see [validation](managed-validation.md) and [repair](managed-repair.md). Manual patch/skip and automated cutover remain unfinished.'],
      ['Row comparison/repair, UI and cutover workflows remain pending.', 'Managed row comparison and planned repair are covered by the [validation](managed-validation.md) and [repair](managed-repair.md) manuals; business cutover remains pending.'],
      ['Manual repair/skip, row reconciliation, cutover/failback and their Web workflows remain in scope.', 'Managed validation/repair use the dedicated manuals and their limited acceptance profile. Manual patch/skip, cutover/failback and their Web workflows remain unfinished.']
    ]
    for (const [from, to] of replacements) text = text.replaceAll(from, to)
    // Authored website pages do not exist in the core checkout; resolve directly.
    text = text.replaceAll('../start/data-validation.md', '/docs/zh/start/data-validation.html')
  }
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
  return text
}
