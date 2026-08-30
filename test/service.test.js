// dsh-tip-jar/test/service.test.js
// 红绿测试：写入路径逐个尝试（fallback write）——第一个候选被沙箱拒绝时，
// 自动落到下一个可写候选（与 readStats/readReports 的读取 fallback 对称）。
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

// 2. reportContributor：第一个候选被拒 → 落到第二个
{
  const { fs, writes } = fakeFs()
  const ctx = new Context()
  ctx.fs = fs
  const svc = new TipJarService(ctx, { reportsFiles: ['DENY:c.jsonl', 'OK:d.jsonl'] })
  const r = await svc.reportContributor({ targetId: 't', category: 'fake', anonId: 'dev1', note: 'x' })
  check('reportContributor 落到可写候选', r.ok === true && r.value && r.value.received === true, JSON.stringify(r))
  check('report 写入第二个候选', 'OK:d.jsonl' in writes, JSON.stringify(Object.keys(writes)))
  const raw = writes['OK:d.jsonl']
  const parsed = raw ? JSON.parse(raw.split(/\r?\n/).filter(Boolean)[0]) : undefined
  check('report 内容完整', parsed && parsed.targetId === 't' && parsed.anonId === 'dev1' && parsed.category === 'fake', JSON.stringify(parsed))
}

// 4. 读-写候选分叉：候选1可读（含旧记录）但不可写，候选2可写
//    → append 写候选2；readReports 必须合并两个候选（不丢旧记录）
{
  const { fs, writes, files } = fakeFs()
  files['DENY:c.jsonl'] = JSON.stringify({ targetId: 'old', category: 'fake', anonId: 'dev0', ts: 1 })
  const ctx = new Context()
  ctx.fs = fs
  const svc = new TipJarService(ctx, { reportsFiles: ['DENY:c.jsonl', 'OK:d.jsonl'] })
  const r = await svc.reportContributor({ targetId: 'new', category: 'fake', anonId: 'dev9', note: '' })
  check('分叉时 append 仍成功', r.ok === true && r.value && r.value.received === true, JSON.stringify(r))
  const all = await svc.readReports()
  check('readReports 合并两个候选（旧+新）', all.length === 2 && all.some(function (x) { return x.targetId === 'old' }) && all.some(function (x) { return x.targetId === 'new' }), JSON.stringify(all))
}

// 5. 全部候选被拒 → 返回明确错误（不崩溃）
{
  const { fs } = fakeFs()
  const ctx = new Context()
  ctx.fs = fs
  const svc = new TipJarService(ctx, { reportsFiles: ['DENY:c.jsonl'] })
  const r = await svc.reportContributor({ targetId: 't', category: 'fake', anonId: 'dev1' })
  check('全部被拒时返回错误', r.ok === false && r.error && r.error.code === 'tip-jar-report-write-failed', JSON.stringify(r))
}

process.exit(failures > 0 ? 1 : 0)
