import { useState } from 'react'
import { login, signup } from '../services/api'

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('login')   // 'login' | 'signup'
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = isSignup
        ? await signup({ name, email, password })
        : await login({ email, password })
      localStorage.setItem('taxsmart_user', JSON.stringify(user))
      onAuth(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError(null)
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-lg select-none">
            ₹
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TaxSmart Advisor</h1>
            <p className="text-xs text-slate-400">Old Regime + New Regime · FY 2024-25 · CA-Grade Suggestions</p>
          </div>
        </div>
      </header>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo accent */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl mb-4 text-2xl font-bold text-white shadow-lg">
              ₹
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isSignup
                ? 'Start calculating and saving on taxes'
                : 'Sign in to TaxSmart Advisor'}
            </p>
          </div>

          <div className="card">
            {/* Mode toggle pills */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null) }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                    mode === m
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Raj Sharma"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="raj@example.com"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                  {isSignup && <span className="text-slate-400 font-normal ml-1">(min. 6 characters)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-red-600">⚠️ {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading
                  ? (isSignup ? 'Creating account…' : 'Signing in…')
                  : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={switchMode}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            No data is shared. All tax calculations happen on your machine.
          </p>
        </div>
      </div>
    </div>
  )
}
