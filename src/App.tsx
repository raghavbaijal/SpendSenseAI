import React, { Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"))
const Upload = React.lazy(() => import("./pages/Upload"))
const Transactions = React.lazy(() => import("./pages/Transactions"))
const AIInsights = React.lazy(() => import("./pages/AIInsights"))
const AIChat = React.lazy(() => import("./pages/AIChat"))
const Budgets = React.lazy(() => import("./pages/Budgets"))
const Goals = React.lazy(() => import("./pages/Goals"))
const Settings = React.lazy(() => import("./pages/Settings"))
const Login = React.lazy(() => import("./pages/Login"))
const Register = React.lazy(() => import("./pages/Register"))

// Auth Guard
import ProtectedRoute from "./components/auth/ProtectedRoute"

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen text-red-500">
          <div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <pre className="mt-4 text-sm">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-insights"
                element={
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-chat"
                element={
                  <ProtectedRoute>
                    <AIChat />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/budgets"
                element={
                  <ProtectedRoute>
                    <Budgets />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to="/login" />}
              />

            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

export default App