# dsh-tip-jar 🫙

**打赏罐** — DeepSeek Harness 的贡献者支持系统。开源插件的贡献者只需在
`sponsors.json` 声明支持渠道（USDC / 法币平台 / 订阅 / 甲方赞助位），用户就能在
多个入口一键触达。纯 P2P，零经手，隐私默认（伪匿名 + 未验证标记）。

A tip jar for DeepSeek Harness: contributors declare their support channels once;
users tip from a sponsor-center panel, a settings page, or tool-card credits.

## 功能

- **赞助中心**：会话视图「支持」Tab + 设置页「支持贡献者」页
- **USDC (Polygon)**：收款二维码 + 复制地址（格式校验 `0x`+40hex）
- **法币 / 订阅**：爱发电、GitHub Sponsors、Patreon 等链接
- **甲方赞助位**：`Sponsored by …` 静态展示（作者直接与甲方洽谈）
- **隐私默认**：化名即可，未验证徽章，不强制真实身份
- **降级安全**：注册表缺失/损坏/地址非法 → 空态或错误提示，不崩溃

## 安装（常驻）

```bash
# 本地构建
npm install && npm run build

# 加入 profile（二选一）
dsh plugin --profile <name> add dsh-tip-jar
# 或将 "dsh-tip-jar" 加入 profile 的 dsh.profile.bundles（自动应用 cordis.patch.yml）
```

重启 Harness 后，所有会话都会加载赞助中心；页面刷新不丢失。

## 注册表 `sponsors.json`（工作区根目录）

```jsonc
{
  "schemaVersion": 1,
  "privacyNote": "贡献者可仅使用化名；未经认证前标记为未验证。",
  "contributors": [{
    "id": "ghost-trader",           // 必填，去重
    "alias": "ghost_trader",        // 必填，化名
    "verified": false,              // 必填；false → 未验证徽章
    "bio": "一句话介绍",
    "tips": {
      "usdc": "0x…(40位hex)",       // 可选，格式校验
      "fiat": [{ "label": "爱发电", "url": "https://…" }]
    },
    "subscriptions": [{ "label": "Patreon", "url": "https://…" }]
  }],
  "plugins": [{
    "pluginId": "dsh-tip-jar",
    "name": "打赏罐",
    "contributorId": "ghost-trader",  // 引用 contributors.id
    "sponsors": [{ "name": "甲方", "message": "标语", "url": "https://…" }]
  }]
}
```

完整规范见 `dsh-sponsors/PROJECT.md` 与 `dsh-sponsors/manifest-spec.md`（同仓库目录）。

## 开发

```bash
npm test    # 注册表校验测试（红绿）
npm run build  # esbuild：host / remote / client(__ModuleLoader__)
```

## License

MIT
