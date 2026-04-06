import { useState } from "react"
import { useTransactions } from "../../context/TransactionsContext"

interface QuickAddModalProps {
  onClose: () => void
}

const QuickAddModal = ({ onClose }: QuickAddModalProps) => {
  const { addTransaction, currencySymbol } = useTransactions()
  const [isSaving, setIsSaving] = useState(false)
  
  const [merchant, setMerchant] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Other")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !amount) return
    
    setIsSaving(true)
    try {
      await addTransaction({
        merchant,
        amount: Number(amount),
        category,
        date: new Date().toISOString(),
        type: "Cash",
        aiScore: 100 // Manual entries are 100% accurate
      })
      onClose()
    } catch (err) {
      console.error("Manual add failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container w-full max-w-md rounded-3xl border border-outline-variant/30 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start">
          <div className="text-left">
            <h2 className="text-2xl font-black text-white">Quick Cash Entry</h2>
            <p className="text-xs opacity-50 uppercase font-bold tracking-widest mt-1">Foundational Intelligence</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full opacity-40 hover:opacity-100 transition-all">
             ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest opacity-40 font-black px-1">Merchant / Vendor</label>
            <input 
              required
              autoFocus
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Local Taxi, Chai Stall"
              className="w-full bg-background/50 p-4 rounded-2xl border border-outline-variant/20 focus:border-primary outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-black px-1">Amount ({currencySymbol})</label>
              <input 
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-background/50 p-4 rounded-2xl border border-outline-variant/20 focus:border-primary outline-none transition-all font-mono font-bold"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-black px-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background/50 p-4 rounded-2xl border border-outline-variant/20 focus:border-primary outline-none transition-all font-bold cursor-pointer"
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? "SYNCING..." : "COMMIT TO LEDGER →"}
          </button>
          
          <p className="text-[10px] text-center opacity-30 font-bold uppercase tracking-tighter italic">
            Manual entries are tagged as "Cash" and impact velocity immediately.
          </p>
        </form>
      </div>
    </div>
  )
}

export default QuickAddModal
