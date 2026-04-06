import { useMemo, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { useTransactions, type Transaction } from "../context/TransactionsContext"

const Transactions = () => {
  const { transactions, currencySymbol, loading, updateTransaction, deleteTransaction } = useTransactions()
  const [search, setSearch] = useState("")
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((t) =>
      (t.merchant || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (t.category || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [search, transactions])

  // Stats
  const totalSpend = useMemo(() => {
    return (transactions || []).reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    )
  }, [transactions])

  const topCategory = useMemo(() => {
    if (!transactions || transactions.length === 0) return "—"
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const cat = t.category || "Other"
      map[cat] = (map[cat] || 0) + (Number(t.amount) || 0)
    })
    return Object.keys(map).reduce((a, b) => map[a] > map[b] ? a : b, "—")
  }, [transactions])

  // Handlers
  const startEdit = (t: Transaction) => {
    if (!t.id) return
    setEditingId(t.id)
    setEditValues({
      merchant: t.merchant,
      category: t.category,
      amount: t.amount
    })
  }

  const handleSave = async (id: string) => {
    await updateTransaction(id, editValues)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction from the ledger?")) {
      await deleteTransaction(id)
    }
  }

  // Export Logic
  const exportToCSV = () => {
    if (!filteredTransactions.length) return;
    
    const headers = ["Merchant", "Category", "Amount", "Date"];
    const rows = filteredTransactions.map(t => [
      t.merchant,
      t.category,
      t.amount,
      new Date(t.date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SpendSense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center animate-pulse text-primary font-bold uppercase tracking-widest text-sm">
          Securing Ledger Connectivity...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start text-left">
          <div>
            <h1 className="text-3xl font-black text-white">Ledger Command</h1>
            <p className="opacity-60 text-sm italic font-medium">Verify, Edit, or Cleanse your financial history</p>
          </div>

          <div className="flex gap-3">
             <button 
               onClick={exportToCSV}
               className="bg-surface-container-high px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-outline-variant/30 hover:bg-primary hover:text-black transition-all flex items-center gap-2"
             >
                <span>📥</span> Export Ledger
             </button>
             <div className="bg-surface-container px-4 py-2 rounded-xl flex items-center gap-2 border border-outline-variant/20">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Sync Active</span>
             </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-black mb-1">Total Records</p>
            <h3 className="text-2xl font-black">{transactions?.length || 0}</h3>
          </div>

          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-black mb-1">Gross Magnitude</p>
            <h3 className="text-2xl font-black">{currencySymbol}{totalSpend.toLocaleString()}</h3>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
            <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-1">Peak Category</p>
            <h3 className="text-2xl font-black text-primary uppercase">{topCategory}</h3>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="bg-surface-container p-3 rounded-2xl border border-outline-variant/20 flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
            <input
              className="w-full bg-background/50 p-3 pl-12 rounded-xl outline-none focus:border-primary/50 border border-transparent transition-all font-medium text-sm"
              placeholder="Search via Merchant, Category or Amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Unified Table */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr className="text-[10px] uppercase tracking-widest opacity-40 border-b border-outline-variant/30">
                  <th className="p-6 font-black">Merchant / Entity</th>
                  <th className="p-6 font-black">Group</th>
                  <th className="p-6 font-black text-right">Value</th>
                  <th className="p-6 font-black">Date</th>
                  <th className="p-6 font-black text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredTransactions.map((t, index) => {
                  const isEditing = editingId === t.id;
                  return (
                    <tr key={t.id || index} className={`group transition-colors ${isEditing ? 'bg-primary/5' : 'hover:bg-white/5'}`}>
                      <td className="p-6">
                        {isEditing ? (
                          <input 
                            value={editValues.merchant}
                            onChange={(e) => setEditValues({ ...editValues, merchant: e.target.value })}
                            className="bg-background border border-primary/30 p-2 rounded text-sm w-full outline-none focus:border-primary"
                          />
                        ) : (
                          <div className="font-bold text-sm text-white group-hover:text-primary transition-colors">
                            {t.merchant || "Unknown Entity"}
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        {isEditing ? (
                          <select
                            value={editValues.category}
                            onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                            className="bg-background border border-primary/30 p-2 rounded text-sm w-full outline-none"
                          >
                            <option value="Food">Food</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Travel">Travel</option>
                            <option value="Health">Health</option>
                            <option value="Bills">Bills</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <span className="text-[10px] font-bold border border-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest bg-primary/5">
                            {t.category || "Other"}
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editValues.amount}
                            onChange={(e) => setEditValues({ ...editValues, amount: Number(e.target.value) })}
                            className="bg-background border border-primary/30 p-2 rounded text-sm w-24 text-right outline-none"
                          />
                        ) : (
                          <div className="font-mono font-bold text-error">
                            {currencySymbol}{Number(t.amount || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="text-xs opacity-60 font-medium font-mono uppercase">
                          {t.date ? new Date(t.date).toLocaleDateString('en-GB') : "—"}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-3">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleSave(t.id!)}
                                className="text-xs font-bold text-primary hover:underline uppercase"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="text-xs font-bold opacity-40 hover:underline uppercase"
                              >
                                Skip
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(t)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-primary/20 rounded-lg text-primary transition-all text-xs"
                                title="Edit Record"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDelete(t.id!)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-error/20 rounded-lg text-error transition-all text-xs"
                                title="Purge Record"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center opacity-30 italic font-medium">
                       The vault is empty. Upload or add a transaction to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Insight */}
        <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10 text-left">
           <h3 className="font-bold mb-2 flex items-center gap-2 text-primary">
            <span className="text-xl">🛠️</span> Data Management
          </h3>
          <p className="text-sm opacity-60 leading-relaxed max-w-2xl">
            Edits made here are reconciled in the cloud instantly. Your <strong>Burn Rate</strong> and <strong>Budget Allocation</strong> 
            will automatically recalculate to reflect these changes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Transactions