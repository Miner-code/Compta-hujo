// Simple investment suggestion util.
// Given a monthly projected savings amount, returns a suggested allocation and short explanations.

export function suggestInvestments(monthlySavings, { risk = 'moderate' } = {}) {
  const amt = Number(monthlySavings || 0)
  if (amt <= 0) return { total: 0, suggestions: [] }

  // basic allocation presets by risk
  const presets = {
    conservative: [
      { name: 'Savings account (liquidity)', pct: 50, reason: 'Safety and liquidity' },
      { name: 'Bond / fixed income funds', pct: 30, reason: 'Stable yield' },
      { name: 'Diversified equity ETF', pct: 15, reason: 'Long-term growth' },
      { name: 'Crypto (small allocation)', pct: 5, reason: 'High risk, high potential' }
    ],
    moderate: [
      { name: 'Savings account (liquidity)', pct: 20, reason: "Emergency cushion" },
      { name: 'Diversified equity ETF', pct: 50, reason: 'Balanced growth' },
      { name: 'Bond funds', pct: 20, reason: 'Stability' },
      { name: 'Crypto', pct: 10, reason: 'High risk, limited portion' }
    ],
    aggressive: [
      { name: 'Diversified equity ETF', pct: 60, reason: 'Growth priority' },
      { name: 'Startups / P2P', pct: 20, reason: 'High potential but risky' },
      { name: 'Crypto', pct: 15, reason: 'High risk' },
      { name: 'Savings account', pct: 5, reason: 'Minimal liquidity' }
    ]
  }

  const choice = presets[risk] || presets.moderate
  const suggestions = choice.map(s => ({ ...s, amount: Math.round((s.pct / 100) * amt * 100) / 100 }))

  return { total: amt, suggestions }
}
// Simple heuristic-based investment suggestions based on monthly savings

export function analyzeInvestments(savingsAmount, expenses = [], incomes = []) {
  const suggestions = []
  const s = Number(savingsAmount || 0)

  if (s <= 0) {
    suggestions.push({
      title: 'No surplus this month',
      description: 'You have no positive savings this month — consider reducing expenses or increasing income.'
    })
    return suggestions
  }

  // Emergency fund goal: 3 months of essential expenses
  const essential = estimateEssentialExpenses(expenses)
  const emergencyGoal = essential * 3
  if (s < emergencyGoal * 0.25) {
    suggestions.push({
      title: 'Priority: emergency fund',
      description: `Start building an emergency fund (~${formatCurrency(emergencyGoal)}). Keep it in a liquid savings account.`
    })
  } else if (s < emergencyGoal) {
    suggestions.push({
      title: 'Complete emergency fund',
      description: `You are progressing towards your emergency fund (~${formatCurrency(emergencyGoal)}). Keep contributing monthly.`
    })
  } else {
    suggestions.push({
      title: 'Emergency fund reached',
      description: 'Your emergency fund is covered — you can consider investing part of your savings in higher-yield assets.'
    })
  }

  // If surplus is large, suggest diversified allocation
  if (s >= 200) {
    suggestions.push({
      title: 'Recommended allocation',
      description: 'Example monthly allocation: 50% index ETFs (equities), 30% bonds/fixed income, 10% short-term savings, 10% diversification (crypto/real estate). Adjust to your profile.'
    })
  } else {
    suggestions.push({
      title: 'Small surplus — cautious approach',
      description: 'If you have a small amount to invest, prefer a high-yield savings account or a low-cost ETF via your preferred account (tax rules apply).' 
    })
  }

  // Suggest micro-invest options for recurring small amounts
  if (s < 100) {
    suggestions.push({
      title: 'Micro-investing',
      description: 'Consider automated small monthly investments (eg. recurring ETF purchases) to benefit from dollar-cost averaging.'
    })
  }

  return suggestions
}

function estimateEssentialExpenses(expenses = []) {
  // crude estimate: sum recurring expenses + 50% of non-recurring
  let total = 0
  for (const e of expenses) {
    const amt = Number(e.amount || 0)
    if (e.recurring) total += amt
    else total += amt * 0.5
  }
  return total
}

function formatCurrency(n) {
  return '€' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
