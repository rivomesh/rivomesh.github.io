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
  if (meta.sourcePath.endsWith('/node-registry.md')) {
    if (meta.locale === 'zh') {
      text = text.replace('本页描述共享节点观察，任务配置/命令、账号、审计和浏览器会话当前仍由各自控制器管理；全局远端控制及接管尚未完成。', '本页描述共享节点观察。账号、会话与审计可显式启用[共享访问](shared-access.md)；任务页和操作仍针对本机，全局远端控制及控制面接管尚未完成。')
      text = text.replace('各节点账号及会话尚不共享，不应把多个入口放到无会话连续性方案的统一负载均衡后声称已完成HA。', '仅启用节点目录时，各节点账号及会话仍独立；需要统一身份和会话连续性时，按[共享访问](shared-access.md)部署。共享访问本身不等于控制面高可用。')
      text = text.replace('当前共享目录只含观察，不能只恢复它就恢复任务', '节点目录只含观察；启用共享访问后还需备份共享账号、会话与审计，不能只恢复节点目录就恢复任务')
      text = text.replace(/开发预览将提供两个入口读取同一目录：[\s\S]*$/, '双入口的部署与验证方式见[共享访问](shared-access.md)及当前[实施状态](implementation-status.md)。历史测试地址不代表有常驻预览服务。\n')
    } else {
      text = text.replace('This feature shares observations; task/configuration commands, accounts, audit and browser sessions remain controller-local. Global remote control/failover are unfinished.', 'This feature shares node observations. Accounts, sessions and audit can be shared by explicitly enabling [shared access](shared-access.md); public task/configuration operations remain local. Global remote control and control-plane failover are unfinished.')
      text = text.replace('Accounts/sessions are not shared; load balancing independent controllers is not controller HA.', 'Registry-only accounts/sessions remain local. Enable [shared access](shared-access.md) for shared identity/session continuity; this does not provide controller HA.')
      text = text.replace(/^(# .+)$/m, '$1\n\nFor current deployment, see the [multi-node guide](/docs/en/start/multi-node.html). Accounts, sessions and audit can now be shared by explicitly enabling [shared access](shared-access.md). Registry-only installations keep them local. Public task operations remain local; global task routing and control-plane HA are still being integrated.')
    }
  }
  return text
}
