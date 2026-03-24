// Comprehensive credit card earning rates by spending category
// Used by the Earning Calculator tool

export type SpendingCategory =
  | 'dining'
  | 'groceries'
  | 'travel'
  | 'gas'
  | 'streaming'
  | 'online_shopping'
  | 'drugstores'
  | 'transit'
  | 'rent'
  | 'general'

export const categoryLabels: Record<SpendingCategory, string> = {
  dining: 'Dining & Restaurants',
  groceries: 'Groceries',
  travel: 'Travel (Flights, Hotels)',
  gas: 'Gas Stations',
  streaming: 'Streaming Services',
  online_shopping: 'Online Shopping',
  drugstores: 'Drugstores',
  transit: 'Transit & Rideshare',
  rent: 'Rent',
  general: 'Everything Else',
}

export const categoryIcons: Record<SpendingCategory, string> = {
  dining: '🍽️',
  groceries: '🛒',
  travel: '✈️',
  gas: '⛽',
  streaming: '📺',
  online_shopping: '🛍️',
  drugstores: '💊',
  transit: '🚇',
  rent: '🏠',
  general: '💳',
}

export type CreditCard = {
  name: string
  issuer: string
  annualFee: number
  rewardsProgram: string
  /** Points or miles earned per dollar spent, by category */
  earningRates: Partial<Record<SpendingCategory, number>>
  /** Default earning rate for categories not listed */
  baseRate: number
  /** Notable perks relevant to travelers */
  perks: string[]
  /** Card network */
  network: 'Visa' | 'Mastercard' | 'Amex'
}

export const creditCards: CreditCard[] = [
  // ── Chase ──────────────────────────────────────────────
  {
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    rewardsProgram: 'Chase Ultimate Rewards',
    earningRates: {
      dining: 3,
      online_shopping: 3,
      travel: 5,
      streaming: 3,
    },
    baseRate: 1,
    perks: ['1.25x value in Chase Travel Portal', '1:1 transfer to 10 airline/hotel partners'],
    network: 'Visa',
  },
  {
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 550,
    rewardsProgram: 'Chase Ultimate Rewards',
    earningRates: {
      dining: 3,
      travel: 10,
    },
    baseRate: 1,
    perks: ['1.5x value in Chase Travel Portal', '$300 travel credit', 'Priority Pass lounge access', '1:1 transfer to partners'],
    network: 'Visa',
  },
  {
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    rewardsProgram: 'Chase Ultimate Rewards',
    earningRates: {
      dining: 3,
      drugstores: 3,
      travel: 5,
    },
    baseRate: 1.5,
    perks: ['Earn UR if paired with Sapphire', 'No annual fee'],
    network: 'Visa',
  },
  {
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    annualFee: 0,
    rewardsProgram: 'Chase Ultimate Rewards',
    earningRates: {
      dining: 3,
      drugstores: 3,
      travel: 5,
    },
    baseRate: 1,
    perks: ['5x on rotating quarterly categories (up to $1,500/quarter)', 'No annual fee'],
    network: 'Mastercard',
  },
  {
    name: 'Ink Business Preferred',
    issuer: 'Chase',
    annualFee: 95,
    rewardsProgram: 'Chase Ultimate Rewards',
    earningRates: {
      travel: 3,
      online_shopping: 3,
      streaming: 3,
    },
    baseRate: 1,
    perks: ['3x on first $150K/year in combined categories', '1:1 transfer to partners'],
    network: 'Visa',
  },

  // ── Amex ───────────────────────────────────────────────
  {
    name: 'Amex Gold Card',
    issuer: 'Amex',
    annualFee: 325,
    rewardsProgram: 'Amex Membership Rewards',
    earningRates: {
      dining: 4,
      groceries: 4,
      travel: 3,
    },
    baseRate: 1,
    perks: ['$120 dining credit', '$120 Uber Cash', '1:1 transfer to 17+ airline partners'],
    network: 'Amex',
  },
  {
    name: 'Amex Platinum',
    issuer: 'Amex',
    annualFee: 695,
    rewardsProgram: 'Amex Membership Rewards',
    earningRates: {
      travel: 5,
    },
    baseRate: 1,
    perks: ['$200 airline fee credit', '$200 hotel credit', '$200 Uber Cash', 'Centurion Lounge access', 'Priority Pass', '1:1 transfer to partners'],
    network: 'Amex',
  },
  {
    name: 'Amex Blue Business Plus',
    issuer: 'Amex',
    annualFee: 0,
    rewardsProgram: 'Amex Membership Rewards',
    earningRates: {},
    baseRate: 2,
    perks: ['2x on first $50K/year, then 1x', 'No annual fee', 'Earns transferable MR points'],
    network: 'Amex',
  },
  {
    name: 'Amex Green Card',
    issuer: 'Amex',
    annualFee: 150,
    rewardsProgram: 'Amex Membership Rewards',
    earningRates: {
      dining: 3,
      travel: 3,
      transit: 3,
    },
    baseRate: 1,
    perks: ['$189 CLEAR Plus credit', '1:1 transfer to partners'],
    network: 'Amex',
  },

  // ── Citi ───────────────────────────────────────────────
  {
    name: 'Citi Strata Premier',
    issuer: 'Citi',
    annualFee: 95,
    rewardsProgram: 'Citi ThankYou Points',
    earningRates: {
      dining: 3,
      groceries: 3,
      travel: 3,
      gas: 3,
    },
    baseRate: 1,
    perks: ['$100 hotel credit', '1:1 transfer to 15+ partners', 'Only major card that transfers to AA'],
    network: 'Mastercard',
  },
  {
    name: 'Citi Double Cash',
    issuer: 'Citi',
    annualFee: 0,
    rewardsProgram: 'Citi ThankYou Points',
    earningRates: {},
    baseRate: 2,
    perks: ['2% on everything (1% when you buy + 1% when you pay)', 'No annual fee', 'Earns transferable TYP'],
    network: 'Mastercard',
  },
  {
    name: 'Citi Custom Cash',
    issuer: 'Citi',
    annualFee: 0,
    rewardsProgram: 'Citi ThankYou Points',
    earningRates: {
      dining: 5,
      groceries: 5,
      gas: 5,
      travel: 5,
      transit: 5,
      streaming: 5,
      drugstores: 5,
    },
    baseRate: 1,
    perks: ['5x on your top spending category each billing cycle (up to $500)', 'No annual fee'],
    network: 'Mastercard',
  },

  // ── Capital One ────────────────────────────────────────
  {
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    rewardsProgram: 'Capital One Miles',
    earningRates: {
      travel: 10,
    },
    baseRate: 2,
    perks: ['$300 travel credit', 'Priority Pass + Capital One Lounges', '1:1 transfer to 18+ partners', '10,000 anniversary miles'],
    network: 'Visa',
  },
  {
    name: 'Capital One Venture',
    issuer: 'Capital One',
    annualFee: 95,
    rewardsProgram: 'Capital One Miles',
    earningRates: {},
    baseRate: 2,
    perks: ['2x on everything', '1:1 transfer to partners', 'Can erase travel purchases'],
    network: 'Visa',
  },
  {
    name: 'Capital One Savor',
    issuer: 'Capital One',
    annualFee: 95,
    rewardsProgram: 'Capital One Miles',
    earningRates: {
      dining: 4,
      streaming: 4,
      groceries: 3,
    },
    baseRate: 1,
    perks: ['4x dining & entertainment', '1:1 transfer to partners when paired with Venture'],
    network: 'Mastercard',
  },

  // ── Bilt ───────────────────────────────────────────────
  {
    name: 'Bilt Mastercard',
    issuer: 'Bilt',
    annualFee: 0,
    rewardsProgram: 'Bilt Rewards',
    earningRates: {
      dining: 3,
      travel: 2,
      rent: 1,
    },
    baseRate: 1,
    perks: ['Only card that earns points on rent with no fees', 'No annual fee', '1:1 transfer to 18+ partners', 'Rent Day 1st of month: double points on non-rent'],
    network: 'Mastercard',
  },

  // ── Standalone Travel Cards ────────────────────────────
  {
    name: 'United Explorer Card',
    issuer: 'Chase',
    annualFee: 95,
    rewardsProgram: 'United MileagePlus',
    earningRates: {
      dining: 2,
      travel: 2,
    },
    baseRate: 1,
    perks: ['Free checked bag on United', 'United Club passes', '25% back on United inflight purchases'],
    network: 'Visa',
  },
  {
    name: 'Delta SkyMiles Gold',
    issuer: 'Amex',
    annualFee: 150,
    rewardsProgram: 'Delta SkyMiles',
    earningRates: {
      dining: 2,
      groceries: 2,
      travel: 2,
    },
    baseRate: 1,
    perks: ['Free checked bag on Delta', 'Main Cabin 1 boarding', '$200 flight credit after $10K spend'],
    network: 'Amex',
  },
  {
    name: 'AAdvantage Aviator Red',
    issuer: 'Barclays',
    annualFee: 99,
    rewardsProgram: 'American Airlines AAdvantage',
    earningRates: {},
    baseRate: 1,
    perks: ['Free checked bag on AA', 'Preferred boarding', 'Companion certificate after $20K spend'],
    network: 'Mastercard',
  },
  {
    name: 'Southwest Rapid Rewards Plus',
    issuer: 'Chase',
    annualFee: 69,
    rewardsProgram: 'Southwest Rapid Rewards',
    earningRates: {
      transit: 2,
    },
    baseRate: 1,
    perks: ['3,000 anniversary points', 'Earns toward Companion Pass', '2x on Southwest purchases'],
    network: 'Visa',
  },
  {
    name: 'Alaska Airlines Visa Signature',
    issuer: 'Bank of America',
    annualFee: 100,
    rewardsProgram: 'Alaska Airlines Mileage Plan',
    earningRates: {
      gas: 3,
      streaming: 3,
      transit: 3,
    },
    baseRate: 1,
    perks: ['Companion Fare from $99', 'Free checked bag on Alaska', '3x on eligible purchases'],
    network: 'Visa',
  },
]

/** Get the earning rate for a specific card and category */
export function getEarningRate(card: CreditCard, category: SpendingCategory): number {
  return card.earningRates[category] ?? card.baseRate
}

/** Get all cards sorted by earning rate for a given category (best first) */
export function getBestCardsForCategory(category: SpendingCategory): (CreditCard & { rate: number })[] {
  return creditCards
    .map(card => ({ ...card, rate: getEarningRate(card, category) }))
    .sort((a, b) => b.rate - a.rate)
}

/** Get the best card across categories for a spending profile */
export function optimizeSpending(
  monthlySpend: Partial<Record<SpendingCategory, number>>
): { card: CreditCard; category: SpendingCategory; spend: number; pointsEarned: number; rate: number }[] {
  const results: { card: CreditCard; category: SpendingCategory; spend: number; pointsEarned: number; rate: number }[] = []

  for (const [cat, amount] of Object.entries(monthlySpend) as [SpendingCategory, number][]) {
    if (!amount || amount <= 0) continue
    const best = getBestCardsForCategory(cat)[0]
    if (best) {
      results.push({
        card: best,
        category: cat,
        spend: amount,
        pointsEarned: Math.round(amount * best.rate),
        rate: best.rate,
      })
    }
  }

  return results.sort((a, b) => b.pointsEarned - a.pointsEarned)
}
