// dsh-tip-jar/test/service.test.js
// 红绿测试：写入路径逐个尝试（fallback write）——第一个候选被沙箱拒绝时，
// 自动落到下一个可写候选（与 readStats 的读取 fallback 对称）。
import { Context } from '@deepseek-ai/cordis'
import TipJarService from '../src/index.js'

let failures = 0
function check(name, cond, detail) {
  if (cond) { console.log('  PASS ' + name) }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')) }
}

function fakeFs() {
  const writes = {}
  const files = {}
  return {
    writes,
    files,
    fs: {
      async resolve(f) { return { displayPath: f } },
      async readText(target) {
        const p = target.displayPath
        if (!(p in files)) throw new Error('no such file: ' + p)
        return files[p]
      },
      async writeText(target, content) {
        const p = target.displayPath
        if (p.startsWith('DENY:')) throw new Error('denied: ' + p)
        writes[p] = content
        files[p] = content
      },
    },
  }
}

// 1. saveTipStats：第一个候选被拒 → 落到第二个
{
  const { fs, writes } = fakeFs()
  const ctx = new Context()
  ctx.fs = fs
  const svc = new TipJarService(ctx, { statsFiles: ['DENY:a.json', 'OK:b.json'] })
  const stats = { byContributorId: {}, lastBlock: 1 }
  const r = await svc.saveTipStats({ stats })
  check('saveTipStats 落到可写候选', r.ok === true && r.value && r.value.saved === true, JSON.stringify(r))
  check('stats 写入第二个候选', 'OK:b.json' in writes, JSON.stringify(Object.keys(writes)))
}

// 2. 全部统计候选被拒 → 返回明确错误（不崩溃）
{
  const { fs } = fakeFs()
  const ctx = new Context()
  ctx.fs = fs
  const svc = new TipJarService(ctx, { statsFiles: ['DENY:a.json'] })
  const r = await svc.saveTipStats({ stats: { byContributorId: {}, lastBlock: 0 } })
  check('全部被拒时返回错误', r.ok === false && r.error && r.error.code === 'tip-jar-stats-write-failed', JSON.stringify(r))
}

process.exit(failures > 0 ? 1 : 0)
