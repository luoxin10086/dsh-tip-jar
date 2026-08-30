// dsh-tip-jar/src/onchain.js
// 链上到账雷达纯逻辑：ERC-20 Transfer 查询构造、日志解析、按贡献者聚合、合并、格式化
// 纯函数无 IO，Node 可测；USDC 6 位小数

export const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
export const USDC_DECIMALS = 6

/** 32 字节左补零的 topic 地址（小写）。 */
export function padAddress(address) {
  const hex = address.toLowerCase().replace(/^0x/, '')
  return '0x' + '0'.repeat(64 - hex.length) + hex
}

/** 构造 eth_getLogs JSON-RPC 请求：Transfer 事件、收款方 ∈ 贡献者地址、区块范围。 */
export function buildGetLogsRequest(usdcAddress, contributors, fromBlock, toBlock) {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getLogs',
    params: [
      {
        fromBlock,
        toBlock,
        address: usdcAddress,
        topics: [TRANSFER_TOPIC, null, contributors.map(function (c) { return padAddress(c.usdc) })],
      },
    ],
  }
}

/** 解析原始日志：from/to 从 topic 解包，amount 从 data 解包（uint256），换算 USDC。 */
export function parseTransferLogs(logs, usdcAddress) {
  const out = []
  for (const log of logs) {
    if (!log || !Array.isArray(log.topics) || log.topics.length < 3) continue
    // 只认 USDC 合约自身的日志（防御多合约返回）
    if (usdcAddress && log.address && log.address.toLowerCase() !== usdcAddress.toLowerCase()) continue
    const from = '0x' + log.topics[1].slice(26).toLowerCase()
    const to = '0x' + log.topics[2].slice(26).toLowerCase()
    const raw = parseInt(log.data || '0x0', 16)
    if (!Number.isFinite(raw)) continue
    out.push({
      from,
      to,
      rawAmount: raw,
      amountUsdc: raw / Math.pow(10, USDC_DECIMALS),
      blockNumber: parseInt(log.blockNumber || '0x0', 16),
    })
  }
  return out
}

/** 按贡献者聚合：只统计收款方=贡献者地址的转账；返回 {byContributorId, lastBlock}。 */
export function aggregateStats(logs, contributors) {
  const byContributorId = {}
  let lastBlock = 0
  const addrToId = {}
  for (const c of contributors) {
    if (c.usdc) addrToId[c.usdc.toLowerCase()] = c.id
  }
  for (const t of logs) {
    if (t.blockNumber > lastBlock) lastBlock = t.blockNumber
    const id = addrToId[t.to.toLowerCase()]
    if (!id) continue
    if (!byContributorId[id]) byContributorId[id] = { count: 0, amountUsdc: 0 }
    byContributorId[id].count += 1
    byContributorId[id].amountUsdc += t.amountUsdc
  }
  return { byContributorId, lastBlock }
}

/** 合并两批统计（累加 count/金额，lastBlock 取大）。 */
export function mergeStats(prev, next) {
  const byContributorId = {}
  const all = {}
  for (const stats of [prev || {}, next || {}]) {
    for (const id of Object.keys(stats.byContributorId || {})) {
      const s = stats.byContributorId[id]
      if (!all[id]) all[id] = { count: 0, amountUsdc: 0 }
      all[id].count += s.count || 0
      all[id].amountUsdc += s.amountUsdc || 0
    }
  }
  for (const id of Object.keys(all)) byContributorId[id] = all[id]
  return {
    byContributorId,
    lastBlock: Math.max((prev && prev.lastBlock) || 0, (next && next.lastBlock) || 0),
  }
}

/** 金额展示：两位小数 + 美元符。 */
export function formatUsdc(amountUsdc) {
  return '$' + (Math.round(amountUsdc * 100) / 100).toFixed(2)
}
