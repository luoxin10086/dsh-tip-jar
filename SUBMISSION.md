# 生态提交草稿（阶段 3 使用）

目标：将 dsh-tip-jar 收录进 [awesome-deepseek-harness](https://github.com/Dominic789654/awesome-deepseek-harness)
（及其他 awesome-dsh 目录），并提交 manifest `sponsor` 字段规范讨论。

## 1. awesome 目录收录条目（PR 文本）

```markdown
### 💰 贡献者支持 / Tip Jar

- [dsh-tip-jar](https://github.com/<你的GitHub>/dsh-tip-jar) — 打赏罐：开源插件
  贡献者在 sponsors.json 声明 USDC/法币/订阅/赞助位，用户在「支持」Tab、
  设置页、工具卡一键打赏。纯 P2P，隐私默认（伪匿名 + 未验证徽章）。
  Tip jar for contributors: declare USDC / fiat / subscription / sponsor
  channels once; users tip from the sponsor center, settings, or tool cards.
```

## 2. manifest `sponsor` 字段规范（向生态提议，草案见 dsh-sponsors/manifest-spec.md）

```yaml
# 插件 manifest 提案
sponsor:
  contributorId: ghost-trader      # 关联注册表 sponsors.json
  tips: { usdc: true }             # 支持 USDC (Polygon)
  fiat: [afdian, github-sponsors]  # 法币平台
  verifiedBy: []                   # 空 = 未验证徽章
```

提案要点（PR 正文可引用）：
- 注册表管"人"（贡献者支持渠道），manifest 管"插件→人"映射，两者互操作
- 隐私硬约束：不强制真实身份，化名即可，地址公开与否自选
- 校验规则开源实现：dsh-tip-jar 内 `src/validate.js`（6 项测试锁定）

## 3. 发布清单（本地仓库已就绪：17 文件，root-commit 36f33ec；npm dry-run 已通过）

- [ ] GitHub 仓库创建（建议名 `dsh-tip-jar`）后推送：
      ```powershell
      git remote add origin https://github.com/<你的GitHub>/dsh-tip-jar.git
      git branch -M main
      git push -u origin main
      ```
      （当前 commit 身份为仓库本地占位 `dsh-tip-jar <dsh-tip-jar@local>`，推送前可 `git config user.name/user.email` 改成你的）
- [ ] `npm publish`（包名 `dsh-tip-jar` 已确认可用；**注意**：本机 npm 默认 registry 是 npmmirror，
      发布进官方生态需显式用官方源）：
      ```powershell
      npm login --registry https://registry.npmjs.org
      npm publish --registry https://registry.npmjs.org
      ```
- [ ] awesome-deepseek-harness PR（上文条目）
- [ ] manifest-spec 讨论 issue（可挂在 dsh-tip-jar 仓库或 awesome 仓库）

## 4. 其他可同步动作

- 把"动态 Client 模块跨页面加载持久化"作为 feature 建议提交到
  deepseek-ai/deepseek-harness（P2 待办，见 dsh-sponsors/PROJECT.md §10）
