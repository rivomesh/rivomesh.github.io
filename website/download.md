---
kind: page
locale: zh
title: 下载与构建
---

# 获取 RivoMesh

<p class="landing-lead">从公开源码构建数据库同步服务，按环境选择部署方式。</p>

当前版本为 **0.1.0-SNAPSHOT · 发布前预览**。源码与操作文档已经公开；正式发行包、签名、校验和与公共镜像按实际发布进展提供。

## 选择部署方式

<QuickStart />

Docker Compose 需要 Git、Docker 与 openssl，从源码构建本地镜像。Java 服务需要 Git、Java 8、Maven 与 openssl。

## 源码构建

在准备运行同步服务的环境中执行：

```bash
git clone https://github.com/rivomesh/rivomesh.git
cd rivomesh
mvn -s build/settings.xml verify
```

可执行产物为 `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`。数据库驱动、厂商 SDK 与隔离模块的实际版本，以源码和对应目标手册为准。

## 配置与启动

控制台示例：[platform.yml](/files/config/platform.yml)。多库、多目标配置示例：[pipeline-v3.yml](/files/config/pipeline-v3.yml)。使用前替换网络地址，通过环境变量提供自己的凭据。

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx512m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

首次任务使用独立测试源和空目标，完整权限与数据库前提见[快速开始](/docs/zh/start/quick-start.html)。

## 版本与演进

[当前实施状态](/docs/zh/reference/implementation-status.html) · [兼容性说明](/docs/zh/start/compatibility.html) · [产品路线图](/docs/zh/start/roadmap.html)

正式发行包、公共镜像及升级说明将在发布时提供。当前请使用上方的构建步骤。

[GitHub Releases](https://github.com/rivomesh/rivomesh/releases) · [许可证状态](/community.html#许可证与发布状态)

当前核对的仓库尚无正式 Release；发布入口不代表已经提供可下载发行包。
