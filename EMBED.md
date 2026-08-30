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

在你的插件 Client 代码里，声明自己的 slot 并渲染组件：

```js
// 你的插件（client 半）
import { createElement } from 'react'
import { TipJarEmbed } from 'dsh-tip-jar/client'

// 在你的某个 slot（如会话标题栏动作、工具卡、你自己的面板）里：
slots.inject('conversation.session.header.actions', function () {
  return slots.register(
    { name: 'conversation.session.header.actions', id: 'my-tipjar', order: 80 },
    function () { return createElement(TipJarEmbed, { ctx: ctx, pluginId: 'my-plugin-id' }) },
  )
})
```

只需两步：
1. `import { TipJarEmbed } from 'dsh-tip-jar/client'`
2. 在你的 slot 渲染 `<TipJarEmbed ctx={你的ctx} pluginId="你的插件id" />`

`pluginId` 必须在 `sponsors.json` 的 `plugins[]` 中登记（并指向 `contributors[]`）。

## 依赖与限制（诚实说明）

| 项 | 说明 |
|----|------|
| 依赖 | 目标机器须已安装 dsh-tip-jar（`dsh plugin add dsh-tip-jar`） |
| 跨包导入 | 当前 Client 模块加载器对"插件 A 导入插件 B 的 client 导出"支持有限；若你的构建直接打包 dsh-tip-jar/client.js 源码（含 React 依赖），请确保 React external（见 README 构建说明） |
| 数据源 | 组件通过 dsh-tip-jar 的 Remote 命名空间读取（全局可用），无需你的插件额外接线 |
| 未安装时 | 组件不渲染（你的 slot 里无内容），不影响你的插件功能 |

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
