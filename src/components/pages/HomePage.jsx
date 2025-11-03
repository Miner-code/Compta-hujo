import React from 'react'
import PageWrapper from '../PageWrapper'

export default function HomePage() {
  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold mb-2">Welcome to Compta</h1>
          <p className="text-gray-600">A clean, simple way to track your money. Use the navigation to move between Dashboard, Transactions and Investment suggestions.</p>
        </div>
      </section>
    </PageWrapper>
  )
}
