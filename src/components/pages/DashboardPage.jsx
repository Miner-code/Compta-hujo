import React from 'react'
import PageWrapper from '../PageWrapper'
import Dashboard from '../Dashboard'

export default function DashboardPage({ salary, expenses, incomes, initialBalance }) {
  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="card p-6">
          <Dashboard salary={salary} expenses={expenses} incomes={incomes} initialBalance={initialBalance} />
        </div>
      </section>
    </PageWrapper>
  )
}
