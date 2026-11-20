---
kind: page
locale: zh
title: 下载与构建
---

# 获取 RivoMesh

<p class="landing-lead">选择源码构建或 Docker Compose，启动 RivoMesh 并创建第一条同步任务。</p>

当前版本为 **0.1.0-SNAPSHOT · 预览版**，试用方式为源码构建。Docker Compose 同样从源码构建本地镜像。

## 选择部署方式

<QuickStart />

Docker Compose 需要 Git、Docker 与 openssl，从源码构建本地镜像。本机构建与运行需要 Eclipse Temurin 21 LTS 和 Maven。先运行 `mvn -version` 与 `java -version` 核对实际使用的 JDK。

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

[当前实施状态](/docs/zh/reference/implementation-status.html) · [兼容性说明](/docs/zh/start/compatibility.html) · [产品路线图](/docs/zh/start/roadmap.html) · [发布包审查](/docs/zh/reference/release-inventory.html)

RivoMesh 正在准备首个正式版本。当前预览版可通过源码或 Docker Compose 构建，正式发行信息见 [GitHub Releases](https://github.com/rivomesh/rivomesh/releases)。
