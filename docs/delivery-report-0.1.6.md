# dsh-tip-jar 0.1.6 交付记录

> 生成时间：2026-08-30（会话内 doublecheck_report，判定 green）

## 规范（doublecheck_spec 记录）
- **目标**：0.1.6 双轨化 —— 保留独立赞助面板 + 嵌入式打赏组件（一行接入其他插件 UI），配套举报/争议标记治理统一数据源。
- **验收**：1) TipJarEmbed 可被其他插件 slot 挂载（读注册表 → 贡献者打赏入口：USDC/复制/雷达统计/伦理徽章）；2) 嵌入文档（EMBED.md）；3) 举报通道与争议标记为组件一部分（入口分散、数据统一在 Host）；4) 独立面板保留；5) 红绿测试锁定举报计数与数据组装；6) 构建/验证/推送。
- **优先级**：嵌入可用性 > 举报治理 > 红绿覆盖核心逻辑；向后兼容。
- **非目标**：人工核实（v1.2）、多链、强制其他插件升级。

## 实现内容（commit 721f499 及之前）
| 项 | 位置 | 状态 |
|---|---|---|
| upstream 来源声明校验（防抄袭 L2） | src/validate.js | ✅ |
| 支持人数去重统计（fromSet） | src/onchain.js | ✅ |
| 举报通道 reportContributor + 自动争议 computeDisputed | src/index.js + src/reports.js | ✅ |
| 争议标记 disputed 查询 + Host 持久化 | src/index.js | ✅ |
| TipJarEmbed 嵌入组件导出 | src/client.js | ✅ |
| **fallback-write 修复**（写路径逐个尝试，fs 沙箱拒绝首候选时自动落到可写候选） | src/index.js（721f499） | ✅ |

## 测试证据（红绿）
- registry 13 + onchain 19 + reports 8 + **service 6（新增，fallback-write 红→绿）** = 46 项，全绿。
- 红态复现：`writeStats/appendReport` 只写 `[0]` → 沙箱拒绝 `D:/tool/claude_code/...`；修复后逐个尝试，落在 fs 沙箱根 `C:\Users\74628\Desktop\report.jsonl`。

## 端到端验证
- **API 级**：reportContributor ×3 → `{received:true}`；disputed → `{"ghost-trader":{"fake":3}}`；listSponsors 正常；文件落盘。
- **浏览器 UI 级**（agent-browser @ 127.0.0.1:3080，会话"创造模式功能介绍"→ 支持 tab）：
  - 举报按钮 ×2 ✅
  - 伦理徽章 `🟢 自愿打赏` ×2 ✅
  - 争议徽章 `🟡 有争议`（ghost-trader）✅
  - 举报表单 5 分类 + 提交/取消 ✅
  - UI 提交 → Host → report.jsonl（浏览器 anonId `hfiesxnx5z8mtftqhnc`）✅

## 已知事项（移交）
- report.jsonl 含 3 条 ghost-trader fake 测试举报（导致其显示 🟡）与 1 条 algo-wizard copycat；真实数据接入前可清空。
- 发布 0.1.6 由用户在自有终端完成（npm 2FA 发布流程）。
- PR #350（awesome-deepseek-harness 收录）等待维护者合并。
