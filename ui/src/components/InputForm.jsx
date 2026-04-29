import { useState } from 'react'

const INITIAL = {
  grossSalary:    '',
  basicSalary:    '',
  hraReceived:    '',
  ltaReceived:    '',
  rentPaid:       '',
  metro:          true,
  section80C:     '',
  section80CCD1B: '',
  section80CCD2:  '',
  savingsInterest:'',
}

function Field({ label, name, value, onChange, placeholder, helper }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min="0"
          className="input-field pl-7"
        />
      </div>
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function InputForm({ onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL)

  const handleChange = ({ target: { name, value } }) =>
    setForm(prev => ({ ...prev, [name]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      grossSalary:    parseFloat(form.grossSalary)    || 0,
      basicSalary:    parseFloat(form.basicSalary)    || 0,
      hraReceived:    parseFloat(form.hraReceived)    || 0,
      ltaReceived:    parseFloat(form.ltaReceived)    || 0,
      rentPaid:       parseFloat(form.rentPaid)       || 0,
      metro:          form.metro,
      section80C:     parseFloat(form.section80C)     || 0,
      section80CCD1B: parseFloat(form.section80CCD1B) || 0,
      section80CCD2:  parseFloat(form.section80CCD2)  || 0,
      savingsInterest:parseFloat(form.savingsInterest)|| 0,
    })
  }

  const canSubmit = form.grossSalary && form.basicSalary && !loading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Salary Structure ── */}
      <Section icon="💰" title="Salary Structure">
        <Field
          label="Annual Gross Salary (CTC)"
          name="grossSalary"
          value={form.grossSalary}
          onChange={handleChange}
          placeholder="e.g. 1200000"
          helper="Total annual income — all components combined"
        />
        <Field
          label="Basic Salary (Annual)"
          name="basicSalary"
          value={form.basicSalary}
          onChange={handleChange}
          placeholder="e.g. 480000"
          helper="Typically 40–50% of CTC. Used for HRA and NPS calculations."
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="HRA Received (Annual)"
            name="hraReceived"
            value={form.hraReceived}
            onChange={handleChange}
            placeholder="e.g. 240000"
            helper="As per salary slip"
          />
          <Field
            label="LTA Received (Annual)"
            name="ltaReceived"
            value={form.ltaReceived}
            onChange={handleChange}
            placeholder="e.g. 50000"
            helper="Leave Travel Allowance"
          />
        </div>
      </Section>

      {/* ── Housing & Rent ── */}
      <Section icon="🏠" title="Housing & Rent">
        <Field
          label="Annual Rent Paid"
          name="rentPaid"
          value={form.rentPaid}
          onChange={handleChange}
          placeholder="e.g. 300000"
          helper="Enter 0 if not paying rent (own house / staying with parents free of charge)"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">City Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '🏙️ Metro City', sub: '50% of Basic for HRA', value: true },
              { label: '🏘️ Non-Metro', sub: '40% of Basic for HRA',  value: false },
            ].map(({ label, sub, value }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setForm(p => ({ ...p, metro: value }))}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                  form.metro === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {label}
                <span className="block text-xs font-normal mt-0.5 opacity-70">{sub}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Metro cities: Delhi, Mumbai, Kolkata, Chennai
          </p>
        </div>
      </Section>

      {/* ── Investments & Deductions ── */}
      <Section icon="📊" title="Investments & Deductions">
        <Field
          label="Section 80C Total Investments"
          name="section80C"
          value={form.section80C}
          onChange={handleChange}
          placeholder="e.g. 150000"
          helper="EPF employee share + PPF + ELSS + LIC + NSC + home loan principal (max ₹1,50,000)"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="NPS Tier-1 Personal [80CCD(1B)]"
            name="section80CCD1B"
            value={form.section80CCD1B}
            onChange={handleChange}
            placeholder="e.g. 50000"
            helper="Extra ₹50K over 80C"
          />
          <Field
            label="Employer NPS [80CCD(2)]"
            name="section80CCD2"
            value={form.section80CCD2}
            onChange={handleChange}
            placeholder="e.g. 0"
            helper="From HR / salary slip"
          />
        </div>
      </Section>

      {/* ── Other Income ── */}
      <Section icon="🏦" title="Other Income">
        <Field
          label="Savings Account Interest (Annual)"
          name="savingsInterest"
          value={form.savingsInterest}
          onChange={handleChange}
          placeholder="e.g. 5000"
          helper="Interest from all savings bank accounts — exempt up to ₹10,000 under 80TTA"
        />
      </Section>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white
                   font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600
                   hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   text-base tracking-wide"
      >
        {loading ? '⚙️  Analyzing…' : '🧮  Calculate Tax & Get CA Suggestions'}
      </button>
    </form>
  )
}
