# dsh-tip-jar 阶段 2 — 重启与验证手册

安装已完成并预检通过：
- 依赖 + bundles + node_modules 全部就位（`D:\tool\dsh_data\profiles\web`）
- `dsh --profile web --dump-config` exit=0，组合树含 dsh-tip-jar 行

## 1. 重启 Harness（需要你在终端执行）

当前运行进程：
- PID 14316：`npx @deepseek-ai/dsh web`（启动器）
- PID 27988：`node D:\tool\npmPlugin\node_modules\@deepseek-ai\dsh\lib\bin.js web`（服务本体）

在**普通终端**（非本会话）执行：

```powershell
# 停止（在运行 dsh web 的那个终端按 Ctrl+C，或强制杀）：
taskkill /PID 27988 /F
taskkill /PID 14316 /F

# 启动（回到你平常启动的方式）：
dsh web
# 或等价：node D:\tool\npmPlugin\node_modules\@deepseek-ai\dsh\lib\bin.js web
```

等待就绪后打开 http://127.0.0.1:3080

> ⚠️ 重启会中断当前会话与动态插件（trd-1 交易助手、sps-2 动态版），属预期；
> 会话历史仍在，赞助中心将以常驻版回归。

## 2. 重启后验证清单（喊我跑，或自行确认）

1. `dsh --profile web --dump-config` → 仍含 dsh-tip-jar 行
2. 新开会话 → 标题栏出现「支持」Tab → 点开显示赞助中心（2 个示例贡献者 + 赞助位）
3. **刷新页面 → UI 不丢**（常驻生效，之前的"刷新丢失"痛点消失）
4. 设置页出现「支持贡献者」页
5. 对话中调用 `pm_trading_status` → 工具卡显示"支持作者"致谢

## 3. 若启动失败（回滚）

```powershell
# 恢复原 package.json（备份仍在）：
Copy-Item D:\tool\dsh_data\profiles\web\package.json.bak D:\tool\dsh_data\profiles\web\package.json -Force
# 重启 dsh web 即回到安装前状态
```
