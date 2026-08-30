// dsh-tip-jar/test/embed.test.js
// 红绿测试：嵌入组件数据组装（resolveEmbed）——未登记/缺贡献者/正常/统计 四态。
import { resolveEmbed } from '../src/embed.js'

let failures = 0
function check(name, cond, detail) {
  if (cond) { console.log('  PASS ' + name) }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')) }
}

const sponsors = {
  contributors: [
    { id: 'ghost-trader', alias: 'ghost_trader', ethics: { voluntary: true, paidWall: false }, tips: { usdc: '0x1111111111111111111111111111111111111111' } },
  ],
  plugins: [
    { pluginId: 'pm-trading-assistant', name: '预测交易助手', contributorId: 'ghost-trader' },
  ],
}

// 1. 未登记 pluginId → unregistered
{
  const r = resolveEmbed(sponsors, 'unknown-plugin', null)
  check('未登记 → unregistered', r.status === 'unregistered', JSON.stringify(r))
}

// 2. 已登记但 contributorId 无对应贡献者 → no-contributor
{
  const broken = { contributors: [], plugins: [{ pluginId: 'pm-trading-assistant', name: 'x', contributorId: 'nobody' }] }
  const r = resolveEmbed(broken, 'pm-trading-assistant', null)
  check('贡献者缺失 → no-contributor', r.status === 'no-contributor', JSON.stringify(r))
}

// 3. 正常 → ok + contributor + plugin
{
  const r = resolveEmbed(sponsors, 'pm-trading-assistant', null)
  check('正常 → ok', r.status === 'ok', JSON.stringify(r))
  check('ok 返回贡献者', r.contributor && r.contributor.id === 'ghost-trader')
  check('ok 返回插件', r.plugin && r.plugin.pluginId === 'pm-trading-assistant')
}

// 4. 统计并入（雷达数据）
{
  const stats = { byContributorId: { 'ghost-trader': { count: 3, amountUsdc: 1.75, supporters: 2 } }, lastBlock: 100 }
  const r = resolveEmbed(sponsors, 'pm-trading-assistant', stats)
  check('ok 含链上统计', r.stat && r.stat.count === 3 && r.stat.amountUsdc === 1.75, JSON.stringify(r.stat))
}

// 5. 无统计时 stat 为 null（不崩）
{
  const r = resolveEmbed(sponsors, 'pm-trading-assistant', { byContributorId: {} })
  check('无统计 → stat null', r.status === 'ok' && r.stat === null, JSON.stringify(r))
}

// 6. 空输入 → loading（数据未加载）
{
  check('null 输入 → loading', resolveEmbed(null, 'pm-trading-assistant', null).status === 'loading')
}

process.exit(failures > 0 ? 1 : 0)
