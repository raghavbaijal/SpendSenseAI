export interface Transaction {
  merchant: string;
  category: string;
  amount: number;
  date: string;
}

export const getAIResponse = async (
  userMessage: string, 
  transactions: Transaction[],
  monthlyCap: number = 0,
  dailyVelocity: number = 0
) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.");
  }

  // Pre-process transactions to give AI context
  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  const categorySummary = transactions.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const systemPrompt = `
    You are SpendSense AI, a high-performance Financial Pilot powered by Qwen 2.5.
    Your mission is to keep the user within their Monthly Spending Cap and reach their Goals.

    USER'S LIVE FINANCIAL VITALS:
    - Monthly Hard Cap: ₹${monthlyCap.toLocaleString()}
    - Total Month Spend: ₹${totalSpend.toLocaleString()}
    - Current Burn Rate: ₹${Math.round(dailyVelocity).toLocaleString()} / day
    - Record Count: ${transactions.length}
    - Category Heatmap: ${JSON.stringify(categorySummary)}
    - Recent Merchants: ${transactions.slice(0, 5).map(t => t.merchant).join(", ")}

    COACHING RULES:
    1. Be Actionable: Qwen, don't just report numbers. Suggest a "Drill" (e.g., "Limit Zomato to 2 orders this week").
    2. Spot Trends: Compare categories and call out unusual spikes.
    3. Respect the Cap: If spending is high, suggest "Emergency Cuts" to discretionary items.
    4. Be Concise: Use 3 bullet points maximum for audit responses.
    5. Be Blunt but Helpful: If the user is over their budget, tell them directly why.

    Use the LIVE FINANCIAL VITALS to answer accurately. If the user asks about their spending, use these exact numbers.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://spendsense-ai.vercel.app", // Optional for OpenRouter
        "X-Title": "SpendSense AI",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `AI API Error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {
        console.error("AI API Raw Error:", errorText);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Fetch Error:", error);
    throw error;
  }
};
