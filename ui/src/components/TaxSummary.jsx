const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

function MetricCard({ icon, label, value, sub, colorClass }) {
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

export default function TaxSummary({ result }) {
  const { grossSalary, totalDeductions, taxableIncome, estimatedTax, effectiveTaxRate } = result

  const rateColor =
    effectiveTaxRate < 5  ? 'bg-green-500' :
    effectiveTaxRate < 15 ? 'bg-amber-500' : 'bg-red-500'

  const barWidth = `${Math.min(100, effectiveTaxRate * 3.33).toFixed(1)}%`

  return (
    <div className="card space-y-5">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
        <span>📋</span> Tax Summary — Old Regime
      </h2>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon="💰" label="Gross Income"
          value={fmt(grossSalary)}
          colorClass="bg-blue-50 text-blue-900 border-blue-100"
        />
        <MetricCard
          icon="🏷️" label="Total Deductions"
          value={fmt(totalDeductions)}
          sub="All exemptions + investments"
          colorClass="bg-green-50 text-green-900 border-green-100"
        />
        <MetricCard
          icon="📄" label="Taxable Income"
          value={fmt(taxableIncome)}
          sub="After all deductions"
          colorClass="bg-slate-50 text-slate-800 border-slate-100"
        />
        <MetricCard
          icon="🏛️" label="Estimated Tax"
          value={fmt(estimatedTax)}
          sub={`${effectiveTaxRate}% effective rate`}
          colorClass={
            effectiveTaxRate < 5  ? 'bg-green-50 text-green-900 border-green-100'  :
            effectiveTaxRate < 15 ? 'bg-amber-50 text-amber-900 border-amber-100'  :
                                    'bg-red-50 text-red-900 border-red-100'
          }
        />
      </div>

      {/* Effective rate bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">Effective Tax Rate</span>
          <span className="font-bold">{effectiveTaxRate}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${rateColor}`}
            style={{ width: barWidth }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0% — optimal</span>
          <span>30% — max slab</span>
        </div>
      </div>

      {/* Section 87A notice */}
      {taxableIncome <= 500000 && estimatedTax === 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-semibold">
            ✅ Section 87A Rebate Applied — Taxable income ≤ ₹5,00,000, so tax payable = ₹0!
          </p>
        </div>
      )}
    </div>
  )
}
