// dsh-tip-jar/src/remote.js
// Typert Remote 描述：Host 与 Client 共享的 RPC 契约。
// 参照 dsh-ssh-ops 模式：本地构造 InvocationDescriptor（def 辅助 + zod 信封），
// 不依赖协议包的 def 导出（该包只导出 @Remote 装饰器与类型）。
import { z } from 'zod'

const PACKAGE = 'dsh-tip-jar'
const NS = 'tipJar'

const errorSchema = z.object({ code: z.string(), message: z.string() })
function okSchema(value) {
  return z.object({ ok: z.literal(true), value })
}
function resultSchema(value) {
  return z.union([
    okSchema(value),
    z.object({ ok: z.literal(false), error: errorSchema }),
  ])
}

const registryEntrySchema = z.record(z.any())
const registrySchema = z.object({
  schemaVersion: z.number().optional(),
  privacyNote: z.string().optional(),
  contributors: z.array(registryEntrySchema).default([]),
  plugins: z.array(registryEntrySchema).default([]),
})
const sponsorsLoadSchema = z.object({
  ok: z.boolean(),
  errors: z.array(z.string()).default([]),
  data: registrySchema.nullable(),
})

const statsEntrySchema = z.object({
  count: z.number(),
  amountUsdc: z.number(),
  supporters: z.number().default(0),
  fromSet: z.array(z.string()).default([]),
})

const tipStatsSchema = z.object({
  stats: z
    .object({
      byContributorId: z.record(statsEntrySchema).default({}),
      lastBlock: z.number().default(0),
    })
    .nullable(),
  present: z.boolean().default(false),
})

const saveTipStatsSchema = z.object({ saved: z.boolean() })

const reportReceivedSchema = z.object({ received: z.boolean() })

const disputedSchema = z.object({ disputed: z.record(z.record(z.number())).default({}) })

function def(method, requestSchema, requestType, resultSchema2, resultType) {
  return {
    id: PACKAGE + '#' + NS + '/' + method,
    service: NS,
    namespace: NS,
    method,
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'request',
        wire: 'request',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: PACKAGE + '/types#' + requestType, schema: requestSchema },
      },
    ],
    result: {
      mode: 'strict',
      typeSymbol: PACKAGE + '/types#' + resultType,
      schema: resultSchema2,
    },
    sourceLocation: { file: 'src/index.js', line: 1, column: 1 },
  }
}

const DESCRIPTORS = [
  def(
    'listSponsors',
    z.object({}),
    'TipJarListSponsorsRequest',
    resultSchema(sponsorsLoadSchema),
    'TipJarListSponsorsResult',
  ),
  def(
    'tipStats',
    z.object({}),
    'TipJarTipStatsRequest',
    resultSchema(tipStatsSchema),
    'TipJarTipStatsResult',
  ),
  def(
    'saveTipStats',
    z.object({
      stats: z.object({
        byContributorId: z.record(statsEntrySchema).default({}),
        lastBlock: z.number().default(0),
      }),
    }),
    'TipJarSaveTipStatsRequest',
    resultSchema(saveTipStatsSchema),
    'TipJarSaveTipStatsResult',
  ),
  def(
    'reportContributor',
    z.object({
      targetId: z.string().min(1),
      category: z.enum(['fake', 'copycat', 'phishing', 'paidwall', 'other']),
      anonId: z.string().min(1),
      note: z.string().max(500).optional(),
    }),
    'TipJarReportContributorRequest',
    resultSchema(reportReceivedSchema),
    'TipJarReportContributorResult',
  ),
  def(
    'disputed',
    z.object({}),
    'TipJarDisputedRequest',
    resultSchema(disputedSchema),
    'TipJarDisputedResult',
  ),
]

export const TYPERT_REMOTE = { package: PACKAGE, descriptors: DESCRIPTORS }
export default TYPERT_REMOTE
