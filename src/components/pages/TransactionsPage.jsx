import React from 'react'
import PageWrapper from '../PageWrapper'
import Incomes from '../Incomes'
import Expenses from '../Expenses'
import CSVImport from '../CSVImport'

export default function TransactionsPage({ onOpenCategoryModal, categories, addCategory, incomes = [], expenses = [], onAddIncome, onUpdateIncome, onRemoveIncome, onAddExpense, onUpdateExpense, onRemoveExpense }) {
  return (
    <PageWrapper>
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">Incomes</h2>
            <Incomes incomes={incomes} onAdd={onAddIncome} onUpdate={onUpdateIncome} onRemove={onRemoveIncome} categories={categories} onAddCategory={addCategory} onOpenCategoryModal={onOpenCategoryModal} />
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">Expenses</h2>
            <Expenses expenses={expenses} onAdd={onAddExpense} onUpdate={onUpdateExpense} onRemove={onRemoveExpense} categories={categories} onAddCategory={addCategory} onOpenCategoryModal={onOpenCategoryModal} />
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
