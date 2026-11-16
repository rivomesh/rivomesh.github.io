# 获取 RivoMesh

## 当前版本

**0.1.0-SNAPSHOT · 发布前版本**。当前网站提供文档快照与构建指引，尚未提供可验证的正式 Release 安装包、签名、校验和或公共容器镜像。请勿把示例镜像名当作已发布的镜像地址。

## 从源码构建

项目源码计划发布到 `zhangjiayin/rivomesh`。源码公开后，可从该仓库取得对应版本；当前已有本地源码的开发者可直接构建：

```bash
cd rivomesh
mvn -s build/settings.xml verify
```

产物：`sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`。构建使用公开 Maven 仓库；厂商 SDK/驱动有各自获取与分发条件，以对应模块与厂商要求为准。

启动方法见[快速开始](/guide/quick-start)。Docker 方式从源码执行 `docker compose -f deploy/docker-compose.yml up -d --build`，Linux 服务、Helm 与原生 Kubernetes 清单见[部署手册](/reference/zh-CN/console-and-deployment)。

## 配置样例

这些样例来自源码快照，需替换连接地址并通过环境变量设置凭据。导入前阅读对应手册，不能直接指向真实业务环境。

- [V3 多库、多目标配置](/reference-files/config/pipeline-v3.yml)
- [控制台基础配置](/reference-files/config/platform.yml)
- [消息目标说明与样例入口](/reference/zh-CN/messaging-v3)
- [四种部署方式](/reference/zh-CN/console-and-deployment)

## 发布准备与演进

正式发布将进一步完善候选包校验、许可证与 NOTICE、依赖清单、升级说明及兼容性证据。当前 [SDD 任务与验收](/roadmap)公开记录尚未完成的范围。

网站源码：[rivomesh/rivomesh.github.io](https://github.com/rivomesh/rivomesh.github.io)。
