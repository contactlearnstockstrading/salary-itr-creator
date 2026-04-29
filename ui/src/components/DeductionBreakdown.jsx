const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

const META = {
  standardDeduction: { label: 'Standard Deduction',        max: 50000,  icon: '📋' },
  '80C':             { label: 'Section 80C',               max: 150000, icon: '📊' },
  '80CCD1B':         { label: 'NPS Personal [80CCD(1B)]',  max: 50000,  icon: '🏦' },
  '80CCD2':          { label: 'Employer NPS [80CCD(2)]',   max: null,   icon: '💼' },
  '80TTA':           { label: 'Savings Interest [80TTA]',  max: 10000,  icon: '🏧' },
  HRA:               { label: 'HRA Exemption',             max: null,   icon: '🏠' },
  LTA:               { label: 'LTA Exemption',             max: 75000,  icon: '✈️'  },
}

function Row({ id, value }) {
  const { label, max, icon } = META[id] || { label: id, max: null, icon: '💰' }
  const pct     = max ? Math.min(100, (value / max) * 100) : 100
  const barColor = pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-amber-400' : 'bg-slate-300'

  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base w-6 text-center">{icon}</span>
          <div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {max && (
              <span className="text-xs text-slate-400 ml-1.5">max {fmt(max)}</span>
            )}
          </div>
        </div>
        <span className={`text-sm font-bold ${value > 0 ? 'text-green-600' : 'text-slate-400'}`}>
          {fmt(value)}
        </span>
      </div>

      {max && (
        <div className="ml-8">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {value < max && value > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">{fmt(max - value)} remaining</p>
          )}
          {value === 0 && (
            <p className="text-xs text-slate-400 mt-0.5">Not claimed</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DeductionBreakdown({ breakdown }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>🏷️</span> Deduction Breakdown
        </h2>
        <span className="text-sm font-bold text-green-600">{fmt(total)}</span>
      </div>
      <p className="text-xs text-slate-400 mb-4">Total deductions from gross income</p>
      <div>
        {Object.entries(breakdown).map(([key, value]) => (
          <Row key={key} id={key} value={value} />
        ))}
      </div>
    </div>
  )
}
