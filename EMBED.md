# 嵌入式打赏组件：其他插件一行接入 (EMBED.md)

dsh-tip-jar 除了独立赞助面板（「支持」Tab / 设置页），还提供**可嵌入的打赏组件** `TipJarEmbed`，
让其他插件/工具在自己的 UI 里直接展示"支持作者"入口——受益者在用你的插件时顺手打赏，无需跳转。

## 组件能力

`TipJarEmbed` 渲染一个紧凑打赏条：

```
🤝 AI 交易助手
支持作者 @ghost_trader [🟢 自愿打赏] · USDC 0x1111…1111 · $3.00 / 2 笔 [举报]
```

- 读取注册表（sponsors.json）中 `pluginId` 对应的插件 → 贡献者
- 展示：伦理徽章（自愿/未确认/付费墙）、USDC 短地址、链上雷达统计、举报按钮
- 未登记 → 空态提示；数据不可用 → 降级提示，不崩溃

## 接入方式（一行）

在你的插件 Client 代码里，**在自己的构建中引入** `dsh-tip-jar/embed`（纯 ESM、无副作用），
并渲染组件：

```js
// 你的插件（client 半，自己的 esbuild 构建）
import { createElement } from 'react'
import { TipJarEmbed } from 'dsh-tip-jar/embed'

// 在你的某个 slot（如会话标题栏动作、工具卡、你自己的面板）里：
slots.inject('conversation.session.header.actions', function () {
  return slots.register(
    { name: 'conversation.session.header.actions', id: 'my-tipjar', order: 80 },
    function () { return createElement(TipJarEmbed, { ctx: ctx, pluginId: 'my-plugin-id' }) },
  )
})
```

只需两步：
1. `import { TipJarEmbed } from 'dsh-tip-jar/embed'`（你的构建把该 ESM 打包进自己的 bundle，`react` 保持 external）
2. 在你的 slot 渲染 `<TipJarEmbed ctx={你的ctx} pluginId="你的插件id" />`

`pluginId` 必须在 `sponsors.json` 的 `plugins[]` 中登记（并指向 `contributors[]`）。

> ⚠️ **为什么用 `/embed` 而不是 `/client`**：dsh 平台禁止插件之间在**运行时**互相导入对方
> client 模块的导出（ModuleLoader 的 factory 返回即导出，跨包 value import 是平台级构建错误）。
> `dsh-tip-jar/client` 是给 dsh-tip-jar 自己用的 ModuleLoader bundle；
> 给**其他插件**用的干净入口是 `dsh-tip-jar/embed` —— 纯 ESM 组件模块，在你的构建时打包进去。

## 依赖与限制（诚实说明）

| 项 | 说明 |
|----|------|
| 依赖 | 目标机器须已安装并运行 dsh-tip-jar（提供 Remote 命名空间 + CSS；`dsh plugin add dsh-tip-jar`） |
| 打包 | 用 `dsh-tip-jar/embed`（ESM）；你自己的构建负责打包它，`react` 保持 external（与 dsh 插件构建惯例一致） |
| 数据源 | 组件通过 dsh-tip-jar 的 Remote 命名空间读取（全局可用），无需你的插件额外接线 |
| 未安装时 | 组件渲染降级提示（"tipJar Remote 未挂载"），不影响你的插件功能 |
| 纯函数 | 也可只 import `resolveEmbed(sponsors, pluginId, stats)` 自己拼 UI |

## 注册表登记示例

```jsonc
// sponsors.json
{ "plugins": [
  { "pluginId": "my-plugin-id", "name": "我的插件", "contributorId": "ghost-trader",
    "upstream": { "repo": "https://github.com/you/my-plugin", "author": "you" } }
] }
```

## 独立面板 vs 嵌入组件

| | 独立面板 | 嵌入组件 |
|---|---|---|
| 形态 | 全局「支持」Tab + 设置页 | 插件自己的 UI 内 |
| 适用 | 集中浏览所有贡献者 | 受益者就在场景里时 |
| 关系 | 两者数据同源（注册表 + Remote） | 可同时存在 |

## 更多

- 伦理规范：`ETHICS.md`（自愿打赏）
- 治理机制：`ECOSYSTEM-RISKS.md`（举报/争议/防抄袭）
- 注册表 Schema：`PROJECT.md` §4
