// utilities to compute totals

export function computeMonthlyTotals(salary, expenses = [], incomes = [], { includeFuture = true } = {}) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  let expenseThisMonth = 0
  let expenseFuture = 0
  let incomeThisMonth = Number(salary || 0) // salary counts as recurring monthly income
  let incomeFuture = 0

  for (const e of expenses) {
    if (e.recurring) {
      // recurring counted every month
      expenseThisMonth += Number(e.amount || 0)
    } else if (e.date) {
      const d = new Date(e.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        expenseThisMonth += Number(e.amount || 0)
      } else if (d > now) {
        expenseFuture += Number(e.amount || 0)
      }
    }
  }

  for (const i of incomes) {
    if (i.recurring) {
      incomeThisMonth += Number(i.amount || 0)
    } else if (i.date) {
      const d = new Date(i.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        incomeThisMonth += Number(i.amount || 0)
      } else if (d > now) {
        incomeFuture += Number(i.amount || 0)
      }
    }
  }

  const netThisMonth = incomeThisMonth - expenseThisMonth
  const futureNet = incomeFuture - expenseFuture
  const savings = netThisMonth - (includeFuture ? Math.max(0, expenseFuture - incomeFuture) : 0)

  return {
    incomeThisMonth,
    expenseThisMonth,
    futureIncome: incomeFuture,
    futureExpense: expenseFuture,
    thisMonth: expenseThisMonth,
    future: expenseFuture,
    savings
  }
}
