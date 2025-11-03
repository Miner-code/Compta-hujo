import React from 'react'
import PageWrapper from '../PageWrapper'
import PieChart from '../PieChart'
import { suggestInvestments } from '../../utils/investment'

export default function InvestPage({ savings }) {
  const plan = suggestInvestments(savings, { risk: 'moderate' })
  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Investment suggestions</h2>
          <div className="md:flex md:items-start md:gap-6">
            <div className="md:w-1/3">
              <PieChart labels={plan.suggestions.map(s=>s.name)} values={plan.suggestions.map(s=>s.amount)} />
            </div>
            <div className="flex-1 mt-4 md:mt-0">
              {plan.suggestions.map(s => (
                <div key={s.name} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.reason}</div>
                  </div>
                  <div className="font-semibold">€{s.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
