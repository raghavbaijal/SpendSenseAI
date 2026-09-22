# 💰 SpendSense AI

### AI-Powered Personal Finance Management Platform

SpendSense AI is a full-stack personal finance platform designed to help users **track expenses, understand spending patterns, manage budgets, and receive AI-powered financial insights** from their transaction data.

Instead of simply displaying transaction records, SpendSense combines **financial analytics, interactive dashboards, budgeting tools, and Generative AI** to turn raw spending data into actionable insights.

---

## 🚀 Overview

Managing personal finances often means dealing with scattered transactions, unclear spending patterns, and manually maintained budgets.

**SpendSense AI** provides a centralized platform where users can:

* 📊 Analyze their spending habits
* 💳 Track income and expenses
* 🧠 Get AI-generated financial insights
* 💰 Create and monitor budgets
* 📈 Visualize spending trends
* 💬 Interact with an AI financial assistant
* 🔐 Securely manage financial data

The goal is to transform **raw transaction data → meaningful financial intelligence**.

---

## ✨ Key Features

### 📊 Financial Dashboard

Get a real-time overview of your financial activity.

* Total income
* Total expenses
* Current balance
* Monthly spending
* Category-wise spending
* Spending trends
* Budget utilization

---

### 💳 Transaction Management

Manage and analyze individual financial transactions.

* Add transactions
* Edit transactions
* Delete transactions
* Categorize expenses
* Track income and expenses
* Search and filter transactions
* View transaction history

---

### 🤖 AI-Powered Financial Insights

SpendSense uses Google's Gemini API to analyze financial patterns and generate personalized insights.

The AI layer can help identify:

* Spending patterns
* High-expense categories
* Unusual spending behaviour
* Budgeting opportunities
* Potential areas for reducing expenses

Instead of only showing charts, SpendSense explains **what the data means**.

---

### 💬 AI Finance Assistant

Users can interact with an AI-powered financial assistant to ask questions about their spending.

Example questions:

> "Where did I spend the most this month?"

> "How much did I spend on food?"

> "Which category is increasing the fastest?"

> "How can I reduce my monthly expenses?"

The assistant uses the user's financial context to provide relevant responses.

---

### 💰 Budget Management

Create and monitor personal budgets.

* Set monthly budgets
* Track budget utilization
* Monitor category-wise spending
* Identify overspending
* Compare actual spending with planned budgets

---

### 📈 Interactive Analytics

SpendSense provides visual analytics to make financial data easier to understand.

Analytics include:

* Expense distribution
* Category breakdown
* Monthly spending trends
* Income vs expense analysis
* Budget utilization
* Spending comparisons

---

### 📤 Data Upload

Users can upload transaction data to populate their financial records and perform analysis.

The application is designed to make the transition from raw financial data to structured analytics simple.

---

## 🧠 AI Architecture

SpendSense follows a simple AI-assisted financial analysis flow:

```text
User Transactions
       │
       ▼
Supabase / PostgreSQL
       │
       ▼
Financial Aggregation
       │
       ▼
Spending Analytics
       │
       ▼
User Financial Context
       │
       ▼
Gemini API
       │
       ▼
AI-Generated Insights
       │
       ▼
Dashboard / AI Chat
```

This architecture separates the **data layer, analytics layer, and AI layer**, making the application easier to extend.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │       User           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ React + TypeScript   │
                    │ Tailwind CSS v4      │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │    Supabase     │        │   Gemini API    │
        │                 │        │                 │
        │ PostgreSQL      │        │ AI Insights     │
        │ Authentication  │        │ AI Assistant    │
        │ Backend         │        │                 │
        └────────┬────────┘        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Financial Data  │
        │ & Transactions  │
        └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS v4**

### Backend & Database

* **Supabase**
* **PostgreSQL**
* **Supabase Authentication**
* **Supabase APIs**

### AI

* **Google Gemini API**
* Generative AI
* AI-powered financial analysis
* Conversational AI

### Data & Analytics

* JavaScript / TypeScript
* Financial aggregation
* Transaction categorization
* Spending analytics
* Interactive data visualization

### Development

* Git
* GitHub
* npm
* VS Code

---

## 📁 Project Structure

```text
spendsense-ai/
│
├── public/
│   └── assets/
│
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Transactions/
│   │   ├── Budgets/
│   │   └── AI/
│   │
│   ├── pages/
│   │   ├── Dashboard
│   │   ├── Transactions
│   │   ├── Budgets
│   │   ├── AIInsights
│   │   └── AIChat
│   │
│   ├── services/
│   │   ├── supabase
│   │   └── gemini
│   │
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

> Update the structure above if your actual repository uses different folder names.

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/spendsense-ai.git

cd spendsense-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` or `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> Never commit your `.env` file or private API keys to GitHub.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

### 5. Build for Production

```bash
npm run build
```

---

## 🔐 Security

SpendSense is designed with security in mind.

* Environment variables are used for API configuration.
* Sensitive credentials should never be committed to Git.
* Supabase handles database and authentication infrastructure.
* Database access should be protected using appropriate Row Level Security policies.
* AI API credentials should be kept server-side where applicable.

### Environment Variables

```text
.env
.env.local
```

should be included in `.gitignore`.

---

## 📊 Example User Flow

```text
Sign Up / Login
       │
       ▼
Dashboard
       │
       ├── Add Transactions
       │
       ├── Upload Financial Data
       │
       ├── Create Budget
       │
       ▼
Financial Analytics
       │
       ├── Spending Trends
       ├── Category Analysis
       └── Budget Utilization
       │
       ▼
AI Insights
       │
       └── Personalized Recommendations
       │
       ▼
AI Finance Assistant
```

---

## 🎯 Problems Solved

### Traditional Expense Trackers

```text
Transactions → Charts → User interprets everything
```

### SpendSense AI

```text
Transactions
      ↓
Analytics
      ↓
Pattern Detection
      ↓
AI Interpretation
      ↓
Actionable Financial Insights
```

SpendSense focuses on moving from **financial record keeping to financial understanding**.

---

## 🔮 Future Improvements

Planned improvements include:

* [ ] Bank account integrations
* [ ] Automatic transaction synchronization
* [ ] AI-powered receipt scanning
* [ ] Expense forecasting
* [ ] Spending anomaly detection
* [ ] Financial goal tracking
* [ ] Recurring expense detection
* [ ] Personalized saving plans
* [ ] Voice-based financial assistant
* [ ] Advanced financial reports
* [ ] Mobile application
* [ ] Automated monthly AI reports


## 🌐 Live Demo

🔗 **Live Application:**
https://spend-sense-ai-x3zl.vercel.app/login

---

## 💡 What I Learned

Building SpendSense AI provided hands-on experience with:

* Building a full-stack React application
* TypeScript-based frontend development
* PostgreSQL database design
* Supabase backend development
* Authentication and user data management
* Financial data analysis
* Generative AI integration
* Prompt-based AI application development
* Building data-driven dashboards
* Designing AI-assisted user experiences
* Deploying modern web applications

---

## 👨‍💻 Author

### Raghav Baijal

B.Tech Computer Science & Engineering
Interested in **Software Engineering, Data & AI, FinTech, and Generative AI**.


