// dsh-tip-jar/src/embed.js
// 嵌入式打赏组件模块（纯 ESM，无副作用）：
// 供其他插件在自己的构建中直接打包使用（esbuild external react），
// 实现 EMBED.md 的"一行接入"。本模块不注入 slot、不 $mount、不注入样式——
// 宿主 dsh-tip-jar 的 client 插件负责这些（Remote 命名空间 + CSS）。
import { createElement, useState, useEffect } from 'react'
import { formatUsdc } from './onchain.js'

class TipJarApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

class TipJarApi {
  /** @param {() => object|undefined} getNamespace live namespace getter */
  constructor(getNamespace) {
    this.getNamespace = getNamespace
  }

  async call(method, args) {
    const namespace = this.getNamespace()
    const fn = namespace && namespace[method]
    if (typeof fn !== 'function') {
      throw new TipJarApiError('not-mounted', 'tipJar Remote method "' + method + '" is not mounted')
    }
    const rpc = await fn(args)
    if (!rpc.ok) {
      throw new TipJarApiError('rpc-failed', (rpc.error && rpc.error.message) || 'remote call failed')
    }
    const business = rpc.value
    if (!business.ok) {
      throw new TipJarApiError('rpc-failed', (business.error && business.error.message) || 'remote call failed')
    }
    return business.value
  }

  async listSponsors() {
    const result = await this.call('listSponsors', {})
    if (result.ok) return result.data
    throw new TipJarApiError('registry-invalid', (result.errors && result.errors.length) ? result.errors.join('; ') : 'registry load failed')
  }

  tipStats() {
    return this.call('tipStats', {})
  }

  saveTipStats(stats) {
    return this.call('saveTipStats', { stats })
  }

  reportContributor(targetId, category, anonId, note) {
    return this.call('reportContributor', { targetId, category, anonId, note })
  }

  disputed() {
    return this.call('disputed', {})
  }
}

function createTipJarApi(ctx) {
  return new TipJarApi(() => {
    const remote = ctx.remote
    if (!remote || !remote.namespaces) return undefined
    const ns = remote.namespaces.get('tipJar')
    return ns ? ns.service : undefined
  })
}

// 设备匿名编号：同一设备同一编号（防同一人反复刷举报）
function getAnonId() {
  try {
    const key = 'dsh-tip-jar-anon'
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      window.localStorage.setItem(key, id)
    }
    return id
  } catch (e) {
    return Math.random().toString(36).slice(2)
  }
}

const REPORT_CATEGORIES = [
  { value: 'fake', label: '虚假贡献（收钱不交付）' },
  { value: 'copycat', label: '冒领/抄袭（伪冒他人作品）' },
  { value: 'phishing', label: '钓鱼链接' },
  { value: 'paidwall', label: '强制付费/付费墙' },
  { value: 'other', label: '其他' },
]

// ── resolveEmbed：纯数据组装（红绿可测）───────────────────────────────────
// 输入注册表 + pluginId + 链上统计 → 输出嵌入组件的渲染数据或降级状态
export function resolveEmbed(sponsors, pluginId, stats) {
  if (!sponsors || !Array.isArray(sponsors.plugins)) return { status: 'loading' }
  const plugin = sponsors.plugins.filter(function (p) { return p.pluginId === pluginId })[0]
  if (!plugin) return { status: 'unregistered' }
  const contributor = (sponsors.contributors || []).filter(function (x) { return x.id === plugin.contributorId })[0]
  if (!contributor) return { status: 'no-contributor' }
  const stat = stats && stats.byContributorId && stats.byContributorId[contributor.id] ? stats.byContributorId[contributor.id] : null
  return { status: 'ok', plugin, contributor, stat }
}

// ── ReportButton（举报通道，匿名 + 必选分类）───────────────────────────────

function ReportButton(props) {
  const api = props.api
  const targetId = props.targetId
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('fake')
  const [done, setDone] = useState(false)
  const h = createElement
  if (done) return h('span', { className: 'sps-report-ok' }, '已收到举报（匿名，仅作记录）')
  if (!open) return h('button', { className: 'sps-report-btn', title: '匿名提交举报，仅作记录供生态核实参考（不自动标记）', onClick: function () { setOpen(true) } }, '举报')
  return h('span', { className: 'sps-report-form' },
    h('select', { className: 'sps-report-select', value: category, onChange: function (e) { setCategory(e.target.value) } },
      REPORT_CATEGORIES.map(function (c) { return h('option', { key: c.value, value: c.value }, c.label) })),
    h('button', { className: 'sps-report-btn', onClick: function () {
      api.reportContributor(targetId, category, getAnonId(), '').then(function () { setDone(true) }).catch(function () { setDone(true) })
    } }, '提交'),
    h('button', { className: 'sps-report-btn', onClick: function () { setOpen(false) } }, '取消'))
}

// ── TipJarEmbed（嵌入式打赏组件：其他插件一行接入）──────────────────────────
// 用法：其他插件在自己的 slot 里渲染 <TipJarEmbed ctx={ctx} pluginId="xxx" />
// 详细接入见 EMBED.md。组件读取注册表对应插件 → 展示贡献者打赏入口。

function TipJarEmbed(props) {
  const api = createTipJarApi(props.ctx)
  const pluginId = props.pluginId
  const [data, setData] = useState(null)
  const [tipState, setTipState] = useState({ stats: null })
  const h = createElement

  useEffect(function () {
    let alive = true
    api.listSponsors().then(function (d) { if (alive && d) setData(d) }).catch(function () {})
    api.tipStats().then(function (r) { if (alive && r) setTipState({ stats: r.stats }) }).catch(function () {})
    return function () { alive = false }
  }, [api, pluginId])

  const resolved = resolveEmbed(data, pluginId, tipState.stats)
  if (resolved.status === 'loading') return h('div', { className: 'sps-toolcard' }, '🤝 支持作者（加载中…）')
  if (resolved.status === 'unregistered') return h('div', { className: 'sps-toolcard sps-tip-line' }, '该插件未在赞助注册表登记（sponsors.json）')
  if (resolved.status === 'no-contributor') return h('div', { className: 'sps-toolcard sps-tip-line' }, '贡献者未登记')

  const c = resolved.contributor
  const plugin = resolved.plugin
  const stat = resolved.stat

  const eth = c.ethics || {}
  const ethicsBadge = eth.paidWall === true
    ? h('span', { className: 'sps-badge-pw' }, '🔴 付费墙')
    : (eth.voluntary === true ? h('span', { className: 'sps-badge-vol' }, '🟢 自愿打赏') : h('span', { className: 'sps-badge-un' }, '⚪ 未确认'))
  const addr = c.tips && c.tips.usdc

  const line = h('div', { className: 'sps-tool-support' },
    h('span', { className: 'sps-tip-alias' }, '支持作者 @' + c.alias),
    ethicsBadge,
    addr ? h('span', { className: 'sps-num' }, ' · USDC ' + addr.slice(0, 6) + '…' + addr.slice(-4)) : null,
    stat ? h('span', { className: 'sps-tip-amount' }, ' · ' + formatUsdc(stat.amountUsdc) + ' / ' + stat.count + ' 笔') : null,
    h(ReportButton, { api: api, targetId: c.id }))

  return h('div', { className: 'sps-toolcard' },
    h('div', { className: 'sps-tool-head' }, '🤝 ' + (plugin.name || pluginId)),
    line)
}

export { TipJarEmbed, ReportButton, TipJarApi, createTipJarApi, getAnonId, REPORT_CATEGORIES }
