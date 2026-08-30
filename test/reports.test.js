// dsh-tip-jar/test/reports.test.js
// 红绿测试：举报争议标记计数逻辑（设备编号去重 + 按天窗口 + 同类≥3 → 争议）
import { computeDisputed } from '../src/reports.js'

let failures = 0
function check(name, cond, detail) {
  if (cond) { console.log('  PASS ' + name) }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')) }
}

const DAY = 24 * 3600 * 1000
const rep = (targetId, category, anonId, ts) => ({ targetId, category, anonId, ts })

// 1. 少于 3 个不同来源 → 不争议
const r1 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
])
check('2 来源不争议', Object.keys(r1).length === 0)

// 2. 3 个不同来源 → 争议
const r2 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
  rep('a', 'fake', 'dev3', 0),
])
check('3 来源触发争议', r2['a'] && r2['a']['fake'] === 3)

// 3. 同一设备同一天多次只算 1 来源 → 不争议
const r3 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev1', 1000),
  rep('a', 'fake', 'dev1', 2000),
])
check('同设备同天去重后不足 3', Object.keys(r3).length === 0)

// 4. 同一设备跨天可计数 → 争议
const r4 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev1', DAY + 1),
  rep('a', 'fake', 'dev1', 2 * DAY + 1),
])
check('同设备跨天计 3 来源触发争议', r4['a'] && r4['a']['fake'] === 3)

// 5. 分类独立：2+2 不同分类 → 均不争议
const r5 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
  rep('a', 'copycat', 'dev3', 0),
  rep('a', 'copycat', 'dev4', 0),
])
check('不同分类各自计数不混合', Object.keys(r5).length === 0)

// 6. 某分类达 3 而另一分类不足 → 只标记达标的
const r6 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
  rep('a', 'fake', 'dev3', 0),
  rep('a', 'copycat', 'dev4', 0),
  rep('b', 'fake', 'dev5', 0),
  rep('b', 'fake', 'dev6', 0),
])
check('只标记达标分类', r6['a'] && r6['a']['fake'] === 3 && !r6['a']['copycat'] && !r6['b'])

// 7. 空举报 → 无争议
check('空举报无争议', Object.keys(computeDisputed([])).length === 0)

// 8. 自定义阈值
const r8 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
], 2)
check('自定义阈值 2 生效', r8['a'] && r8['a']['fake'] === 2)

// 9. 有限期窗口：全部举报超过 30 天 → 不争议（自动消退）
const WINDOW = 30 * 24 * 3600 * 1000
const now = 2000000000000
const old = now - 40 * 24 * 3600 * 1000
const r9 = computeDisputed([
  rep('a', 'fake', 'dev1', old),
  rep('a', 'fake', 'dev2', old),
  rep('a', 'fake', 'dev3', old),
], 3, 24 * 3600 * 1000, WINDOW, now)
check('全部超窗 → 无争议', Object.keys(r9).length === 0, JSON.stringify(r9))

// 10. 有限期窗口：3 条都在 30 天内 → 争议
const fresh = now - 5 * 24 * 3600 * 1000
const r10 = computeDisputed([
  rep('a', 'fake', 'dev1', fresh),
  rep('a', 'fake', 'dev2', fresh),
  rep('a', 'fake', 'dev3', fresh),
], 3, 24 * 3600 * 1000, WINDOW, now)
check('窗内 3 来源 → 争议', r10['a'] && r10['a']['fake'] === 3, JSON.stringify(r10))

// 11. 有限期窗口：混合（2 条窗内 + 1 条超窗）→ 不达阈值
const r11 = computeDisputed([
  rep('a', 'fake', 'dev1', fresh),
  rep('a', 'fake', 'dev2', fresh),
  rep('a', 'fake', 'dev3', old),
], 3, 24 * 3600 * 1000, WINDOW, now)
check('混合（2 窗内 1 超窗）→ 无争议', Object.keys(r11).length === 0, JSON.stringify(r11))

// 12. 无 now 参数时默认以最新举报为基准（向后兼容）
const r12 = computeDisputed([
  rep('a', 'fake', 'dev1', 0),
  rep('a', 'fake', 'dev2', 0),
  rep('a', 'fake', 'dev3', 0),
])
check('默认参数行为不变', r12['a'] && r12['a']['fake'] === 3)

console.log(failures === 0 ? '\nALL PASS' : '\n' + failures + ' FAILED')
process.exit(failures === 0 ? 0 : 1)
