import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { supabase } from "../lib/supabase"

export interface Transaction {
  id: string
  merchant: string
  amount: number
  date: string
  category: string
  user_id?: string
  type?: string
  aiScore?: number
}

export interface Budget {
  id: string
  category: string
  limit: number
  user_id?: string
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  user_id?: string
}

export interface Subscription {
  merchant: string
  amount: number
  frequency: number
  lastDate: string
}

interface TransactionsContextType {
  transactions: Transaction[]
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  budgets: Record<string, number>
  setBudgets: React.Dispatch<React.SetStateAction<Record<string, number>>>
  updateBudgetLimit: (category: string, limit: number) => Promise<void>
  goals: Goal[]
  addGoal: (name: string, target: number) => Promise<void>
  updateGoalProgress: (id: string, saved: number) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  currency: string
  currencySymbol: string
  updateCurrency: (code: string, symbol: string) => Promise<void>
  monthlyCap: number
  updateMonthlyCap: (limit: number) => Promise<void>
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  dailyVelocity: number
  projectedMonthEnd: number
  rolloverBonus: number
  subscriptions: Subscription[]
  totalMonthSpent: number
  focusMonth: number
  focusYear: number
  setFocusDate: (month: number, year: number) => void
  loading: boolean
  refreshTransactions: () => Promise<void>
  clearAllTransactions: () => Promise<void>
}

const TransactionsContext = createContext<TransactionsContextType>({} as TransactionsContextType)

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [currency, setCurrency] = useState("INR")
  const [currencySymbol, setCurrencySymbol] = useState("₹")
  const [monthlyCap, setMonthlyCap] = useState(0)
  const [loading, setLoading] = useState(true)

  // Focus State (Data-Driven Timeline)
  const [focusMonth, setFocusMonth] = useState(new Date().getMonth())
  const [focusYear, setFocusYear] = useState(new Date().getFullYear())

  const setFocusDate = (month: number, year: number) => {
    setFocusMonth(month)
    setFocusYear(year)
  }

  // AUTO-FOCUS: When transactions change, jump to the most recent data
  useEffect(() => {
    if (transactions.length > 0) {
      const mostRecent = transactions.reduce((prev, current) => {
        return (new Date(prev.date) > new Date(current.date)) ? prev : current
      })
      const d = new Date(mostRecent.date)
      setFocusMonth(d.getMonth())
      setFocusYear(d.getFullYear())
    }
  }, [transactions.length]) // Only jump when transactions are added/cleared

  // Cloud Sync Helpers
  const refreshTransactions = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // 0. Primary Sync: Load from User Metadata (Ensures persistent settings even if DB table is missing)
      const metaCap = user.user_metadata?.monthly_cap
      const metaCurrency = user.user_metadata?.currency
      const metaSymbol = user.user_metadata?.currency_symbol

      if (metaCap !== undefined) setMonthlyCap(Number(metaCap))
      if (metaCurrency) setCurrency(metaCurrency)
      if (metaSymbol) setCurrencySymbol(metaSymbol)

      // 1. Fetch Transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
      
      if (txData) setTransactions(txData)

      // 2. Fetch Budgets
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
      
      if (budgetData) {
        const budgetMap = budgetData.reduce((acc, b) => ({ ...acc, [b.category]: b.limit }), {})
        setBudgets(budgetMap)
      }

      // 3. Fetch Goals
      const { data: goalData } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
      
      if (goalData) setGoals(goalData)

      // 4. Secondary Sync: Profiles Table (Try-Catch to prevent crashes if table is missing)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("monthly_cap, currency_code, currency_symbol")
          .eq("id", user.id)
          .single()
        
        if (profile) {
          if (profile.monthly_cap) setMonthlyCap(profile.monthly_cap)
          if (profile.currency_code) setCurrency(profile.currency_code)
          if (profile.currency_symbol) setCurrencySymbol(profile.currency_symbol)
        }
      } catch (e) {
        console.warn("Profiles table fallback:", e)
      }
    }
    setLoading(false)
  }

  const updateMonthlyCap = async (limit: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Sync 1: Auth User Metadata (Permanent in JWT)
      await supabase.auth.updateUser({
        data: { monthly_cap: limit }
      })

      // Sync 2: Profiles Table (For database analysis)
      await supabase
        .from("profiles")
        .upsert({ id: user.id, monthly_cap: limit }, { onConflict: "id" })
      
      setMonthlyCap(limit)
    }
  }

  const updateCurrency = async (code: string, symbol: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Sync 1: Auth User Metadata
      await supabase.auth.updateUser({
        data: { currency: code, currency_symbol: symbol }
      })

      // Sync 2: Profiles Table
      await supabase
        .from("profiles")
        .upsert({ id: user.id, currency_code: code, currency_symbol: symbol }, { onConflict: "id" })
      
      setCurrency(code)
      setCurrencySymbol(symbol)
    }
  }

  const addTransaction = async (tx: Omit<Transaction, "id">) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // 1. Prepare DB-Compliant Object (Don't insert custom UI-only fields)
      const dbInsert = { 
        merchant: tx.merchant,
        amount: Math.abs(Number(tx.amount || 0)),
        date: tx.date || new Date().toISOString(),
        category: tx.category || "Other",
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert(dbInsert)
        .select()
        .single()
      
      if (data && !error) {
        // 2. Hydrate local state with UI-only fields if provided
        setTransactions(prev => [{ ...data, ...tx }, ...prev])
      } else if (error) {
        console.error("Manual add failed in Cloud:", error)
        // Add locally anyway for UX if DB is missing some columns? 
        // No, let's keep sync strict.
      }
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
    
    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    }
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
    
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  const updateBudgetLimit = async (category: string, limit: number) => {
    // 1. Optimistic UI Update (Local-First Instant Feedback)
    setBudgets(prev => ({ ...prev, [category]: limit }))

    // 2. Background Cloud Sync (Silent)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from("budgets")
        .upsert({ user_id: user.id, category, limit }, { onConflict: "user_id,category" })
      
      if (error) {
        console.error("Cloud Sync Failed (Budget):", error)
        // Optionally revert if critical, but for budgets, persistence retry is better
      }
    }
  }

  // Goal Cloud Helpers
  const addGoal = async (name: string, target: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from("goals").insert({
        user_id: user.id,
        name,
        target,
        saved: 0
      }).select().single()
      
      if (error) {
        console.error("Error adding goal:", error)
        return
      }
      if (data) setGoals(prev => [...prev, data])
    }
  }

  const updateGoalProgress = async (id: string, saved: number) => {
    const { error } = await supabase.from("goals").update({ saved, updated_at: new Date().toISOString() }).eq("id", id)
    if (!error) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, saved } : g))
    }
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id)
    if (!error) {
      setGoals(prev => prev.filter(g => g.id !== id))
    }
  }

  // Global Clear for ALL Data (Total Reset)
  const clearAllTransactions = async () => {
    try {
      setTransactions([])
      setBudgets({})
      setGoals([])
      localStorage.removeItem("transactions")
      localStorage.removeItem("user_budgets")
      localStorage.removeItem("user_goals")

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await Promise.all([
          supabase.from("transactions").delete().eq("user_id", user.id),
          supabase.from("budgets").delete().eq("user_id", user.id),
          supabase.from("goals").delete().eq("user_id", user.id)
        ])
      }
      alert("Total Reset Successful. All data, budgets, and goals have been cleared.")
    } catch (err) {
      console.error("Failed to clear data:", err)
    }
  }

  // Initial Load
  useEffect(() => {
    const storedTx = localStorage.getItem("transactions")
    const storedBudgets = localStorage.getItem("user_budgets")
    const storedGoals = localStorage.getItem("user_goals")
    
    if (storedTx) setTransactions(JSON.parse(storedTx))
    if (storedBudgets) setBudgets(JSON.parse(storedBudgets))
    if (storedGoals) setGoals(JSON.parse(storedGoals))
    
    refreshTransactions()
  }, [])


  // Financial Brain (Focus-Aware Technology)
  const currentMonthStats = useMemo(() => {
    const isCurrentMonth = focusMonth === new Date().getMonth() && focusYear === new Date().getFullYear()
    const daysInMonth = new Date(focusYear, focusMonth + 1, 0).getDate()
    
    // If viewing the past, we use the full month. If viewing "now", we use today's date for velocity.
    const dayOfMonth = isCurrentMonth ? Math.max(1, new Date().getDate()) : daysInMonth

    // 1. Focus Month Filter
    const monthTx = transactions.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date)
      return d.getMonth() === focusMonth && d.getFullYear() === focusYear
    })
    
    const spent = monthTx.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)
    const velocity = spent / dayOfMonth
    const projected = velocity * daysInMonth

    return { spent, velocity, projected }
  }, [transactions, focusMonth, focusYear])

  const rolloverBonus = useMemo(() => {
    if (monthlyCap <= 0) return 0
    const lastMonth = focusMonth === 0 ? 11 : focusMonth - 1
    const lastMonthYear = focusMonth === 0 ? focusYear - 1 : focusYear
    
    const lastMonthTx = transactions.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })
    
    const spent = lastMonthTx.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)
    return Math.max(0, monthlyCap - spent)
  }, [transactions, monthlyCap, focusMonth, focusYear])

  const totalMonthSpent = currentMonthStats.spent
  const dailyVelocity = currentMonthStats.velocity
  const projectedMonthEnd = currentMonthStats.projected

  // 3. Ghost Hunter 2.0 (Predictive & Heuristic Subscription Detection)
  const subscriptions = useMemo(() => {
    const KNOWN_GIANTS = [
      "netflix", "spotify", "youtube", "amazon", "prime", "apple", "google", "cloud", "icloude", 
      "disney", "hotstar", "zee5", "sonyliv", "hulu", "hbo", "paramount", "audible", "kindle",
      "adobe", "microsoft", "office", "figma", "notion", "chatgpt", "midjourney", "openai",
      "bescom", "airtel", "jio", "vodafone", "vi", "broadband", "act", "hathway", "utilities",
      "lic", "insurance", "premium", "rent", "gym", "cult", "member"
    ]

    const detected: Record<string, Subscription> = {}
    
    // HEURISTIC 1: Instant Detection (Known Giants - Even with 1 month data)
    transactions.forEach(t => {
      const merchant = t.merchant.toLowerCase()
      const isKnown = KNOWN_GIANTS.some(giant => merchant.includes(giant))
      
      if (isKnown) {
        const key = t.merchant.toUpperCase()
        // Keep the most recent occurrence as the reference
        if (!detected[key] || new Date(t.date) > new Date(detected[key].lastDate)) {
          detected[key] = {
             merchant: t.merchant,
             amount: Math.abs(Number(t.amount || 0)),
             frequency: 30, // Heuristic default
             lastDate: t.date
          }
        }
      }
    })

    // HEURISTIC 2: Pattern Recognition (Multi-month logic)
    const groups: Record<string, Transaction[]> = {}
    transactions.forEach(t => {
      // Fuzzy group by merchant vibe (first word) + amount
      const merchantVibe = t.merchant.toLowerCase().split(" ")[0]
      const key = `${merchantVibe}-${Math.round(t.amount)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })

    Object.values(groups).forEach(group => {
      if (group.length >= 2) {
        const sorted = [...group].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        let totalGap = 0
        for (let i = 0; i < sorted.length - 1; i++) {
          const d1 = new Date(sorted[i].date).getTime()
          const d2 = new Date(sorted[i+1].date).getTime()
          totalGap += (d1 - d2) / (1000 * 60 * 60 * 24)
        }
        const avgGap = totalGap / (sorted.length - 1)

        // Standard monthly frequency (25-35 day window)
        if (avgGap >= 25 && avgGap <= 35) {
          const key = sorted[0].merchant.toUpperCase()
          detected[key] = {
            merchant: sorted[0].merchant,
            amount: Math.abs(Number(sorted[0].amount || 0)),
            frequency: Math.round(avgGap),
            lastDate: sorted[0].date
          }
        }
      }
    })

    return Object.values(detected)
  }, [transactions])

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        setTransactions,
        budgets,
        updateBudgetLimit,
        setBudgets,
        goals,
        addGoal,
        updateGoalProgress,
        deleteGoal,
        currency,
        currencySymbol,
        updateCurrency,
        monthlyCap,
        updateMonthlyCap,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        dailyVelocity,
        projectedMonthEnd,
        rolloverBonus,
        totalMonthSpent,
        focusMonth,
        focusYear,
        setFocusDate,
        subscriptions,
        loading,
        refreshTransactions,
        clearAllTransactions
      }}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

export const useTransactions = () => useContext(TransactionsContext)