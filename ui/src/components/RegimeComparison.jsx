const fmt  = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
// Compact format for comparison card (avoids strict-mode clashes with TaxSummary exact values)
const fmtC = (n) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`
  return fmt(n)
}

function RegimeCard({ label, taxableIncome, estimatedTax, effectiveTaxRate, breakdown, isRecommended }) {
  const rateColor =
    effectiveTaxRate < 5  ? 'text-green-600' :
    effectiveTaxRate < 15 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className={`rounded-xl border-2 p-4 relative transition-all ${
      isRecommended
        ? 'border-green-400 bg-green-50/40 shadow-sm'
        : 'border-slate-200 bg-slate-50/50'
    }`}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            ✓ Recommended
          </span>
        </div>
      )}

      <h3 className="text-center font-semibold text-slate-700 mt-2 mb-4">{label}</h3>

      {/* Key numbers */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Net Taxable</span>
          <span className="font-medium text-slate-700">{fmt(taxableIncome)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">Tax Payable</span>
          <span className={`text-lg font-bold ${rateColor}`}>{fmtC(estimatedTax)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Effective Rate</span>
          <span className={`font-semibold ${rateColor}`}>{effectiveTaxRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Deduction breakdown */}
      <div className="mt-3 pt-3 border-t border-slate-200/70">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Deductions</p>
        <div className="space-y-1">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-slate-500">
                {key === 'standardDeduction' ? 'Std. Deduction' : key}
              </span>
              <span className={val > 0 ? 'text-green-600 font-medium' : 'text-slate-300'}>
                {val > 0 ? fmt(val) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RegimeComparison({ result }) {
  const {
    taxableIncome, estimatedTax, effectiveTaxRate, breakdown,
    newRegimeTaxableIncome, newRegimeEstimatedTax, newRegimeEffectiveTaxRate, newRegimeBreakdown,
    recommendedRegime,
  } = result

  // Guard — won't render if backend didn't return new regime data
  if (newRegimeTaxableIncome == null) return null

  const savings = Math.abs(estimatedTax - newRegimeEstimatedTax)
  const winner  = recommendedRegime === 'NEW' ? 'New Regime' : 'Old Regime'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>⚖️</span> Old vs New Tax Regime
        </h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded font-medium">FY 2024-25</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RegimeCard
          label="Old Regime"
          taxableIncome={taxableIncome}
          estimatedTax={estimatedTax}
          effectiveTaxRate={effectiveTaxRate}
          breakdown={breakdown}
          isRecommended={recommendedRegime === 'OLD'}
        />
        <RegimeCard
          label="New Regime"
          taxableIncome={newRegimeTaxableIncome}
          estimatedTax={newRegimeEstimatedTax}
          effectiveTaxRate={newRegimeEffectiveTaxRate}
          breakdown={newRegimeBreakdown}
          isRecommended={recommendedRegime === 'NEW'}
        />
      </div>

      {/* Verdict banner */}
      <div className={`mt-4 p-3.5 rounded-xl text-center ${
        recommendedRegime === 'NEW'
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-orange-50 border border-orange-200'
      }`}>
        {savings > 0 ? (
          <>
            <p className="text-sm font-bold text-slate-700">
              {winner} saves you <span className="text-green-600">{fmtC(savings)}</span> in taxes this year
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {recommendedRegime === 'NEW'
                ? '📝 New Regime: lower slabs, fewer deductions — simpler filing'
                : '📊 Old Regime: more deductions available — worth it when you invest actively'}
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-slate-600">
            Both regimes result in equal tax — choose New Regime for simpler filing
          </p>
        )}
      </div>
    </div>
  )
}
