// dsh-tip-jar/src/client.js
// Client 半：赞助中心面板（会话「支持」Tab + 设置页）+ 工具卡致谢
// 通过 Typert Remote 调用 Host（ctx.remote.namespaces.get('tipJar')）
import { createElement, useState, useEffect } from 'react'
import { TYPERT_REMOTE } from './remote.js'

// ── Remote API ──────────────────────────────────────────────────────────────

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
    // 业务信封：host 返回 {ok:true, value: {ok, errors, data}}（value 即 loadRegistry 结果）
    const business = rpc.value
    if (!business.ok) {
      throw new TipJarApiError('rpc-failed', (business.error && business.error.message) || 'remote call failed')
    }
    const result = business.value
    if (result.ok) return result.data
    throw new TipJarApiError('registry-invalid', (result.errors && result.errors.length) ? result.errors.join('; ') : 'registry load failed')
  }

  listSponsors() {
    return this.call('listSponsors', {})
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

// ── Styles ──────────────────────────────────────────────────────────────────

function insertStyles(css) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  return () => style.remove()
}

const CSS =
  '.sps-root{display:flex;flex-direction:column;gap:12px;padding:14px 16px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary);overflow-y:auto;height:100%}' +
  '.sps-title{font-weight:600;font-size:14px;color:var(--dsw-alias-brand-primary)}' +
  '.sps-note{font-size:12px;color:var(--dsw-alias-label-secondary)}' +
  '.sps-empty{color:var(--dsw-alias-label-secondary);padding:16px 0}' +
  '.sps-errors{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:0;padding-left:16px}' +
  '.sps-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px;display:flex;flex-direction:column;gap:8px}' +
  '.sps-card-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
  '.sps-alias{font-weight:600;font-size:14px}' +
  '.sps-badge{font-size:11px;color:var(--dsw-alias-state-warn-primary);border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;padding:0 8px}' +
  '.sps-badge-ok{font-size:11px;color:var(--dsw-alias-state-success-primary);border:1px solid var(--dsw-alias-state-success-primary);border-radius:10px;padding:0 8px}' +
  '.sps-bio{font-size:12px;color:var(--dsw-alias-label-secondary)}' +
  '.sps-addr-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
  '.sps-label{font-size:11px;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.04em}' +
  '.sps-addr{font-family:ui-monospace,Consolas,monospace;font-size:12px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 8px;width:300px;color:var(--dsw-alias-label-primary)}' +
  '.sps-btn{background:none;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;padding:3px 10px}' +
  '.sps-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}' +
  '.sps-qr{width:110px;height:110px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px}' +
  '.sps-qr-row{display:flex;align-items:flex-start;gap:12px}' +
  '.sps-links{display:flex;flex-wrap:wrap;gap:8px}' +
  '.sps-link{font-size:12px;color:var(--dsw-alias-brand-primary);text-decoration:none}' +
  '.sps-link:hover{text-decoration:underline}' +
  '.sps-sec-title{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-top:4px}' +
  '.sps-sponsor{font-size:12px;color:var(--dsw-alias-label-secondary)}' +
  '.sps-sponsor b{color:var(--dsw-alias-state-warn-primary)}' +
  '.sps-toolcard{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px;font-size:12.5px;color:var(--dsw-alias-label-primary)}' +
  '.sps-tool-head{font-weight:600;margin-bottom:6px}' +
  '.sps-tool-body{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;margin-bottom:8px}' +
  '.sps-tool-support{font-size:12px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1);padding-top:6px}' +
  '.sps-tool-support b{color:var(--dsw-alias-state-warn-primary)}'

// ── SponsorCenter ───────────────────────────────────────────────────────────

function SponsorCenter(props) {
  const api = props.api
  const [state, setState] = useState(null)

  useEffect(function () {
    let alive = true
    const load = async function () {
      try {
        const data = await api.listSponsors()
        if (alive) setState({ ok: true, data })
      } catch (e) {
        if (alive) setState({ ok: false, errors: [e && e.message ? e.message : 'RPC 调用失败'], data: null })
      }
    }
    load()
    return function () { alive = false }
  }, [api])

  const h = createElement
  if (!state) {
    return h('div', { className: 'sps-root' }, h('div', { className: 'sps-title' }, '🤝 支持贡献者'), h('div', { className: 'sps-empty' }, '加载中…'))
  }
  if (!state.ok || !state.data) {
    const errs = state.errors && state.errors.length
      ? h('ul', { className: 'sps-errors' }, state.errors.map(function (e, i) { return h('li', { key: i }, e) }))
      : null
    return h('div', { className: 'sps-root' },
      h('div', { className: 'sps-title' }, '🤝 支持贡献者'),
      h('div', { className: 'sps-empty' }, '暂无赞助信息'),
      errs,
      h('div', { className: 'sps-note' }, '贡献者在工作区根目录 sponsors.json 中声明支持渠道后，此处即可展示。'))
  }

  const d = state.data
  const byId = {}
  ;(d.contributors || []).forEach(function (c) { byId[c.id] = c })

  const cards = (d.contributors || []).map(function (c) {
    const addr = c.tips && c.tips.usdc
    const head = h('div', { className: 'sps-card-head' },
      h('span', { className: 'sps-alias' }, '@' + c.alias),
      h('span', { className: c.verified ? 'sps-badge-ok' : 'sps-badge' }, c.verified ? '已认证' : '未验证'),
      c.bio ? h('span', { className: 'sps-bio' }, c.bio) : null)
    const rows = [head]
    if (addr) {
      const short = addr.slice(0, 6) + '…' + addr.slice(-4)
      const copyBtn = h('button', { className: 'sps-btn', onClick: function () {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(addr).catch(function () {})
          }
        } catch (e) { /* fallback: select manually */ }
      } }, '复制')
      const addrRow = h('div', { className: 'sps-addr-row' },
        h('span', { className: 'sps-label' }, 'USDC (Polygon)'),
        h('input', { className: 'sps-addr', readOnly: true, defaultValue: addr, title: '点击全选后 Ctrl+C 复制', onFocus: function (e) { e.target.select() } }),
        copyBtn)
      const qr = h('img', { className: 'sps-qr', src: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(addr), alt: 'USDC ' + short + ' 收款二维码' })
      rows.push(h('div', { className: 'sps-qr-row' }, qr, h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        addrRow,
        h('div', { className: 'sps-note' }, '用钱包扫二维码或复制地址，在 Polygon 网络转账 USDC（纯 P2P，平台不代收）。'))))
    }
    const fiat = (c.tips && c.tips.fiat && c.tips.fiat.length)
      ? h('div', { className: 'sps-links' }, c.tips.fiat.map(function (f) {
          return h('a', { key: f.url, className: 'sps-link', href: f.url, target: '_blank', rel: 'noreferrer' }, f.label)
        }))
      : null
    const subs = (c.subscriptions && c.subscriptions.length)
      ? h('div', { className: 'sps-links' }, c.subscriptions.map(function (s) {
          return h('a', { key: s.url, className: 'sps-link', href: s.url, target: '_blank', rel: 'noreferrer' }, '订阅: ' + s.label)
        }))
      : null
    if (fiat) rows.push(h('div', { className: 'sps-links' }, h('span', { className: 'sps-label' }, '法币'), fiat))
    if (subs) rows.push(h('div', { className: 'sps-links' }, h('span', { className: 'sps-label' }, '订阅'), subs))
    return h('div', { key: c.id, className: 'sps-card' }, ...rows)
  })

  const sponsored = (d.plugins || []).filter(function (p) { return p.sponsors && p.sponsors.length })
  const sponsorSec = sponsored.length
    ? h('div', { className: 'sps-section' },
        h('div', { className: 'sps-sec-title' }, '🤝 甲方赞助位'),
        sponsored.map(function (p) {
          const c = byId[p.contributorId]
          return p.sponsors.map(function (s, i) {
            return h('div', { key: p.pluginId + '-' + i, className: 'sps-sponsor' },
              'Sponsored by ', h('b', null, s.name), ' — ', s.message,
              '（', h('a', { className: 'sps-link', href: s.url, target: '_blank', rel: 'noreferrer' }, '了解'), '）',
              c ? ' · 贡献者 @' + c.alias : '')
          })
        }))
    : null

  return h('div', { className: 'sps-root' },
    h('div', { className: 'sps-title' }, '🤝 支持贡献者'),
    h('div', { className: 'sps-note' }, d.privacyNote || '所有信息由贡献者自行声明，未经认证前标记为未验证。'),
    cards,
    sponsorSec)
}

// ── ToolCard ────────────────────────────────────────────────────────────────

function ToolCard(props) {
  const api = props.api
  const [data, setData] = useState(null)
  useEffect(function () {
    let alive = true
    api.listSponsors().then(function (d) {
      if (alive && d) setData(d)
    }).catch(function () {})
    return function () { alive = false }
  }, [api])

  const h = createElement
  let body = null
  try {
    const block = props && props.block
    if (block) {
      if (typeof block.text === 'string') body = block.text
      const c = block.content || block.result
      if (Array.isArray(c)) {
        const parts = c.filter(function (b) { return b && b.type === 'text' && typeof b.text === 'string' }).map(function (b) { return b.text })
        if (parts.length) body = parts.join('\n')
      }
    }
  } catch (e) { /* defensive */ }

  let support = null
  if (data) {
    const plugin = (data.plugins || []).filter(function (p) { return p.pluginId === 'trd-1' })[0]
    if (plugin) {
      const c = (data.contributors || []).filter(function (x) { return x.id === plugin.contributorId })[0]
      const lines = []
      if (c) {
        const addr = c.tips && c.tips.usdc
        lines.push('支持作者 @' + c.alias + (addr ? ' · USDC ' + addr.slice(0, 6) + '…' + addr.slice(-4) : ''))
      }
      if (plugin.sponsors && plugin.sponsors.length) {
        lines.push('Sponsored by ' + plugin.sponsors.map(function (s) { return s.name }).join(' / '))
      }
      if (lines.length) {
        support = h('div', { className: 'sps-tool-support' },
          lines.map(function (l, i) { return h('div', { key: i }, l) }))
      }
    }
  }

  return h('div', { className: 'sps-toolcard' },
    h('div', { className: 'sps-tool-head' }, '🔧 ' + (props && props.toolName ? props.toolName : '工具')),
    body ? h('div', { className: 'sps-tool-body' }, body) : null,
    support)
}

// ── Plugin ──────────────────────────────────────────────────────────────────

export default {
  inject: ['remote', 'slots'],
  async apply(ctx) {
    const slots = ctx.slots
    if (!slots) return

    // 挂载 Remote 命名空间：ctx.remote.namespaces 只能由 $mount 填充
    const disposers = []
    try {
      const dispose = await ctx.remote.$mount(TYPERT_REMOTE)
      if (typeof dispose === 'function') {
        disposers.push(dispose)
        ctx.effect(() => dispose)
      }
    } catch (error) {
      for (const d of disposers.reverse()) await d()
      throw error
    }

    const api = createTipJarApi(ctx)

    ctx.effect(() => insertStyles(CSS))

    // 入口 1：会话视图 Tab「支持」
    slots.inject('conversation.view', function () {
      return slots.register(
        { name: 'conversation.view', id: 'sponsors-center', order: 20, label: '支持' },
        function () { return createElement(SponsorCenter, { api: api }) })
    })
    // 入口 2：设置页「支持贡献者」
    slots.inject('settings.section', function () {
      return slots.register(
        { name: 'settings.section', id: 'sponsors', order: 30, label: '支持贡献者' },
        function () { return createElement(SponsorCenter, { api: api }) })
    })
    // 入口 3：pm_trading_status 工具卡致谢
    slots.inject('tool.call.toolview', function () {
      return slots.register(
        { name: 'tool.call.toolview', key: 'pm_trading_status' },
        function (props) { return createElement(ToolCard, Object.assign({}, props, { api: api })) })
    })
  },
}
