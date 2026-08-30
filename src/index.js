// dsh-tip-jar/src/index.js
// Host 半：读取并校验 sponsors.json，经 Typert Remote 暴露给 Client
import { Service } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { validateRegistry } from './validate.js'

// 默认查找工作区根目录的 sponsors.json；可通过插件配置 config.roots 覆盖
const DEFAULT_ROOTS = ['sponsors.json']

function fail(code, message) {
  return { code, message }
}

class TipJarService extends TypertRemoteService {
  static inject = ['fs']

  constructor(ctx, config = {}) {
    super(ctx, 'tipJar')
    this.config = { roots: DEFAULT_ROOTS, ...config }
  }

  async [Service.init]() {
    // 无异步初始化；注册表在每次 listSponsors 时实时读取
  }

  async listSponsors() {
    try {
      const value = await this.loadRegistry()
      return { ok: true, value }
    } catch (error) {
      return {
        ok: false,
        error: fail('tip-jar-load-failed', error && error.message ? error.message : String(error)),
      }
    }
  }

  async loadRegistry() {
    const fs = this.ctx.fs
    if (!fs) return { ok: false, errors: ['fs 服务不可用'], data: null }
    for (const root of this.config.roots) {
      try {
        const target = await fs.resolve(root, {})
        const text = await fs.readText(target)
        let parsed = null
        try { parsed = JSON.parse(text) } catch (e) {
          return { ok: false, errors: ['sponsors.json 不是合法 JSON'], data: null }
        }
        const v = validateRegistry(parsed)
        return { ok: v.ok, errors: v.errors, data: parsed }
      } catch (e) { /* try next root */ }
    }
    return { ok: false, errors: ['sponsors.json 未找到（期望在工作区根目录）'], data: null }
  }
}

export default TipJarService
