// dsh-tip-jar/test/registry.test.js
// 红绿测试：sponsors.json 注册表校验规则（自包含：fixture 内嵌于 test/fixtures/）
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateRegistry } from '../src/validate.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0
function check(name, cond, detail) {
  if (cond) { console.log('  PASS ' + name) }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')) }
}

const raw = readFileSync(join(root, 'test', 'fixtures', 'sponsors.json'), 'utf8')

// 1. 当前 sponsors.json 应通过校验
let parsed = null
try { parsed = JSON.parse(raw) } catch (e) { /* null */ }
check('sponsors.json 可解析', parsed !== null, 'JSON.parse 失败')
if (parsed !== null) {
  const r = validateRegistry(parsed)
  check('合法注册表通过校验', r.ok === true, 'errors=' + JSON.stringify(r.errors))
}

// 2. 非法 USDC 地址应被拒绝
const badAddr = JSON.parse(raw)
badAddr.contributors[0].tips.usdc = '0x1234'
const r2 = validateRegistry(badAddr)
check('非法 USDC 地址被拒绝', r2.ok === false && JSON.stringify(r2.errors).indexOf('usdc') !== -1)

// 3. 未知 contributorId 应被拒绝
const badRef = JSON.parse(raw)
badRef.plugins[0].contributorId = 'nobody-here'
const r3 = validateRegistry(badRef)
check('未知 contributorId 被拒绝', r3.ok === false && JSON.stringify(r3.errors).indexOf('nobody-here') !== -1)

// 4. 重复 id 应被拒绝
const dup = JSON.parse(raw)
dup.contributors.push({ id: dup.contributors[0].id, alias: 'dup', verified: false, tips: {} })
const r4 = validateRegistry(dup)
check('重复 contributor id 被拒绝', r4.ok === false)

// 5. 非对象输入应被拒绝
check('null 输入被拒绝', validateRegistry(null).ok === false)

console.log(failures === 0 ? '\nALL PASS' : '\n' + failures + ' FAILED')
process.exit(failures === 0 ? 0 : 1)
