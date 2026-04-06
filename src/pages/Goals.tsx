import DashboardLayout from "../components/layout/DashboardLayout"
import { useTransactions } from "../context/TransactionsContext"

const Goals = () => {
  const { transactions, goals, addGoal, updateGoalProgress, deleteGoal, loading, currencySymbol } = useTransactions()

  // 1. IMPROVED: AI Savings Calculation (Based on Average Monthly Spending Volume)
  const totalSpentAcrossAllTime = transactions.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount || 0)),
    0
  )

  // Determine months covered by data (at least 1 to avoid division by zero)
  const monthKeys = new Set(transactions.map(t => {
    const d = new Date(t.date)
    return `${d.getFullYear()}-${d.getMonth()}`
  }))
  const monthsCount = Math.max(1, monthKeys.size)
  const avgMonthlySpent = totalSpentAcrossAllTime / monthsCount
  
  // Estimate 15% of average monthly activity as potential savings
  const monthlySavingsEstimate = Math.max(0, Math.floor(avgMonthlySpent * 0.15))

  // 2. IMPROVED: Goal Stats & Intelligent Ranking
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target), 0)
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.saved), 0)
  const completionPercent = totalTarget ? Math.floor((totalSaved / totalTarget) * 100) : 0

  // Filter and Sort Active Goals (Closest to completion first)
  const activeGoals = goals
    .filter(g => Number(g.saved || 0) < Number(g.target || 0))
    .sort((a, b) => {
      const aProgress = Number(a.target) > 0 ? (Number(a.saved) / Number(a.target)) : 0
      const bProgress = Number(b.target) > 0 ? (Number(b.saved) / Number(b.target)) : 0
      return bProgress - aProgress
    })

  const completedGoals = goals.filter(g => g.saved >= g.target)

  const handleCreateGoal = async () => {
    const name = prompt("Enter Goal Name (e.g. Dream Car, Emergency Fund)")
    if (!name || name.trim() === "") return

    const targetStr = prompt(`Enter Target Amount (${currencySymbol})`)
    const target = Number(targetStr)
    if (isNaN(target) || target <= 0) {
      alert("Please enter a valid target amount.")
      return
    }

    try {
      await addGoal(name, target)
    } catch (err) {
      alert("Failed to create goal. Please try again.")
    }
  }

  const handleUpdateSaved = async (id: string, goalName: string, current: number) => {
    const moreStr = prompt(`Progress Update for "${goalName}":\n\nHow much additional have you saved towards this goal? (${currencySymbol})`)
    if (moreStr === null) return // Cancelled

    const more = Number(moreStr)
    if (isNaN(more) || more <= 0) return

    try {
      await updateGoalProgress(id, current + more)
    } catch (err) {
      alert("Failed to update goal.")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center animate-pulse text-primary font-bold">
          Syncing Financial Goals...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-left gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financial Goals</h1>
            <p className="opacity-60 text-sm italic">Track and achieve your dreams</p>
          </div>

          <button
            onClick={handleCreateGoal}
            className="bg-primary px-6 py-3 rounded-lg text-black font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 w-full md:w-auto"
          >
            + Create New Goal
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
            <p className="text-xs uppercase tracking-wider opacity-60 font-bold text-left">Active Goals</p>
            <h3 className="text-3xl font-bold text-white mt-1 text-left">{activeGoals.length}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
            <p className="text-xs uppercase tracking-wider opacity-60 font-bold text-left">Total Target</p>
            <h3 className="text-3xl font-bold text-white mt-1 text-left">{currencySymbol}{totalTarget.toLocaleString()}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30">
            <p className="text-xs uppercase tracking-wider opacity-60 font-bold text-left">Total Saved</p>
            <h3 className="text-3xl font-bold text-secondary mt-1 text-left">{currencySymbol}{totalSaved.toLocaleString()}</h3>
          </div>

          <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
            <p className="text-xs uppercase tracking-wider text-primary font-bold text-left">Overall Progress</p>
            <h3 className="text-3xl font-bold text-primary mt-1 text-left">{completionPercent}%</h3>
          </div>
        </div>

        {/* Active Goals List */}
        <div className="space-y-6 text-left">
          {activeGoals.length === 0 ? (
            <div className="text-center py-20 bg-surface-container/30 rounded-2xl border-2 border-dashed border-outline-variant/50">
              <p className="opacity-40 text-lg">No active financial goals yet.</p>
              <button 
                onClick={handleCreateGoal}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Create your first goal now →
              </button>
            </div>
          ) : (
            activeGoals.map((goal) => {
              const percent = Math.min(100, Math.floor((goal.saved / goal.target) * 100))
              return (
                <div key={goal.id} className="bg-surface-container p-6 rounded-xl group hover:border-primary/50 border border-transparent transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{goal.name}</h3>
                      <p className="text-sm opacity-60">Goal #{goal.id.slice(-4).toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleUpdateSaved(goal.id, goal.name, goal.saved)}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-bold hover:bg-primary/20 transition-colors"
                      >
                        Add Savings
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm(`Delete goal "${goal.name}"?`)) deleteGoal(goal.id)
                        }}
                        className="p-1.5 opacity-20 hover:opacity-100 hover:text-red-500 transition-all rounded-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm font-mono mb-2">
                    <span className="text-secondary font-bold">{currencySymbol}{goal.saved.toLocaleString()}</span>
                    <span className="opacity-40">Target: {currencySymbol}{goal.target.toLocaleString()}</span>
                  </div>

                  <div className="h-3 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-right font-bold text-primary italic">
                    {percent === 100 ? "Goal Met!" : `${100 - percent}% to go`}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Projection & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/30">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">⚡</span> Savings Projection
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="opacity-60">Estimated Monthly Savings:</span>
                <span className="font-bold text-primary font-mono">{currencySymbol}{monthlySavingsEstimate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="opacity-60">Time to Complete All Goals:</span>
                <span className="font-bold text-white">
                  {monthlySavingsEstimate > 0 
                    ? Math.ceil((totalTarget - totalSaved) / monthlySavingsEstimate) 
                    : "∞"} months
                </span>
              </div>
              <p className="text-xs opacity-40 mt-4 italic">
                *Projections are based on 15% of your average monthly transaction volume ({monthsCount} month{monthsCount > 1 ? 's' : ''} of history).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
              <h3 className="font-bold flex items-center gap-2 text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Financial Insight
              </h3>
              <p className="mt-2 text-sm leading-relaxed">
                By optimizing just 5% more of your spending, you could reach 
                <strong> {activeGoals[0]?.name || "your next goal"}</strong> {monthlySavingsEstimate > 0 ? "much" : "significantly"} faster.
              </p>
            </div>

            <div className="bg-secondary/5 p-6 rounded-xl border border-secondary/20">
              <h3 className="font-bold flex items-center gap-2 text-secondary">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Priority Strategy
              </h3>
              <p className="mt-2 text-sm leading-relaxed">
                We've ranked your goals by proximity to completion. Focus on your top goal to build momentum!
              </p>
            </div>
          </div>
        </div>

        {/* Completed Section */}
        {completedGoals.length > 0 && (
          <div className="text-left">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 opacity-60">
              <span className="grayscale text-2xl">🏆</span> Recently Achieved
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="bg-surface-container/50 p-4 rounded-xl border border-secondary/20 grayscale opacity-70">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{goal.name}</span>
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded font-bold">{currencySymbol}{goal.target.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Goals