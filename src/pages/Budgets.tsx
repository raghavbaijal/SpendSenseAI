import { useState, useMemo } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { useTransactions } from "../context/TransactionsContext"
import { Link } from "react-router-dom"

const Budgets = () => {
  const { 
    transactions, 
    budgets, 
    updateBudgetLimit, 
    loading, 
    currencySymbol, 
    monthlyCap, 
    totalMonthSpent,
    focusMonth,
    focusYear
  } = useTransactions()
  const [isSyncing, setIsSyncing] = useState(false)

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = months[focusMonth];
  const isCurrentMonth = focusMonth === new Date().getMonth() && focusYear === new Date().getFullYear();

  // Category Spend Calculation
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0)
    })
    return map
  }, [transactions])

  const totalSpent = totalMonthSpent
  const totalAllocated = useMemo(() => 
    Object.values(budgets).reduce((sum, val) => sum + Number(val || 0), 0),
    [budgets]
  )

  const remainingInCap = monthlyCap - totalAllocated
  const isOverAllocated = totalAllocated > monthlyCap
  const capUsagePercent = Math.min(100, monthlyCap > 0 ? (totalAllocated / monthlyCap) * 100 : 0)

  // SMART FALLBACK: If user hasn't allocated, use Cap as the baseline for Remaining & Health
  const remainingToSpend = totalAllocated > 0 ? totalAllocated - totalSpent : monthlyCap - totalSpent
  const healthBase = totalAllocated > 0 ? totalAllocated : monthlyCap
  const healthScore = Math.max(0, Math.min(100, healthBase > 0 ? Math.floor(((healthBase - totalSpent) / healthBase) * 100) : 100))

  const topCategory = useMemo(() => {
    return Object.keys(categorySpend).length > 0
      ? Object.keys(categorySpend).reduce((a, b) => categorySpend[a] > categorySpend[b] ? a : b)
      : "None"
  }, [categorySpend])

  // COMBINED CATEGORIES: Show both allocated and active spending categories
  const allCategories = useMemo(() => {
    return Array.from(new Set([...Object.keys(budgets), ...Object.keys(categorySpend)]))
  }, [budgets, categorySpend])

  // AI Budget Generator (High-Velocity Burst)
  const generateBudget = async (data: any[]) => {
    if (data.length === 0 || monthlyCap === 0) return
    setIsSyncing(true)
    
    const categoryMap: Record<string, number> = {}
    data.forEach((t: any) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount)
    })

    // Batch Update: Calculate all first, then push to context in burst
    const newBudgets = { ...budgets }
    const syncPromises = []

    for (const cat of Object.keys(categoryMap)) {
      const amount = Math.ceil((categoryMap[cat] || 0) * 1.15)
      newBudgets[cat] = amount
      syncPromises.push(updateBudgetLimit(cat, amount))
    }

    // Since updateBudgetLimit is now "Optimistic", the UI will update instantly
    // but we still wait for sync to finish the "isSyncing" state.
    await Promise.all(syncPromises)
    setIsSyncing(false)
  }

  const handleExport = () => {
    if (Object.keys(budgets).length === 0) return
    const headers = ["Category", "Budget Limit", "Total Spent", "Remaining", "Status"]
    const rows = Object.keys(budgets).map(cat => {
      const limit = budgets[cat]
      const spent = categorySpend[cat] || 0
      const remains = limit - spent
      const status = spent > limit ? "OVER BUDGET" : "ON TRACK"
      return [cat, limit, spent, remains, status].join(",")
    })
    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `SpendSense_Budgets_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center animate-pulse text-primary font-bold">
          Aligning Budgets with Hard Cap...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* SETUP REQUIRED STATE */}
        {monthlyCap === 0 ? (
          <section className="bg-secondary/5 p-12 rounded-3xl border border-secondary/20 text-center space-y-6">
             <div className="text-5xl mb-4">🎯</div>
             <h1 className="text-3xl font-black text-white">Financial Target Required</h1>
             <p className="max-w-md mx-auto opacity-60 text-sm leading-relaxed">
                To align your categories with a Hard Cap, you must first define your 
                <strong> Overall Monthly Spending Goal</strong> in Settings.
             </p>
             <Link 
                to="/settings" 
                className="inline-block bg-secondary text-black px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95"
             >
                Define Monthly Cap →
             </Link>
          </section>
        ) : (
          <>
            <div className="flex justify-between items-start text-left">
              <div>
                <h1 className="text-3xl font-bold">Hard Cap Planning</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                    isCurrentMonth ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                  }`}>
                    {isCurrentMonth ? 'Live: ' : 'Viewing: '}{currentMonthName} {focusYear}
                  </span>
                  <p className="opacity-60 text-sm italic">Top-Down Budgeting System</p>
                  {isSyncing && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse border border-primary/30 uppercase font-bold tracking-widest">
                      Cloud Syncing
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isSyncing || Object.keys(budgets).length === 0}
                  onClick={handleExport}
                  className="bg-surface-container px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 font-bold"
                >
                  Export Records
                </button>
                <button
                  onClick={() => generateBudget(transactions)}
                  disabled={isSyncing || transactions.length === 0}
                  className="bg-primary px-4 py-2 rounded-lg text-black font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSyncing ? "Syncing..." : "AI Re-Allocation"}
                </button>
              </div>
            </div>

            {/* TOP LEVEL: HARD CAP ALIGNMENT */}
            <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/30 text-left relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                    isOverAllocated ? 'bg-error/10 text-error border-error/20' : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {isOverAllocated ? '⚠️ Over-Allocated' : '✅ Healthy Allocation'}
                  </span>
               </div>

               <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                  <div>
                     <p className="text-xs opacity-50 uppercase font-bold tracking-tighter mb-1">Total Allocated Limit</p>
                     <h2 className="text-4xl font-bold">
                        {currencySymbol}{totalAllocated.toLocaleString()} 
                        <span className="text-xl opacity-30 font-medium ml-2">/ {currencySymbol}{monthlyCap.toLocaleString()} (Cap)</span>
                     </h2>
                  </div>
                  <div className="text-right">
                     <p className="text-xs opacity-50 uppercase font-bold tracking-tighter mb-1">
                        {isOverAllocated ? 'Exceeding Cap' : 'Unallocated Buffer'}
                     </p>
                     <p className={`text-xl font-bold font-mono ${isOverAllocated ? 'text-error' : totalAllocated === 0 ? 'opacity-30' : 'text-primary'}`}>
                        {isOverAllocated ? '-' : '+'}{currencySymbol}{Math.abs(remainingInCap).toLocaleString()}
                     </p>
                  </div>
               </div>

               {/* Progress Bar */}
               <div className="h-4 bg-background rounded-full overflow-hidden border border-outline-variant/20 p-0.5">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${isOverAllocated ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${capUsagePercent}%` }}
                  />
               </div>
               
               {isOverAllocated && (
                 <p className="mt-4 text-xs text-error font-medium animate-pulse">
                    Your category budgets exceed your monthly cap. Reduce limits to maintain financial health.
                 </p>
               )}
            </div>

            {/* Ledger Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/20">
                <p className="text-xs opacity-50 uppercase font-bold tracking-wider">Actually Spent</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{currencySymbol}{totalSpent.toLocaleString()}</h3>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/20">
                <p className="text-xs opacity-50 uppercase font-bold tracking-wider">Remaining to Spend</p>
                <h3 className={`text-2xl font-bold mt-1 ${remainingToSpend < 0 ? 'text-error' : 'text-secondary'}`}>
                  {remainingToSpend < 0 ? '-' : ''}{currencySymbol}{Math.abs(remainingToSpend).toLocaleString()}
                </h3>
              </div>

              <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                <p className="text-xs text-primary uppercase font-bold tracking-wider">Spending Health</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{healthScore}%</h3>
              </div>
            </div>

            {/* Categories Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Detailed breakdown */}
              <div className="lg:col-span-2 bg-surface-container p-8 rounded-2xl border border-outline-variant/20 text-left">
                <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
                   <span className="w-1.5 h-6 bg-secondary rounded-full" />
                   Category Budget Control
                </h3>
                <div className="space-y-8">
                  {allCategories.length === 0 ? (
                    <div className="text-center py-12 opacity-30 italic">Start assigning limits to your categories.</div>
                  ) : (
                    allCategories.map(cat => {
                      const limit = budgets[cat] || 0
                      const spent = categorySpend[cat] || 0
                      const ratio = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
                      
                      return (
                        <div key={cat} className="group">
                          <div className="flex justify-between items-end mb-2 gap-4">
                            <div className="flex-1">
                              <span className="font-bold text-sm block group-hover:text-primary transition-colors">{cat}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Limit: {currencySymbol}</span>
                                <input 
                                  type="number"
                                  placeholder="0"
                                  value={limit || ""}
                                  onChange={(e) => updateBudgetLimit(cat, Number(e.target.value))}
                                  className="bg-background/50 border border-outline-variant/20 rounded px-2 py-0.5 text-[10px] font-bold w-20 focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] opacity-40 block mb-0.5 uppercase tracking-widest font-bold">Current Spend</span>
                              <span className={`font-mono font-bold text-sm ${limit > 0 && spent > limit ? 'text-error' : 'text-white'}`}>
                                {currencySymbol}{spent.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {limit > 0 ? (
                            <div className="h-2 bg-background rounded-full overflow-hidden border border-outline-variant/10">
                              <div
                                className={`h-full transition-all duration-1000 ${ratio > 95 ? 'bg-error' : ratio > 75 ? 'bg-secondary' : 'bg-primary'}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          ) : (
                            <div className="h-1 bg-background/50 rounded-full border border-dashed border-outline-variant/30" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* AI Optimizer Side */}
              <div className="space-y-6">
                <div className={`p-8 rounded-2xl border transition-all ${
                  isOverAllocated ? 'bg-error/5 border-error/20' : 'bg-primary/5 border-primary/20'
                }`}>
                  <h4 className={`font-bold mb-3 flex items-center gap-2 ${isOverAllocated ? 'text-error' : 'text-primary'}`}>
                    <span className="text-xl">🤖</span> AI Optimization
                  </h4>
                  <p className="text-sm leading-relaxed opacity-70 text-left">
                    {isOverAllocated 
                      ? `CRITICAL: Your budgets are over-allocated by ${currencySymbol}${Math.abs(remainingInCap).toLocaleString()}. I recommend reducing the ${topCategory} limit immediately.`
                      : `STRATEGY: You have ${currencySymbol}${remainingInCap.toLocaleString()} unallocated in your hard cap. Consider moving this to your Savings Goal.`
                    }
                  </p>
                  <button 
                    onClick={() => {
                       const current = budgets[topCategory] || 0;
                       // Suggest a deeper cut if over-allocated
                       const factor = isOverAllocated ? 0.70 : 0.90; 
                       updateBudgetLimit(topCategory, Math.floor(current * factor));
                    }}
                    className={`mt-6 w-full py-3 rounded-xl text-xs font-bold transition-all ${
                       isOverAllocated ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {isOverAllocated ? 'Apply Emergency Cuts' : 'Optimize Peak Spending'}
                  </button>
                </div>

                <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/20 text-left">
                  <h4 className="font-bold text-white mb-4">Financial Guardrails</h4>
                  <ul className="space-y-4">
                     <li className="flex gap-3 text-xs opacity-60">
                        <span className="text-secondary">✔</span> Hard Monthly Cap Enforced
                     </li>
                     <li className="flex gap-3 text-xs opacity-60">
                        <span className="text-secondary">✔</span> Cloud Synchronization Active
                     </li>
                     <li className="flex gap-3 text-xs opacity-60">
                        <span className="text-secondary">✔</span> AI Guardrail Active
                     </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Budgets