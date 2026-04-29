import { useState } from 'react'
import InputForm from './components/InputForm'
import RegimeComparison from './components/RegimeComparison'
import TaxSummary from './components/TaxSummary'
import Suggestions from './components/Suggestions'
import DeductionBreakdown from './components/DeductionBreakdown'
import { calculateTax } from './services/api'

export default function App() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleCalculate = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const data = await calculateTax(formData)
      setResult(data)
      // Scroll to results on mobile
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err.message || 'Failed to calculate. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-lg select-none">
              ₹
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TaxSmart Advisor</h1>
              <p className="text-xs text-slate-400">Old Regime + New Regime · FY 2024-25 · CA-Grade Suggestions</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400">Based on Indian IT Act</p>
            <p className="text-xs text-orange-400 font-medium">Save More. File Smart.</p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left – Input Form */}
          <div>
            <InputForm onSubmit={handleCalculate} loading={loading} />
          </div>

          {/* Right – Results */}
          <div id="results" className="space-y-5">
            {error && (
              <div className="card border-l-4 border-red-500">
                <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Your Tax Report Awaits
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Fill in your salary details on the left<br />
                  and click <strong>Calculate Tax</strong> for CA-grade advice.
                </p>
              </div>
            )}

            {loading && (
              <div className="card text-center py-16">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-orange-300 border-t-orange-500 rounded-full mb-4" />
                <p className="text-slate-600 font-medium">Analyzing your tax profile…</p>
              </div>
            )}

            {result && !loading && (
              <>
                <RegimeComparison result={result} />
                <TaxSummary result={result} />
                <DeductionBreakdown breakdown={result.breakdown} />
                <Suggestions suggestions={result.suggestions} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 pb-8 text-center text-xs text-slate-400 space-y-1">
        <p>Estimates based on Indian IT Act. Consult a CA for final tax advice.</p>
        <p>No data is stored — all calculations happen on your machine.</p>
      </footer>
    </div>
  )
}
