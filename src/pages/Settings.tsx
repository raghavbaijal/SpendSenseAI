import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { supabase } from "../lib/supabase"
import { useTransactions } from "../context/TransactionsContext"

const Settings = () => {
  const { currency, updateCurrency, monthlyCap, updateMonthlyCap, currencySymbol, clearAllTransactions } = useTransactions()
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [localCurrency, setLocalCurrency] = useState(currency)
  const [localMonthlyCap, setLocalMonthlyCap] = useState(monthlyCap)
  
  const [autoCategorize, setAutoCategorize] = useState(true)
  const [smartBudget, setSmartBudget] = useState(true)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    setLocalCurrency(currency)
    setLocalMonthlyCap(monthlyCap)
  }, [currency, monthlyCap])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (user) {
      setEmail(user.email || "")
      setName(user.user_metadata?.full_name || "")
      setAutoCategorize(user.user_metadata?.auto_categorize ?? true)
      setSmartBudget(user.user_metadata?.smart_budget ?? true)
      
      // Load financial defaults from Auth Metadata
      if (user.user_metadata?.currency) setLocalCurrency(user.user_metadata.currency)
      if (user.user_metadata?.monthly_cap) setLocalMonthlyCap(Number(user.user_metadata.monthly_cap))
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          currency: localCurrency,
          monthly_cap: Number(localMonthlyCap),
          auto_categorize: autoCategorize,
          smart_budget: smartBudget
        }
      })

      if (error) throw error
      
      // Update global context
      const symbols: Record<string, string> = {
        INR: "₹",
        USD: "$",
        EUR: "€",
        GBP: "£"
      }
      
      await updateCurrency(localCurrency, symbols[localCurrency] || "₹")
      await updateMonthlyCap(Number(localMonthlyCap))
      
      alert("Settings saved successfully and synced to cloud!")
    } catch (err) {
      console.error("Save failed:", err)
      alert("Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTotalReset = async () => {
    const confirmReset = confirm("CRITICAL: This will permanently delete all your transactions, budgets, and goals from the cloud. This cannot be undone. Proceed?")
    if (!confirmReset) return

    setIsResetting(true)
    await clearAllTransactions()
    setIsResetting(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm opacity-60">Manage your SpendSense AI account and preferences</p>
        </div>

        {/* Profile & Financial */}
        <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-primary">👤</span> Profile & Regional
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest opacity-50 font-bold px-1">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/30 focus:border-primary/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-1 opacity-50 cursor-not-allowed">
              <label className="text-xs uppercase tracking-widest opacity-50 font-bold px-1">Account Email</label>
              <input
                value={email}
                disabled
                className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/30 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest opacity-50 font-bold px-1">Base Currency</label>
              <select
                value={localCurrency}
                onChange={(e) => setLocalCurrency(e.target.value)}
                className="w-full bg-surface-container-high p-3 rounded-xl border border-outline-variant/30 appearance-none cursor-pointer focus:border-primary/50 outline-none transition-all"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest opacity-50 font-bold px-1">
                Monthly Spending Limit ({currencySymbol})
                {localMonthlyCap === 0 && <span className="ml-2 text-primary animate-pulse text-[10px]">Setup Required</span>}
              </label>
              <input
                type="number"
                value={localMonthlyCap || ""}
                onChange={(e) => setLocalMonthlyCap(Number(e.target.value))}
                placeholder="Total Budget Limit"
                className={`w-full bg-surface-container-high p-3 rounded-xl border transition-all font-mono font-bold outline-none ${
                  localMonthlyCap === 0 
                  ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] animate-pulse' 
                  : 'border-outline-variant/30 focus:border-primary/50'
                }`}
              />
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="mt-8 px-8 py-3 bg-primary text-black font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving to Cloud..." : "Save All Changes"}
          </button>
        </div>

        {/* AI & Automation */}
        <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-secondary">⚡</span> AI Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-container-high p-4 rounded-xl">
              <div>
                <p className="font-bold">Auto-Categorize</p>
                <p className="text-xs opacity-50">AI will automatically group your raw spending data</p>
              </div>
              <button
                onClick={() => setAutoCategorize(!autoCategorize)}
                className={`w-14 h-7 rounded-full transition-colors relative ${autoCategorize ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${autoCategorize ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex justify-between items-center bg-surface-container-high p-4 rounded-xl">
              <div>
                <p className="font-bold">Smart Budget Insights</p>
                <p className="text-xs opacity-50">Generate personalized budget suggestions based on habits</p>
              </div>
              <button
                onClick={() => setSmartBudget(!smartBudget)}
                className={`w-14 h-7 rounded-full transition-colors relative ${smartBudget ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${smartBudget ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Danger Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20">
            <h3 className="text-lg font-bold mb-4">Account</h3>
            <button
              onClick={logout}
              className="w-full p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors font-semibold flex items-center justify-between"
            >
              Log Out Session
              <span>→</span>
            </button>
          </div>

          <div className="bg-error/5 rounded-2xl p-8 border border-error/20">
            <h3 className="text-lg font-bold text-error mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <button
                onClick={handleTotalReset}
                disabled={isResetting}
                className="w-full p-4 bg-error text-black rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isResetting ? "Cleaning Cloud..." : "Clear All Financial Data"}
              </button>
              <p className="text-[10px] opacity-60 text-center uppercase tracking-widest font-bold">Permanent Action</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings