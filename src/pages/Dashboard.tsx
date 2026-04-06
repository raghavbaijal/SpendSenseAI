import DashboardLayout from "../components/layout/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import { useTransactions } from "../context/TransactionsContext";
import { getAIResponse } from "../lib/ai";
import { Link } from "react-router-dom";
import QuickAddModal from "../components/modals/QuickAddModal";

const Dashboard = () => {
  const { 
    transactions, 
    loading, 
    monthlyCap, 
    dailyVelocity, 
    currencySymbol, 
    totalMonthSpent,
    rolloverBonus,
    projectedMonthEnd,
    focusMonth,
    focusYear
  } = useTransactions();
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = months[focusMonth];
  const isCurrentMonth = focusMonth === new Date().getMonth() && focusYear === new Date().getFullYear();
  const [aiAudit, setAiAudit] = useState<string>("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Stats Calculations
  const totalSpent = useMemo(() =>
    transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions]
  );

  const burnRateStatus = useMemo(() => {
    if (monthlyCap === 0) return "Unknown";
    const idealDaily = monthlyCap / 30;
    if (dailyVelocity > idealDaily * 1.2) return "Critical";
    if (dailyVelocity > idealDaily) return "Warning";
    return "Stable";
  }, [dailyVelocity, monthlyCap]);

  // AI Weekly Audit
  const generateAudit = async () => {
    if (transactions.length === 0 || monthlyCap === 0) return;
    setIsAuditing(true);
    try {
      const prompt = `CRITICAL LIVE DATA: My Total Month Spend is ${currencySymbol}${Math.round(totalMonthSpent)}. My Daily Burn Rate is ${currencySymbol}${Math.round(dailyVelocity)}/day. I am projected to reach ${currencySymbol}${Math.round(projectedMonthEnd)} by month end against a hard cap of ${currencySymbol}${monthlyCap}.
      Analyze these live financial vitals and give me a 3-bullet point "Coach's Audit". If my burn rate is ₹0/day despite having spend, mention that data is currently syncing. Be blunt and actionable.`;
      const response = await getAIResponse(prompt, transactions);
      setAiAudit(response);
    } catch (err) {
      console.error("Audit failed:", err);
      setAiAudit("AI Coach is currently analyzing your data... please check back in a moment.");
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && monthlyCap > 0 && !aiAudit) {
      generateAudit();
    }
  }, [transactions, monthlyCap]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center animate-pulse text-primary font-bold uppercase tracking-widest text-sm">
          Calculating Financial Velocity...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        
        {/* SETUP REQUIRED STATE */}
        {monthlyCap === 0 ? (
          <section className="bg-primary/5 p-12 rounded-3xl border border-primary/20 text-center space-y-6">
             <div className="text-5xl mb-4">⚓</div>
             <h1 className="text-3xl font-black text-white">Pilot Setup Required</h1>
             <p className="max-w-md mx-auto opacity-60 text-sm leading-relaxed">
                To enable AI Forecasting and Burn Rate tracking, you must first define your 
                <strong> Monthly Spending Cap</strong> based on your income.
             </p>
             <Link 
                to="/settings" 
                className="inline-block bg-primary text-black px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
             >
                Set Spending Cap →
             </Link>
          </section>
        ) : (
          /* TOP LEVEL: AI BURN RATE & FORECAST */
          <section className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/40 shadow-2xl shadow-primary/5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2 text-right">
               <div className="flex items-center gap-2 mb-2">
                 <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                   isCurrentMonth ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                 }`}>
                   {isCurrentMonth ? 'Live: ' : 'Viewing: '}{currentMonthName} {focusYear}
                 </span>
               </div>
               {rolloverBonus > 0 && (
                 <div className="text-[9px] font-black px-2 py-0.5 rounded bg-primary text-black uppercase tracking-tighter mb-1 animate-bounce">
                   +{currencySymbol}{rolloverBonus.toLocaleString()} Rollover Bonus
                 </div>
               )}
               <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                 burnRateStatus === 'Critical' ? 'bg-error/20 text-error border-error/30 animate-pulse' : 
                 burnRateStatus === 'Warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                 'bg-primary/20 text-primary border-primary/30'
               }`}>
                  {burnRateStatus} Burn Rate
               </div>
               <p className="text-[10px] opacity-40 font-bold uppercase tracking-tighter">Velocity: {currencySymbol}{Math.round(dailyVelocity)} / day</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div>
                <p className="text-xs opacity-50 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Month-End Projection
                  {new Date().getDate() === 1 && (
                    <span className="ml-2 text-[8px] bg-white/10 px-2 py-0.5 rounded border border-white/10 text-white/40">
                      PROVISIONAL (DAY 1)
                    </span>
                  )}
                </p>
                <h1 className="text-5xl font-black text-white tracking-tight">
                  {currencySymbol}{Math.round(projectedMonthEnd).toLocaleString()}
                  <span className={`text-lg ml-3 ${projectedMonthEnd > monthlyCap ? 'text-error' : 'text-primary'}`}>
                    ({projectedMonthEnd > monthlyCap ? 'Exceeds Cap' : 'Within Cap'})
                  </span>
                </h1>
              </div>
            </div>

            {/* Forecast Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase opacity-40 px-1">
                 <span>Current: {currencySymbol}{totalMonthSpent.toLocaleString()}</span>
                 <span>Hard Cap: {currencySymbol}{monthlyCap.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden border border-outline-variant/10 p-0.5 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${projectedMonthEnd > (monthlyCap || 1) ? 'bg-error' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (totalMonthSpent / (monthlyCap || 1)) * 100)}%` }}
                />
                <div 
                  className="absolute top-0 left-0 h-full border-r-2 border-white/40 border-dashed transition-all duration-1000"
                  style={{ left: `${Math.min(100, (projectedMonthEnd / (monthlyCap || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* COACH'S WEEKLY AUDIT - Only show if cap set */}
        {monthlyCap > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-left relative">
                <h3 className="text-primary font-bold mb-4 flex items-center gap-2 text-lg">
                   <span className="text-2xl">🧠</span> AI Coach's Audit
                </h3>
                {isAuditing ? (
                  <div className="flex gap-2 items-center text-xs opacity-50 animate-pulse font-bold uppercase tracking-widest p-4">
                     Analyzing spending patterns...
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm opacity-80 leading-relaxed text-sm whitespace-pre-line italic">
                     {aiAudit || "Upload transactions to receive your personalized financial audit."}
                  </div>
                )}
                <button 
                  onClick={generateAudit}
                  disabled={isAuditing || transactions.length === 0}
                  className="absolute bottom-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-all opacity-40 hover:opacity-100"
                >
                   🔄
                </button>
             </div>

             <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 flex flex-col justify-center text-left">
                <p className="text-xs opacity-50 uppercase font-black tracking-widest mb-1">Financial Score</p>
                <h3 className={`text-6xl font-black ${projectedMonthEnd > monthlyCap ? 'text-error' : 'text-primary'}`}>
                  {monthlyCap > 0 ? Math.max(0, 100 - Math.round((totalMonthSpent / monthlyCap) * 100)) : 100}
                </h3>
                <p className="mt-4 text-xs opacity-60 leading-relaxed">
                  Based on your daily velocity of <strong>{currencySymbol}{Math.round(dailyVelocity)}</strong>. 
                  Keep it under <strong>{currencySymbol}{Math.round(monthlyCap / 30)}</strong> to recover your score.
                </p>
             </div>
          </section>
        )}

        {/* Stats & Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          <section className="bg-surface-container p-8 rounded-3xl border border-outline-variant/20">
            <h3 className="font-bold flex items-center gap-2 mb-8">
               <span className="h-6 w-1.5 bg-secondary rounded-full" />
               Gross Record: {currencySymbol}{totalSpent.toLocaleString()}
            </h3>
            <div className="flex items-end h-48 gap-3 px-2">
               {transactions.slice(0,10).map((t, index) => (
                 <div key={index} className="flex-1 bg-surface-container-high rounded-t-lg relative group transition-all hover:bg-primary/40 h-full border border-outline-variant/10">
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-primary/20 rounded-t-lg transition-all"
                      style={{ height: `${Math.min(100, (Number(t.amount) / (Math.max(1, monthlyCap)/10)) * 100)}%` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] bg-background p-2 rounded border border-outline-variant/30 font-bold z-10 shadow-xl">
                       {currencySymbol}{t.amount.toLocaleString()}
                    </div>
                 </div>
               ))}
            </div>
            <p className="mt-6 text-[10px] opacity-40 font-bold uppercase tracking-widest text-center">Recent Visual Ledger (Volume Over Cap Capacity)</p>
          </section>

          <section className="bg-surface-container p-8 rounded-3xl border border-outline-variant/20 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold flex items-center gap-2">
                 <span className="h-6 w-1.5 bg-primary rounded-full" />
                 Velocity Log
              </h3>
              <span className="text-[10px] font-bold opacity-30 text-white uppercase tracking-tighter">Top 5 Records</span>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((t, index) => (
                <div key={index} className="flex justify-between items-center p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-all group">
                   <div>
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{t.merchant}</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{t.category}</p>
                   </div>
                   <div className="text-right">
                      <p className="font-mono font-bold text-error">{currencySymbol}{Number(t.amount).toLocaleString()}</p>
                      <p className="text-[10px] opacity-30 italic">{t.date}</p>
                   </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="py-20 text-center opacity-30 italic">No activity detected yet.</div>
              )}
            </div>
          </section>
        </div>

        {/* FLOATING ACTION BUTTON (FAB) */}
        <button 
          onClick={() => setShowQuickAdd(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-black rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center text-3xl font-black hover:scale-110 active:scale-95 transition-all z-40 animate-in slide-in-from-bottom-10 fade-in duration-500"
          title="Quick Cash Entry"
        >
           +
        </button>

        {/* MODAL LAYER */}
        {showQuickAdd && (
          <QuickAddModal onClose={() => setShowQuickAdd(false)} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;