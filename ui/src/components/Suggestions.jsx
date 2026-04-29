import { useState } from 'react'

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

const PRIORITY = {
  HIGH:   { badge: 'badge-high',   border: 'border-l-4 border-red-400',   bg: 'bg-red-50/40'   },
  MEDIUM: { badge: 'badge-medium', border: 'border-l-4 border-amber-400', bg: 'bg-amber-50/40' },
  INFO:   { badge: 'badge-info',   border: 'border-l-4 border-blue-400',  bg: 'bg-blue-50/30'  },
}

function SuggestionCard({ s }) {
  const [open, setOpen] = useState(false)
  const cfg = PRIORITY[s.priority] || PRIORITY.INFO

  return (
    <div className={`rounded-xl border border-slate-100 overflow-hidden ${cfg.bg}`}>
      <div className={`p-4 ${cfg.border}`}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={cfg.badge}>{s.priority}</span>
              <span className="text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-slate-100">
                {s.section}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 leading-snug">{s.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.message}</p>
          </div>

          {s.potentialSaving > 0 && (
            <div className="flex-shrink-0 bg-green-500 text-white text-center px-3 py-2 rounded-lg min-w-[80px]">
              <p className="text-xs font-medium opacity-90">Save up to</p>
              <p className="text-sm font-bold leading-tight">{fmt(s.potentialSaving)}</p>
            </div>
          )}
        </div>

        {/* Expandable action steps */}
        {s.details?.length > 0 && (
          <>
            <button
              onClick={() => setOpen(o => !o)}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span className="text-[10px]">{open ? '▲' : '▼'}</span>
              {open ? 'Hide action steps' : `Show ${s.details.length} action steps`}
            </button>

            {open && (
              <ul className="mt-2.5 space-y-1.5">
                {s.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="flex-shrink-0 w-4 h-4 bg-white/70 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 mt-0.5">
                      {i + 1}
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Suggestions({ suggestions }) {
  const totalSaving  = suggestions.reduce((s, x) => s + (x.potentialSaving || 0), 0)
  const highCount    = suggestions.filter(s => s.priority === 'HIGH').length

  if (!suggestions.length) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-semibold text-slate-700">Excellent! All Deductions Optimized</h3>
        <p className="text-sm text-slate-400 mt-1">No further tax-saving opportunities found.</p>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>💡</span> CA-Style Tax Saving Suggestions
        </h2>
        {highCount > 0 && (
          <span className="badge-high">{highCount} urgent</span>
        )}
      </div>

      {/* Total savings banner */}
      {totalSaving > 0 && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-bold text-green-700">
            💰 Potential Annual Tax Savings: {fmt(totalSaving)}
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            Act on HIGH priority items first — they yield the most savings.
          </p>
        </div>
      )}

      {/* Suggestion cards */}
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <SuggestionCard key={i} s={s} />
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center pt-1">
        * Savings are estimates based on Old Regime slabs. Consult a CA for personalised advice.
      </p>
    </div>
  )
}
