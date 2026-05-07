
export interface ScoringInput {
  rawPrice: number | null
  psa10Price: number | null
  psa9Price: number | null
  gradedPrice: number | null
  volume: number
  rarity: string
  releaseYear: number | null
  gradingCost?: number
  ebayFee?: number
}

export interface ScoreResult {
  total: number
  spreadScore: number
  momentumScore: number
  liquidityScore: number
  rarityScore: number
  volatilityScore: number
  confidenceScore: number
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'WATCH'
  reason: string
  estimatedUpside: number | null
  buyUnder: number | null
  netProfit: number | null
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v))

export function scoreCard(input: ScoringInput): ScoreResult {
  const { rawPrice, psa10Price, psa9Price, volume, rarity, releaseYear, gradingCost = 25, ebayFee = 0.129 } = input

  // ── Spread score (PSA10 vs raw) ───────────────────────────────────────────
  let spreadScore = 40
  let estimatedUpside: number | null = null
  let netProfit: number | null = null
  let buyUnder: number | null = null

  if (rawPrice && psa10Price && psa10Price > rawPrice) {
    const mult = psa10Price / rawPrice
    spreadScore = clamp(Math.round((mult - 1) * 20))
    const saleNet = psa10Price * (1 - ebayFee) - gradingCost
    netProfit = saleNet - rawPrice
    estimatedUpside = rawPrice > 0 ? Math.round((netProfit / rawPrice) * 100) : null
    buyUnder = Math.round((saleNet - gradingCost * 0.5) / 1.25)
  }

  // ── Liquidity score ───────────────────────────────────────────────────────
  const liquidityScore = clamp(Math.round(Math.min(volume / 30, 1) * 80 + 10))

  // ── Rarity score ─────────────────────────────────────────────────────────
  const rarityMap: Record<string, number> = {
    'Illustration Rare': 95, 'Special Illustration Rare': 95, 'Hyper Rare': 90,
    'Secret Rare': 85, 'Rare Holo VMAX': 80, 'Rare Holo VSTAR': 78,
    'Rare Holo V': 75, 'Rare Holo': 70, 'Rare': 55, 'Uncommon': 30, 'Common': 15,
  }
  const rarityScore = rarityMap[rarity] ?? 45

  // ── Momentum / age ───────────────────────────────────────────────────────
  const year = releaseYear ?? 2020
  const age = new Date().getFullYear() - year
  const momentumScore = clamp(age > 20 ? 80 : age > 10 ? 65 : age > 5 ? 50 : 35)

  // ── Confidence score ──────────────────────────────────────────────────────
  let confidence = 40
  if (rawPrice) confidence += 25
  if (psa10Price) confidence += 20
  if (psa9Price) confidence += 10
  if (volume > 5) confidence += 5
  const confidenceScore = clamp(confidence)

  // ── Volatility (inverted — stable = better) ────────────────────────────
  const volatilityScore = clamp(volume > 20 ? 70 : volume > 5 ? 55 : 35)

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = clamp(Math.round(
    spreadScore * 0.30 +
    liquidityScore * 0.20 +
    rarityScore * 0.20 +
    momentumScore * 0.15 +
    volatilityScore * 0.10 +
    confidenceScore * 0.05
  ))

  // ── Recommendation ────────────────────────────────────────────────────────
  let recommendation: ScoreResult['recommendation'] = 'WATCH'
  let reason = 'Insufficient data to make a confident recommendation.'

  if (confidenceScore < 40) {
    recommendation = 'WATCH'
    reason = 'Limited pricing data available. Monitor before committing.'
  } else if (estimatedUpside !== null && estimatedUpside > 40 && liquidityScore > 40) {
    recommendation = 'BUY'
    reason = `Strong PSA 10 spread with ${estimatedUpside}% estimated upside after fees. Solid liquidity.`
  } else if (estimatedUpside !== null && estimatedUpside > 20) {
    recommendation = 'BUY'
    reason = `Decent grading upside (~${estimatedUpside}%). Consider buying raw and grading.`
  } else if (total > 60) {
    recommendation = 'HOLD'
    reason = 'Good fundamentals. Hold for appreciation or grade if condition is strong.'
  } else if (total < 35 && rawPrice) {
    recommendation = 'SELL'
    reason = 'Weak spread, low liquidity, or unfavorable risk profile. Consider selling.'
  } else {
    recommendation = 'HOLD'
    reason = 'Stable card. Hold and monitor for price movement.'
  }

  return { total, spreadScore, momentumScore, liquidityScore, rarityScore, volatilityScore, confidenceScore, recommendation, reason, estimatedUpside, buyUnder, netProfit }
}
