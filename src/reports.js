// dsh-tip-jar/src/reports.js
// 举报争议标记计数逻辑：同一被举报者 + 同一分类，
// 按（设备编号 + 天窗口）去重后累计 ≥ 阈值 → 该分类进入争议状态。
// 纯函数无 IO，Node 可测。防刷：同一设备同一天只计 1 个来源。

const DEFAULT_DAY_MS = 24 * 3600 * 1000

/**
 * 计算争议状态。
 * @param {Array<{targetId:string, category:string, anonId:string, ts:number}>} reports
 * @param {number} threshold 同分类不同来源的阈值（默认 3）
 * @param {number} dayMs 来源去重时间窗口（默认 24h）
 * @param {number} windowMs 争议有效窗口（默认 Infinity=不过滤，向后兼容；Host 调用时传 30 天实现有限期）
 * @param {number} now 判定基准时间（默认 Date.now()）
 * @returns {Record<string, Record<string, number>>} { targetId: { category: 来源数 } }
 */
export function computeDisputed(reports, threshold = 3, dayMs = DEFAULT_DAY_MS, windowMs = Infinity, now = Date.now()) {
  // key = targetId|category → Set<anonId|dayBucket>
  const cutoff = now - windowMs
  const buckets = {}
  for (const r of reports) {
    if (!r || !r.targetId || !r.category || !r.anonId) continue
    if (r.ts < cutoff) continue // 超窗举报不参与（有限期：30 天无新举报自动消退）
    const day = Math.floor(r.ts / dayMs)
    const key = r.targetId + '|' + r.category
    if (!buckets[key]) buckets[key] = new Set()
    buckets[key].add(r.anonId + '|' + day)
  }
  const disputed = {}
  for (const key of Object.keys(buckets)) {
    const count = buckets[key].size
    if (count >= threshold) {
      const sep = key.indexOf('|')
      const targetId = key.slice(0, sep)
      const category = key.slice(sep + 1)
      if (!disputed[targetId]) disputed[targetId] = {}
      disputed[targetId][category] = count
    }
  }
  return disputed
}
