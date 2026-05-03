import { useState } from 'react'

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

const STATUS_CONFIG = {
  SAFE:     { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  icon: '✅', label: 'Compliant — No Interest Due' },
  WARNING:  { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  icon: '⚠️', label: 'Minor Interest Applicable' },
  CRITICAL: { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    icon: '🚨', label: 'Significant Interest Liability' },
}

function SectionRow({ icon, label, section, amount, applicable, description, isRefund }) {
  const [open, setOpen] = useState(false)
  const hasAmount = amount > 0

  return (
    <div className={`rounded-lg border ${hasAmount ? (isRefund ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/30') : 'border-slate-100 bg-slate-50/50'}`}>
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded mr-2">
              {section}
            </span>
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {hasAmount ? (
            <span className={`text-sm font-bold ${isRefund ? 'text-green-600' : 'text-red-600'}`}>
              {isRefund ? '+' : ''}{fmt(amount)}
            </span>
          ) : (
            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
              NIL
            </span>
          )}
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 mt-0">
          <p className="text-xs text-slate-500 leading-relaxed mt-2">{description}</p>
          {!applicable && !isRefund && (
            <p className="text-xs text-green-600 font-medium mt-1">
              Not applicable — your TDS covers this installment/deadline.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function InstallmentTable({ breakdown }) {
  const [open, setOpen] = useState(false)
  const hasShortfalls = breakdown.some(r => r.shortfall > 0)

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-slate-50 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-semibold text-slate-600">
          234C Installment Breakdown
          {!hasShortfalls && (
            <span className="ml-2 text-green-600 font-medium">— All installments covered by TDS</span>
          )}
        </span>
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-500 uppercase tracking-wide">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Required</th>
                <th className="text-right px-3 py-2">Paid by date</th>
                <th className="text-right px-3 py-2">Shortfall</th>
                <th className="text-right px-3 py-2">Interest</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row, i) => (
                <tr key={i} className={`border-t border-slate-100 ${row.shortfall > 0 ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-slate-700">{row.date}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{fmt(row.requiredAmount)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{fmt(row.paidByDate)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${row.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {row.shortfall > 0 ? fmt(row.shortfall) : '—'}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${row.interest > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {row.interest > 0 ? fmt(row.interest) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-slate-400 px-3 py-2 bg-slate-50">
            * Assumes TDS is deducted uniformly across 12 months. Advance tax treated as paid on 15 Mar.
          </p>
        </div>
      )}
    </div>
  )
}

export default function InterestPanel({ details }) {
  if (!details) return null

  const cfg = STATUS_CONFIG[details.complianceStatus] || STATUS_CONFIG.SAFE

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>📋</span> Interest & Compliance (234A / 234B / 234C / 244A)
        </h2>
      </div>

      {/* Status banner */}
      <div className={`p-3.5 rounded-xl border-2 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.icon}</span>
          <div>
            <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
            {details.totalInterestBurden > 0 && (
              <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>
                Total interest you owe: {fmt(details.totalInterestBurden)}
              </p>
            )}
            {details.refundInterest244A > 0 && (
              <p className="text-xs mt-0.5 text-green-600 opacity-80">
                Estimated refund interest you earn: {fmt(details.refundInterest244A)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tax vs Payments summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TDS Deducted',    value: fmt(details.tdsDeducted),   color: 'text-blue-600' },
          { label: 'Advance Tax Paid', value: fmt(details.advanceTaxPaid), color: 'text-blue-600' },
          details.refundAmount > 0
            ? { label: 'Refund Due',   value: fmt(details.refundAmount),   color: 'text-green-600' }
            : { label: 'Tax Still Owed', value: fmt(details.netTaxPayable), color: details.netTaxPayable > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-center">
            <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Section rows */}
      <div className="space-y-2">
        <SectionRow
          icon="📅"
          section="234A"
          label="Late Filing Interest"
          amount={details.interest234A}
          applicable={details.monthsFilingDelay > 0 && details.netTaxPayable > 0}
          isRefund={false}
          description={
            details.monthsFilingDelay === 0
              ? 'No 234A interest — ITR filed on time (by 31 July).'
              : `ITR filed ${details.monthsFilingDelay} month(s) late. Interest = 1% × ${fmt(details.netTaxPayable)} unpaid tax × ${details.monthsFilingDelay} month(s).`
          }
        />
        <SectionRow
          icon="💸"
          section="234B"
          label="Advance Tax Shortfall"
          amount={details.interest234B}
          applicable={details.applicable234B}
          isRefund={false}
          description={
            details.applicable234B
              ? `You paid ${fmt(details.totalTaxPaid)} but 90% threshold was ${fmt(details.threshold90Percent)}. Interest accrues from 1st April until the date of payment.`
              : `Your TDS + advance tax (${fmt(details.totalTaxPaid)}) meets or exceeds 90% of tax liability (${fmt(details.threshold90Percent)}). No 234B interest.`
          }
        />
        <SectionRow
          icon="📆"
          section="234C"
          label="Installment Shortfall"
          amount={details.interest234C}
          applicable={details.applicable234C}
          isRefund={false}
          description="Checks whether your TDS covered the required 15% / 45% / 75% / 100% cumulative tax at each quarterly deadline."
        />
        <SectionRow
          icon="💰"
          section="244A"
          label="Refund Interest (you earn this)"
          amount={details.refundInterest244A}
          applicable={details.refundAmount > 0}
          isRefund={true}
          description={
            details.refundAmount > 0
              ? `Govt. pays 6% p.a. (0.5%/month) on your refund of ${fmt(details.refundAmount)}. File early to maximise this — interest starts from 1st April if you file on time.`
              : 'No refund due — 244A interest not applicable.'
          }
        />
      </div>

      {/* 234C installment breakdown */}
      {details.installmentBreakdown?.length > 0 && (
        <InstallmentTable breakdown={details.installmentBreakdown} />
      )}

      {/* Action items */}
      {details.actionItems?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-blue-700 mb-2">What to do next:</p>
          <ul className="space-y-1.5">
            {details.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700 leading-relaxed">
                <span className="flex-shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center pt-1">
        * Interest estimates are indicative. Exact amounts depend on actual payment dates. Consult a CA for finalised numbers.
      </p>
    </div>
  )
}
