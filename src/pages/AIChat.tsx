import { useEffect, useRef, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { useTransactions } from "../context/TransactionsContext"
import { getAIResponse } from "../lib/ai"

interface Message {
  role: "user" | "ai"
  content: string
}

const AIChat = () => {
  const { transactions, loading, monthlyCap, dailyVelocity, currencySymbol } = useTransactions()
  
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I'm SpendSense AI, powered by Qwen 2.5. I've analyzed your current ledger and hard-cap status. How can I help you optimize your finances today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input
    if (!text || isTyping) return

    const userMessage: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMessage])
    if (!overrideInput) setInput("")
    setIsTyping(true)

    try {
      // Pass the new context-aware parameters
      const response = await getAIResponse(text, transactions as any, monthlyCap, dailyVelocity)
      const aiMessage: Message = { role: "ai", content: response }
      setMessages(prev => [...prev, aiMessage])
    } catch (err: any) {
      const errorMessage: Message = { 
        role: "ai", 
        content: `Financial Intelligence Error: ${err.message}. If this persists, verify your OpenRouter credentials.` 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Summary Logic for Sidebar
  const totalSpend = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const healthScore = Math.max(0, Math.min(100, Math.round(((monthlyCap - totalSpend) / (monthlyCap || 1)) * 100)))

  const suggestions = [
    "Analyze my Food spend",
    "Am I on track for my Cap?",
    "How to save ₹2,000 this week?",
    "Scan for unusual spikes"
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-primary animate-pulse font-black uppercase tracking-widest text-sm">
          Initializing Intelligence Center...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)] text-left">
        
        {/* CHAT INTERFACE */}
        <div className="flex-1 flex flex-col bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/20 shadow-2xl">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50 backdrop-blur-md">
            <div>
               <h1 className="text-xl font-black text-white">Financial Intelligence</h1>
               <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Qwen 2.5 Pilot Mode</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] opacity-40 font-bold uppercase">Cloud Synced</span>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] rounded-[28px] p-6 shadow-2xl ${
                  m.role === 'user' 
                    ? 'bg-primary text-black font-bold text-sm rounded-tr-none border border-primary/20' 
                    : 'bg-surface-container-high text-white/90 text-sm leading-relaxed border border-white/5 rounded-tl-none font-medium'
                }`}>
                  {/* Visual Marker Parser */}
                  {m.content.split('\n').map((line, idx) => {
                    if (line.includes('[HEALTH:')) {
                      const val = line.match(/\[HEALTH: (\d+)%\]/)?.[1] || "0";
                      return (
                        <div key={idx} className="my-4 bg-background/50 p-4 rounded-xl border border-primary/20">
                          <div className="flex justify-between items-end mb-2">
                            <p className="text-[10px] font-black uppercase opacity-40">AI Health Projection</p>
                            <p className="text-sm font-black text-primary">{val}%</p>
                          </div>
                          <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    }
                    if (line.includes('[STATUS:')) {
                      const status = line.match(/\[STATUS: (.*?)\]/)?.[1] || "OK";
                      return (
                        <div key={idx} className="my-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{status}</span>
                        </div>
                      );
                    }
                    return <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>;
                  })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
                   <span className="text-[10px] font-black text-primary">...</span>
                </div>
                <div className="bg-surface-container-highest/30 px-6 py-4 rounded-3xl rounded-tl-none border border-outline-variant/20 italic opacity-40 text-xs font-medium">
                  AI Pilot is analyzing your data...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Chips */}
          {!isTyping && messages.length < 3 && (
            <div className="px-6 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
               {suggestions.map((s, i) => (
                 <button 
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="whitespace-nowrap px-4 py-2 bg-surface-container-high rounded-full text-xs font-bold border border-outline-variant/30 hover:border-primary/50 transition-all active:scale-95 text-white/60 hover:text-white"
                 >
                   {s}
                 </button>
               ))}
            </div>
          )}

          {/* Input Console */}
          <div className="p-6 border-t border-outline-variant/30 bg-surface-container-high/30">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                className="flex-1 bg-background/50 p-4 rounded-2xl border border-outline-variant/30 focus:border-primary/50 outline-none transition-all font-medium text-sm text-white"
                placeholder={isTyping ? "AI is processing metrics..." : "Describe a financial goal or ask for analysis..."}
              />
              <button
                type="submit"
                disabled={!input || isTyping}
                className="bg-primary px-8 py-3 rounded-2xl text-black font-black uppercase text-xs shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isTyping ? "SENDING" : "COMMIT →"}
              </button>
            </form>
          </div>
        </div>

        {/* INTELLIGENCE SIDEBAR */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-xl space-y-8">
            <h3 className="text-xs uppercase font-black tracking-widest opacity-40">Financial Vitals</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold opacity-30 uppercase">Health Score</p>
                <p className="text-2xl font-black text-primary">{healthScore}%</p>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">Gross Spend</p>
                <p className="text-xl font-bold">{currencySymbol}{totalSpend.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">Daily Velocity</p>
                <p className="text-xl font-bold text-error">{currencySymbol}{Math.round(dailyVelocity).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/20">
               <p className="text-[10px] opacity-40 font-medium italic leading-relaxed">
                  The AI is using your <strong>{messages.length}</strong> message session history to formulate its advice. 
                  Refresh manually to reset context.
               </p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 italic text-[11px] opacity-60 leading-relaxed">
             "SpendSense AI uses the Qwen 2.5 architecture to provide low-latency, context-aware financial coaching."
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default AIChat