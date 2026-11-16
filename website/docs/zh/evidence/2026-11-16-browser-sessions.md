---
kind: docs
locale: zh
title: "11-16-browser-sessions · RM-SDD-001：浏览器会话验收 / Browser-session acceptance"
sourcePath: docs/verification/2026-11-16-browser-sessions/README.md
---

# RM-SDD-001：浏览器会话验收 / Browser-session acceptance

2026-11-16 · SE-01/02/03/05 · 单控制器 / single controller

候选包 / Candidate SHA256: `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3`。
包字节数 / Bytes: 187760292。
冻结副本 / Frozen local copy: `target/release-evidence/browser-sessions-final.jar`。

| 验证 / Check | 结果 / Result | 证据 / Evidence |
|---|---|---|
| Java8根构建 / root Maven build | 215 = 213应用 + 2 Classic SDK；0失败/错误/跳过 | [root-build.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/root-build.log) |
| 制品优先应用测试 / actual-JAR-first app tests | 213通过；0失败/跳过 | [release-app-unit.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/release-app-unit.log) |
| DOM | 58通过；含刷新、新标签页、跨标签页退出、迟到响应、旧刷新锁、身份切换清理及自身令牌轮换 | [ui.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/ui.log) |
| 五JDK会话专项 / five JRE session profiles | Java8/11/17/21/25各8项，共40项通过 | [manifest](/files/docs/verification/2026-11-16-browser-sessions/runtime-manifest.json), [runtime.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/runtime.log) |
| 实际TLS代理 / real TLS proxy | HTTPS签发和发送Cookie、HTTP不发送Secure凭证、Origin/CSRF拒绝、退出后重放拒绝、Bearer兼容、私有状态无认证明文 | [tls.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/tls.log) |
| 制品门禁 / artifact gate | Java8类级别、七个UI资源及驱动/SDK完整性通过 | [artifact.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/artifact.log) |
| Helm及原生YAML / deployment | 默认/RBAC/任务授权/MANAGED一致性、会话参数和非法期限/容量拒绝通过 | [deployment.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/deployment.log) |
| Docker预览 / development preview | 健康、权限、七个最新源UI及同SHA驱动包通过；地址不变 | [preview.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/preview.log), [update](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/preview-update.log) |

单JDK日志 / Per-JRE: [Java8](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/java8.log), [Java11](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/java11.log), [Java17](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/java17.log), [Java21](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/java21.log), [Java25](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/java25.log)。实际版本、镜像ID和架构见日志及manifest。

可复现命令 / Reproduction:

```bash
npm --prefix tests/ui test
python3 tests/verify-artifact.py
python3 tests/browser-sessions-tls.py
python3 tests/browser-sessions-runtime.py
python3 tests/deployment-check.py
python3 tests/development-preview-check.py
python3 tests/sdd-check.py
```

完整根构建和制品优先JUnit启动参数见 [commands.md](/docs/zh/evidence/2026-11-16-browser-sessions-commands.html)；后者按候选JAR在测试类之前的class path运行，不使用target/classes替代候选实现。TLS脚本创建隔离控制器/临时证书和代理，结束清理自身容器与临时目录，不修改预览账号和任务。JDK专项使用同一候选JAR及编译为Java8的测试类。

会话存储当前为有界内存：刷新/新页面可恢复；控制器重启后失效。严格目录修订策略使任何账号修改撤销全部旧浏览器会话。自身令牌轮换可用已保存新令牌换取全新会话。默认生产Secure Cookie，HTTP预览显式覆盖；不把长期令牌保存到Web Storage。

边界 / Limits: this is a single-controller session acceptance. SE-04/shared control authority,full source/target/JDK/TLS-driver matrices,real-browser visual/accessibility and live Kubernetes/CSI remain open. This increment does not reaccept all historical connector recovery profiles. 本轮不表示全局多节点、手工跳过/补数据、PG/Oracle源或全连接器兼容已完成。

SDD闭环与TODO原始哈希另见 [sdd.log](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-browser-sessions/sdd.log)；原TODO内容保持不变。归档不含真实凭据、Cookie、业务数据或私有H2库；工作目录前缀已替换为[workspace]。
