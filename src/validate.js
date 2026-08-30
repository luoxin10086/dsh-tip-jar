// dsh-tip-jar/src/validate.js
// sponsors.json 注册表校验：结构、USDC 地址格式、URL、引用完整性、重复 id
//（与 dsh-sponsors/validate.js 同规则，ESM 版）

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/
const URL_RE = /^https?:\/\/\S+$/

function isStr(v) { return typeof v === 'string' && v.trim().length > 0 }
function isArr(v) { return Array.isArray(v) }
function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) }

function checkLink(errors, prefix, item) {
  if (!isObj(item) || !isStr(item.label) || !isStr(item.url) || !URL_RE.test(item.url)) {
    errors.push(prefix + ' 需要 {label, url(https://…)}')
  }
}

export function validateRegistry(input) {
  const errors = []
  const warnings = []
  if (!isObj(input)) {
    return { ok: false, errors: ['注册表必须是 JSON 对象'], warnings }
  }
  if (input.schemaVersion !== 1) {
    errors.push('schemaVersion 必须为 1')
  }

  if (!isArr(input.contributors) || input.contributors.length === 0) {
    errors.push('contributors 必须是非空数组')
  } else {
    const seen = new Set()
    input.contributors.forEach(function (c, i) {
      const p = 'contributors[' + i + ']'
      if (!isObj(c)) { errors.push(p + ' 必须是对象'); return }
      if (!isStr(c.id)) errors.push(p + '.id 缺失')
      else if (seen.has(c.id)) errors.push(p + '.id 重复: ' + c.id)
      else seen.add(c.id)
      if (!isStr(c.alias)) errors.push(p + '.alias 缺失（化名是隐私默认）')
      if (typeof c.verified !== 'boolean') errors.push(p + '.verified 必须是布尔值')
      if (!isObj(c.tips)) errors.push(p + '.tips 缺失')
      else {
        if (c.tips.usdc !== undefined && c.tips.usdc !== null && !ADDR_RE.test(c.tips.usdc)) {
          errors.push(p + '.tips.usdc 地址格式无效: ' + c.tips.usdc)
        }
        if (c.tips.fiat !== undefined) {
          if (!isArr(c.tips.fiat)) errors.push(p + '.tips.fiat 必须是数组')
          else c.tips.fiat.forEach(function (f, j) {
            checkLink(errors, p + '.tips.fiat[' + j + ']', f)
          })
        }
      }
      if (c.subscriptions !== undefined) {
        if (!isArr(c.subscriptions)) errors.push(p + '.subscriptions 必须是数组')
        else c.subscriptions.forEach(function (s, j) {
          checkLink(errors, p + '.subscriptions[' + j + ']', s)
        })
      }
      // 自愿打赏伦理声明（dsh-sponsor-ethics）
      if (c.ethics !== undefined) {
        if (!isObj(c.ethics)) {
          errors.push(p + '.ethics 必须是对象')
        } else {
          if (c.ethics.voluntary !== undefined && typeof c.ethics.voluntary !== 'boolean') {
            errors.push(p + '.ethics.voluntary 必须是布尔值')
          }
          if (c.ethics.paidWall !== undefined && typeof c.ethics.paidWall !== 'boolean') {
            errors.push(p + '.ethics.paidWall 必须是布尔值')
          }
          if (c.ethics.paidWall === true) {
            warnings.push(p + '.ethics.paidWall=true：该贡献者声明存在付费墙，违反自愿打赏伦理规范')
          }
        }
      }
    })
  }

  if (!isArr(input.plugins)) {
    errors.push('plugins 必须是数组')
  } else {
    const contributorIds = new Set()
    ;(input.contributors || []).forEach(function (c) { if (isObj(c) && isStr(c.id)) contributorIds.add(c.id) })
    const pluginSeen = new Set()
    input.plugins.forEach(function (p, i) {
      const pp = 'plugins[' + i + ']'
      if (!isObj(p)) { errors.push(pp + ' 必须是对象'); return }
      if (!isStr(p.pluginId)) errors.push(pp + '.pluginId 缺失')
      else if (pluginSeen.has(p.pluginId)) errors.push(pp + '.pluginId 重复: ' + p.pluginId)
      else pluginSeen.add(p.pluginId)
      if (!isStr(p.contributorId)) errors.push(pp + '.contributorId 缺失')
      else if (!contributorIds.has(p.contributorId)) errors.push(pp + '.contributorId 未知: ' + p.contributorId)
      if (p.sponsors !== undefined) {
        if (!isArr(p.sponsors)) errors.push(pp + '.sponsors 必须是数组')
        else p.sponsors.forEach(function (s, j) {
          const sp = pp + '.sponsors[' + j + ']'
          if (!isObj(s) || !isStr(s.name) || !isStr(s.message) || !isStr(s.url) || !URL_RE.test(s.url)) {
            errors.push(sp + ' 需要 {name, message, url(https://…)}')
          }
        })
      }
    })
  }

  return { ok: errors.length === 0, errors, warnings }
}
