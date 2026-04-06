import DashboardLayout from "../components/layout/DashboardLayout"
import { useTransactions } from "../context/TransactionsContext"

const AIInsights = () => {
  const { transactions, loading, subscriptions, currencySymbol } = useTransactions()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center animate-pulse text-primary font-bold uppercase tracking-widest text-sm">
          Analyzing Financial Vitals...
        </div>
      </DashboardLayout>
    )
  }

  // Total Spend
  const totalSpend = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  
  // Savings Opportunity (AI logic: 8% of total)
  const savings = Math.max(0, Math.floor(totalSpend * 0.08))

  // Category Map
  const categoryMap: Record<string, number> = {}
  transactions.forEach(t => {
    if (t.category) {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount || 0)
    }
  })

  // Top Category (With Empty Guard)
  const categoriesPresent = Object.keys(categoryMap)
  const topCategory = categoriesPresent.length > 0 
    ? categoriesPresent.reduce((a, b) => categoryMap[a] > categoryMap[b] ? a : b)
    : "None"

  // Risk Detection
  const risk = transactions.length === 0 ? "Low" : totalSpend > 30000 ? "High" : totalSpend > 15000 ? "Medium" : "Low"

  // Health Score (Harden against 0)
  const healthScore = transactions.length === 0 ? 100 : Math.max(50, 100 - Math.floor(totalSpend / 1000))

  // Budget Performance
  const budgetPerformance = totalSpend > 0 ? Math.min(100, 100 - Math.floor(savings / 100)) : 100

  const totalSubAmount = (subscriptions || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

  // CRITICAL: Empty State Guard for new accounts
  if (transactions.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-10 pb-20 text-left animate-in fade-in duration-700">
           <div>
            <h1 className="text-4xl font-black text-white tracking-tight">AI Financial Vitals</h1>
            <p className="opacity-40 font-bold uppercase tracking-widest text-[10px] mt-1">Advanced Pattern Recognition Engine</p>
          </div>
          
          <div className="bg-surface-container-high p-12 rounded-[40px] border border-dashed border-outline-variant/30 text-center flex flex-col items-center justify-center space-y-6">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-3xl">📡</div>
             <div className="max-w-sm">
                <h3 className="text-2xl font-black text-white">Awaiting Signal...</h3>
                <p className="text-sm opacity-50 mt-2 leading-relaxed">
                   The AI Analysis engine requires transaction data to begin pattern recognition. 
                   Upload your first bank statement to unlock Financial Vitals.
                </p>
             </div>
             <a 
               href="/upload" 
               className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
             >
                Upload Statement →
             </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20 text-left">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">AI Financial Vitals</h1>
            <p className="opacity-40 font-bold uppercase tracking-widest text-[10px] mt-1">Advanced Pattern Recognition Engine</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black opacity-30 uppercase">Health Status</p>
            <p className={`text-sm font-black uppercase ${healthScore > 80 ? 'text-primary' : healthScore > 60 ? 'text-yellow-500' : 'text-error'}`}>
              {healthScore > 80 ? 'Optimal' : healthScore > 60 ? 'Stable' : 'Critical'}
            </p>
          </div>
        </div>

        {/* Top Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-xl">
            <p className="text-[10px] font-black opacity-40 uppercase mb-2">Savings Opportunity</p>
            <h3 className="text-3xl font-black text-secondary">{currencySymbol}{savings.toLocaleString()}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-xl">
            <p className="text-[10px] font-black opacity-40 uppercase mb-2">Risk Vector</p>
            <h3 className={`text-3xl font-black ${risk === 'High' ? 'text-error' : risk === 'Medium' ? 'text-yellow-500' : 'text-primary'}`}>{risk}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-xl">
            <p className="text-[10px] font-black opacity-40 uppercase mb-2">Health Rank</p>
            <h3 className="text-3xl font-black">{healthScore}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-xl" title="Budget Performance Effiecency">
            <p className="text-[10px] font-black opacity-40 uppercase mb-2">Efficiency</p>
            <h3 className="text-3xl font-black">{budgetPerformance}%</h3>
          </div>
        </div>

        {/* GHOST HUNTER: SUBSCRIPTION AUDIT */}
        <section className="bg-surface-container-high/40 backdrop-blur-sm p-8 rounded-[40px] border border-outline-variant/20 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 grayscale scale-150 rotate-12">👻</div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
             <div>
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                   <span className="w-8 h-8 bg-error/10 text-error rounded-full flex items-center justify-center text-sm italic">Ghost</span>
                   Subscription Audit
                </h3>
                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Automatic Outflow Detection</p>
             </div>
             <div className="bg-background/50 px-4 py-2 rounded-2xl border border-outline-variant/20">
                <p className="text-[9px] font-black opacity-40 uppercase mb-1">Monthly Commitment</p>
                <p className="text-lg font-black text-error">-{currencySymbol}{totalSubAmount.toLocaleString()}</p>
             </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="p-12 text-center bg-background/20 rounded-3xl border border-dashed border-outline-variant/30 italic opacity-40 text-sm">
              AI Ghost Hunter has not detected recurring payments yet. 
              Keep your ledger updated to reveal hidden costs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {subscriptions.map((sub, i) => (
                  <div key={i} className="bg-surface-container-highest/30 p-5 rounded-2xl border border-white/5 hover:border-error/20 transition-all flex justify-between items-center group">
                     <div>
                        <p className="font-black text-sm uppercase tracking-tight text-white group-hover:text-error transition-colors">{sub.merchant}</p>
                        <p className="text-[10px] opacity-40 font-bold uppercase tracking-tighter mt-1">Every {sub.frequency} days</p>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-sm">{currencySymbol}{sub.amount.toLocaleString()}</p>
                        <p className="text-[8px] opacity-30 font-bold uppercase mt-0.5">Recurring</p>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </section>

        {/* CORE INSIGHTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Category Chart */}
            <div className="bg-surface-container p-8 rounded-3xl border border-outline-variant/10 shadow-xl">
               <h3 className="font-black text-lg mb-6 uppercase tracking-widest opacity-60">Category Distribution</h3>
               <div className="space-y-6">
                 {Object.keys(categoryMap).map(cat => (
                   <div key={cat} className="space-y-2">
                     <div className="flex justify-between items-end">
                       <p className="text-xs font-black uppercase text-white/80">{cat}</p>
                       <p className="text-xs font-mono opacity-40">{currencySymbol}{categoryMap[cat].toLocaleString()}</p>
                     </div>
                     <div className="h-2 bg-background rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary transition-all duration-1000" 
                         style={{ width: `${(categoryMap[cat] / (totalSpend || 1)) * 100}%` }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Pattern Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-lg group">
                  <h4 className="text-primary font-black uppercase tracking-widest text-[10px] mb-2">AI Pattern Recognition</h4>
                  <p className="text-sm font-medium leading-relaxed opacity-70">
                    Frequent transactions detected in <span className="text-white font-bold">{topCategory}</span>. 
                    This category consumes {Math.round((categoryMap[topCategory] / totalSpend) * 100)}% of your discretionary income.
                  </p>
               </div>
               <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-lg">
                  <h4 className="text-secondary font-black uppercase tracking-widest text-[10px] mb-2">Smart Saving Prompt</h4>
                  <p className="text-sm font-medium leading-relaxed opacity-70">
                    Your efficiency is at <span className="text-white font-bold">{budgetPerformance}%</span>. 
                    Optimizing <span className="text-white font-bold">{topCategory}</span> could yield an extra {currencySymbol}{Math.floor(categoryMap[topCategory] * 0.15)} in monthly savings.
                  </p>
               </div>
            </div>
          </div>

          {/* Side Intelligence */}
          <div className="space-y-8">
             <div className="bg-primary/5 border border-primary/20 p-8 rounded-[40px] relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-xl font-black text-primary mb-4 italic tracking-tight">Financial Coach</h3>
                   <p className="text-sm opacity-80 leading-loose italic">
                     "Your <span className="text-white font-bold">{topCategory}</span> spending is currently the primary friction point for your Goals. 
                     By hunting those Ghost subscriptions, we can free up {currencySymbol}{totalSubAmount.toLocaleString()} instantly."
                   </p>
                   <div className="mt-8 pt-8 border-t border-primary/10">
                      <p className="text-[10px] font-black uppercase opacity-40">Monthly Velocity</p>
                      <p className="text-2xl font-black text-white">{currencySymbol}{totalSpend.toLocaleString()}</p>
                   </div>
                </div>
             </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}

export default AIInsights