import type { Transaction } from "../types/transactions"

export const getTotalSpending = (transactions: Transaction[]) => {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}

export const getMonthlySpending = (transactions: Transaction[]) => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return transactions
    .filter(t => {
      const d = new Date(t.date)
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

export const getTopCategory = (transactions: Transaction[]) => {
  const categoryMap: Record<string, number> = {}

  transactions.forEach(t => {
    categoryMap[t.category] =
      (categoryMap[t.category] || 0) + t.amount
  })

  const top = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])[0]

  return top ? top[0] : "None"
}

export const getFinancialScore = (transactions: Transaction[]) => {
  const total = getTotalSpending(transactions)

  if (total < 10000) return 90
  if (total < 30000) return 75
  if (total < 50000) return 60
  return 45
}

export const getSavingsPotential = (transactions: Transaction[]) => {
  const total = getTotalSpending(transactions)
  return Math.round(total * 0.15)
}