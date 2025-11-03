// utilities to compute totals

export function computeMonthlyTotals(salary, expenses = [], incomes = [], { includeFuture = true, initialBalance = 0 } = {}) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

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

  let incomeRemaining = 0
  let expenseRemaining = 0

  function dayOfMonthFrom(d) {
    if (!d) return null
    try {
      const dt = new Date(d)
      return dt.getDate()
    } catch (e) { return null }
  }

  // non-recurring items scheduled later this month
  for (const e of expenses) {
    if (e.recurring) {
      const ds = dayOfMonthFrom(e.recurringStart)
      if (ds && ds >= today) {
        expenseRemaining += Number(e.amount || 0)
      }
    } else if (e.date) {
      const d = new Date(e.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (d.getDate() >= today) expenseRemaining += Number(e.amount || 0)
      }
    }
  }

  for (const i of incomes) {
    if (i.recurring) {
      const ds = dayOfMonthFrom(i.recurringStart)
      if (ds && ds >= today) {
        incomeRemaining += Number(i.amount || 0)
      }
    } else if (i.date) {
      const d = new Date(i.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (d.getDate() >= today) incomeRemaining += Number(i.amount || 0)
      }
    }
  }

  // handle salary heuristically: assume occurs on day 1 of month
  if (Number(salary) && today === 1) incomeRemaining += Number(salary || 0)

  const projectedRemaining = (Number(initialBalance) || 0) + incomeRemaining - expenseRemaining

  const netThisMonth = incomeThisMonth - expenseThisMonth
  const futureNet = incomeFuture - expenseFuture
  const savings = netThisMonth - (includeFuture ? Math.max(0, expenseFuture - incomeFuture) : 0)
  const availableNow = (Number(initialBalance) || 0) + incomeThisMonth - expenseThisMonth

  return {
    incomeThisMonth,
    expenseThisMonth,
    futureIncome: incomeFuture,
    futureExpense: expenseFuture,
    thisMonth: expenseThisMonth,
    future: expenseFuture,
    savings,
    availableNow,
    projectedRemaining
  }
}
