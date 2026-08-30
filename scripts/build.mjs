// dsh-tip-jar/scripts/build.mjs
// esbuild 构建：lib/index.js（host ESM）、lib/remote.js（共享契约）、
// lib/client.js（浏览器 bundle，包装为 window.__ModuleLoader__.load 格式）
import { build } from 'esbuild'
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'

mkdirSync('lib', { recursive: true })

const EXTERNAL = ['@deepseek-ai/*']

await build({
  entryPoints: ['src/index.js'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: EXTERNAL,
})

await build({
  entryPoints: ['src/remote.js'],
  outfile: 'lib/remote.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: EXTERNAL,
})

await build({
  entryPoints: ['src/typert.js'],
  outfile: 'lib/typert.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: EXTERNAL,
})

await build({
  entryPoints: ['src/client.js'],
  outfile: 'lib/.client.tmp.js',
  bundle: true,
  format: 'iife',
  globalName: '__tipJarClient',
  platform: 'browser',
  target: 'es2020',
  external: ['react'],
})

const bundle = readFileSync('lib/.client.tmp.js', 'utf8')
const wrapped =
  'window.__ModuleLoader__.load({\n' +
  '\tid: "dsh-tip-jar",\n' +
  '\tfactory: (require) => {\n' +
  bundle +
  '\n\t\treturn __tipJarClient.default || __tipJarClient;\n' +
  '\t}\n' +
  '});\n'
writeFileSync('lib/client.js', wrapped)
rmSync('lib/.client.tmp.js')

console.log('built lib/index.js, lib/remote.js, lib/client.js')
