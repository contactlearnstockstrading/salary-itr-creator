import { useState } from 'react'

const ARTICLES = [
  {
    id: 'old-vs-new',
    icon: '⚖️',
    tag: 'Regime',
    title: 'Old Regime vs New Regime — Which One Should You Pick?',
    oneLiner: 'Two different tax systems. One with deductions, one with lower rates.',
    body: [
      {
        heading: 'Think of it like two phone plans',
        text: 'The Old Regime is like a plan with a high base price but lots of discounts if you invest and claim expenses. The New Regime is a simpler plan — lower base price, but no discounts at all.',
      },
      {
        heading: 'Old Regime — worth it if you:',
        bullets: [
          'Pay rent and claim HRA',
          'Invest in PPF, ELSS, LIC, or EPF (Section 80C)',
          'Have a home loan',
          'Contribute to NPS',
          'Have employer NPS in your salary structure',
        ],
      },
      {
        heading: 'New Regime — better if you:',
        bullets: [
          'Do not invest much in tax-saving instruments',
          'Want simpler tax filing',
          'Have a high salary with few deductions',
          'Are early in your career with no big investments yet',
        ],
      },
      {
        heading: 'The golden rule',
        text: 'Use our calculator — it tells you which regime saves more money for your exact situation. The difference can be anywhere from ₹0 to ₹1+ lakh per year.',
      },
    ],
    keyNumbers: [
      { label: 'New Regime standard deduction', value: '₹75,000' },
      { label: 'Old Regime standard deduction', value: '₹50,000' },
      { label: 'New Regime 87A rebate threshold', value: '₹7,00,000' },
      { label: 'Old Regime 87A rebate threshold', value: '₹5,00,000' },
    ],
  },
  {
    id: 'standard-deduction',
    icon: '📋',
    tag: 'Standard Deduction',
    title: 'Standard Deduction — Free Money Off Your Tax Bill',
    oneLiner: 'A flat deduction every salaried person gets automatically — no paperwork needed.',
    body: [
      {
        heading: 'What is it?',
        text: 'The government says: "We know salaried people have work-related expenses — travel, phone, clothes. Instead of making you prove every rupee, we give you a flat deduction." That is the standard deduction.',
      },
      {
        heading: 'How it works',
        text: 'Your employer automatically reduces your taxable income by this amount before calculating tax. You do not need to submit any bills or proof. It just happens.',
      },
      {
        heading: 'Example',
        text: 'If your gross salary is ₹10,00,000 — your taxable income starts at ₹9,25,000 (New Regime) or ₹9,50,000 (Old Regime) before any other deductions. That saving is worth ₹7,500–₹22,500 in actual tax depending on your slab.',
      },
    ],
    keyNumbers: [
      { label: 'Old Regime deduction', value: '₹50,000' },
      { label: 'New Regime deduction', value: '₹75,000' },
      { label: 'Who gets it', value: 'All salaried employees' },
      { label: 'Proof required', value: 'None' },
    ],
  },
  {
    id: '80c',
    icon: '📊',
    tag: 'Section 80C',
    title: 'Section 80C — The Most Popular Tax Saver in India',
    oneLiner: 'Invest up to ₹1.5 lakh in approved instruments and pay zero tax on that amount.',
    body: [
      {
        heading: 'The simple idea',
        text: 'The government wants you to save for the long term — retirement, children\'s education, life insurance. So it says: invest in these specific things and we will not tax that portion of your income.',
      },
      {
        heading: 'What counts under 80C?',
        bullets: [
          'EPF (Employee Provident Fund) — already deducted from your salary automatically',
          'PPF (Public Provident Fund) — open at any bank or post office, 7.1% tax-free return',
          'ELSS Mutual Funds — 3-year lock-in, market-linked returns (historically 12–15%)',
          'Life Insurance Premium — term plan or LIC premiums',
          'NSC (National Savings Certificate) — 7.7% fixed return, 5-year lock',
          '5-Year Tax-Saving Fixed Deposit — bank FD with tax benefit',
          'Home loan principal repayment',
          'Children\'s tuition fees (up to 2 kids, full-time school/college in India)',
        ],
      },
      {
        heading: 'The trap most people fall into',
        text: 'Your EPF contribution is already counted in 80C. Check your payslip first before investing more. Many people invest ₹1.5L extra and then find EPF already used up the limit.',
      },
      {
        heading: 'Regime note',
        text: 'Section 80C deductions are only available in the Old Tax Regime. In the New Regime, these deductions do not apply.',
      },
    ],
    keyNumbers: [
      { label: 'Maximum deduction', value: '₹1,50,000/year' },
      { label: 'Tax saved (30% slab)', value: 'Up to ₹46,800' },
      { label: 'Tax saved (20% slab)', value: 'Up to ₹31,200' },
      { label: 'Regime', value: 'Old Regime only' },
    ],
  },
  {
    id: '80ccd1b',
    icon: '🏦',
    tag: 'Section 80CCD(1B)',
    title: 'NPS Extra Deduction — ₹50,000 Over and Above 80C',
    oneLiner: 'Invest in NPS and get an additional ₹50,000 deduction on top of your full 80C limit.',
    body: [
      {
        heading: 'Why this is special',
        text: 'Most people know about 80C\'s ₹1.5 lakh limit. But there is a hidden bonus: if you invest in NPS (National Pension System) Tier-1, you get another ₹50,000 deduction completely separate from 80C. That means your total deduction can be ₹2,00,000.',
      },
      {
        heading: 'What is NPS Tier-1?',
        text: 'It is a government pension account. You put money in, it grows (you choose equity/debt mix), and at retirement you get 60% as a lump sum and 40% as a monthly pension. It is very safe, regulated by PFRDA.',
      },
      {
        heading: 'The catch',
        bullets: [
          'Money is locked until age 60 (with some partial withdrawal exceptions)',
          'Annuity portion (40%) is taxable when received as pension',
          'Returns depend on your fund choice — not guaranteed like PPF',
          'Only available under Old Tax Regime',
        ],
      },
      {
        heading: 'Best for',
        text: 'People who have already maxed 80C and want additional tax savings. If you are in the 30% bracket, this ₹50,000 deduction saves you ₹15,600 extra per year.',
      },
    ],
    keyNumbers: [
      { label: 'Extra deduction (over 80C)', value: '₹50,000/year' },
      { label: 'Tax saved at 30% slab', value: '₹15,600' },
      { label: 'Total with 80C', value: '₹2,00,000 deduction' },
      { label: 'Regime', value: 'Old Regime only' },
    ],
  },
  {
    id: '80ccd2',
    icon: '💼',
    tag: 'Section 80CCD(2)',
    title: 'Employer NPS — The Only Deduction That Works in Both Regimes',
    oneLiner: 'Ask your employer to contribute to NPS from your CTC — it is tax-free in both Old and New Regime.',
    body: [
      {
        heading: 'The magic of CTC restructuring',
        text: 'Your total salary package (CTC) can be restructured so that part of it goes as your employer\'s NPS contribution. Your take-home stays the same. Your tax goes down. It costs your employer nothing extra.',
      },
      {
        heading: 'A real example',
        text: 'Suppose your basic salary is ₹5,00,000/year. Your employer can contribute up to ₹50,000 (10% of basic) as employer NPS. This ₹50,000 is completely tax-free — it does not get added to your income at all.',
      },
      {
        heading: 'Why this is better than other deductions',
        bullets: [
          'Works in BOTH Old and New Tax Regime — almost nothing else does',
          'No out-of-pocket cost — money comes from your existing CTC',
          'No upper rupee limit in law (capped at 10% of basic in practice)',
          'Builds your retirement corpus at zero extra cost to you',
        ],
      },
      {
        heading: 'How to get it',
        text: 'Email your HR asking to restructure your CTC to include employer NPS contribution under 80CCD(2). Most mid-to-large companies have this option. It is a one-time request and can make a big difference.',
      },
    ],
    keyNumbers: [
      { label: 'Cap (private sector)', value: '10% of Basic salary' },
      { label: 'Regime', value: 'Old AND New Regime' },
      { label: 'Out-of-pocket cost', value: 'Zero — comes from CTC' },
      { label: 'Tax saved (30% slab, ₹5L basic)', value: 'Up to ₹15,600' },
    ],
  },
  {
    id: 'hra',
    icon: '🏠',
    tag: 'HRA Exemption',
    title: 'HRA — Save Tax on the Rent You Pay',
    oneLiner: 'If your employer pays you HRA and you pay rent, a big chunk of it is tax-free.',
    body: [
      {
        heading: 'What is HRA?',
        text: 'House Rent Allowance is a part of your salary specifically meant for rent. The government says: if you are actually paying rent, a portion of this HRA is exempt from tax.',
      },
      {
        heading: 'The exemption formula — minimum of 3 conditions',
        bullets: [
          'Condition 1: Actual HRA received from employer',
          'Condition 2: Rent paid minus 10% of your basic salary',
          'Condition 3: 50% of basic (if you live in Delhi/Mumbai/Kolkata/Chennai) OR 40% of basic (all other cities)',
        ],
      },
      {
        heading: 'Real example',
        text: 'Basic = ₹6L/yr, HRA = ₹3L/yr, Rent paid = ₹3.6L/yr, Metro city. C1=3L, C2=3.6L−0.6L=3L, C3=3L. Exemption = min(3L, 3L, 3L) = ₹3,00,000 fully exempt.',
      },
      {
        heading: 'The lesser-known tip',
        text: 'Even if you live with your parents, you can pay them rent and claim HRA. Your parents declare it as rental income (often taxed at 0% or 5% due to their lower income). Completely legal — accepted by the Income Tax department.',
      },
      {
        heading: 'Important: provide PAN if rent > ₹1L/year',
        text: 'If your annual rent exceeds ₹1,00,000, you must provide your landlord\'s PAN card to your employer. Without this, the employer cannot give you the exemption.',
      },
    ],
    keyNumbers: [
      { label: 'Metro HRA rate (max)', value: '50% of Basic' },
      { label: 'Non-metro HRA rate (max)', value: '40% of Basic' },
      { label: 'Regime', value: 'Old Regime only' },
      { label: 'PAN required if rent >', value: '₹1,00,000/year' },
    ],
  },
  {
    id: 'lta',
    icon: '✈️',
    tag: 'LTA',
    title: 'LTA — Your Travel Costs Can Be Tax-Free',
    oneLiner: 'Leave Travel Allowance lets you claim tax exemption on domestic travel costs twice every 4 years.',
    body: [
      {
        heading: 'What is LTA?',
        text: 'Many employers include LTA in your salary package. When you actually travel within India on leave, you can claim the travel expenses and pay no tax on that portion of your salary.',
      },
      {
        heading: 'How it works',
        bullets: [
          'Available twice in a 4-year block (current block: 2022–2025)',
          'Only covers travel cost — hotel, food, sightseeing are NOT covered',
          'Mode of travel: Economy class air OR AC First / AC 2-Tier train',
          'Only domestic travel counts — no international trips',
          'Covers: you, spouse, 2 children, dependent parents and siblings',
        ],
      },
      {
        heading: 'What you need to submit',
        text: 'Boarding passes and air/train tickets. Keep originals. Submit to your employer before the financial year ends (usually January/February deadline). Your employer deducts less TDS once approved.',
      },
      {
        heading: 'Unused LTA',
        text: 'If you don\'t travel in a 4-year block, one unused exemption carries forward to the first year of the next block. So you can claim it in year 1 of 2026–2029 for a trip you should have taken in 2022–2025.',
      },
    ],
    keyNumbers: [
      { label: 'Cap', value: '₹75,000/year (or LTA received)' },
      { label: 'Claims per block', value: '2 times in 4 years' },
      { label: 'Current block', value: '2022–2025' },
      { label: 'Regime', value: 'Old Regime only' },
    ],
  },
  {
    id: '80tta',
    icon: '🏧',
    tag: 'Section 80TTA',
    title: '80TTA — Your Savings Account Interest is Partially Tax-Free',
    oneLiner: 'The first ₹10,000 of interest from your savings bank account is exempt from tax every year.',
    body: [
      {
        heading: 'What most people miss',
        text: 'Savings account interest is technically taxable income. But almost nobody pays tax on it because of Section 80TTA, which exempts the first ₹10,000 each year.',
      },
      {
        heading: 'What 80TTA covers',
        bullets: [
          'Savings accounts in banks (scheduled and co-operative)',
          'Post Office savings accounts',
          'Interest across ALL your savings accounts is pooled together',
        ],
      },
      {
        heading: 'What 80TTA does NOT cover',
        bullets: [
          'Fixed Deposits — FD interest is fully taxable',
          'Recurring Deposits — RD interest is fully taxable',
          'Senior citizens (60+) should use 80TTB instead — limit is ₹50,000',
        ],
      },
      {
        heading: 'Important: you still need to declare it',
        text: 'Even if your savings interest is below ₹10,000, declare it in your ITR under "Income from Other Sources." If you don\'t, your bank\'s Form 26AS will show the credit and the IT department may send a notice.',
      },
    ],
    keyNumbers: [
      { label: 'Exemption limit', value: '₹10,000/year' },
      { label: 'Senior citizens (80TTB)', value: '₹50,000/year' },
      { label: 'Covers', value: 'Savings accounts only' },
      { label: 'Regime', value: 'Old Regime only' },
    ],
  },
  {
    id: '87a',
    icon: '🎁',
    tag: 'Section 87A',
    title: 'Section 87A Rebate — Zero Tax if You Earn Below the Threshold',
    oneLiner: 'If your taxable income is within the limit, the government wipes your entire tax bill to zero.',
    body: [
      {
        heading: 'The simple version',
        text: 'If your income after all deductions falls within the rebate limit, your tax becomes zero. Not reduced — completely zero. It is the government\'s way of ensuring lower-income earners pay no tax.',
      },
      {
        heading: 'How it works',
        text: 'You calculate your tax normally using the slabs. Then, if your taxable income is within the threshold, the full tax amount is given back as a rebate. So the net tax payable = ₹0.',
      },
      {
        heading: 'Old Regime vs New Regime threshold',
        bullets: [
          'Old Regime: taxable income ≤ ₹5,00,000 → zero tax',
          'New Regime: taxable income ≤ ₹7,00,000 → zero tax',
          'This is why the New Regime is attractive for salaries up to ~₹8–9L (after standard deduction)',
        ],
      },
      {
        heading: 'Example (New Regime)',
        text: 'Gross salary ₹7,75,000. Minus standard deduction ₹75,000 = taxable income ₹7,00,000. Tax on ₹7L = ₹25,000. But 87A rebate applies → final tax = ₹0.',
      },
    ],
    keyNumbers: [
      { label: 'Old Regime rebate threshold', value: '₹5,00,000 taxable income' },
      { label: 'New Regime rebate threshold', value: '₹7,00,000 taxable income' },
      { label: 'Rebate amount', value: 'Full tax (up to ₹25,000)' },
      { label: 'Net tax payable', value: '₹0' },
    ],
  },
  {
    id: 'surcharge',
    icon: '⚠️',
    tag: 'Surcharge',
    title: 'Surcharge — The Extra Tax on Top of Tax for High Earners',
    oneLiner: 'If your income crosses ₹50 lakh, you pay an additional percentage on top of your regular tax.',
    body: [
      {
        heading: 'What is surcharge?',
        text: 'Surcharge is not a new tax slab. It is a percentage added to your calculated tax. Think of it as a "high income premium." The higher your income, the higher the surcharge rate.',
      },
      {
        heading: 'Surcharge rates (both regimes)',
        bullets: [
          'Income ₹50L – ₹1 Cr → 10% surcharge on your tax',
          'Income ₹1 Cr – ₹2 Cr → 15% surcharge on your tax',
          'Income ₹2 Cr – ₹5 Cr → 25% surcharge on your tax',
          'Income above ₹5 Cr → 37% surcharge on your tax',
        ],
      },
      {
        heading: 'Real example',
        text: 'Taxable income ₹60L. Regular tax = ₹14.25L (approx). Surcharge = 10% of ₹14.25L = ₹1.43L. Plus 4% cess on everything. Total = ~₹16.3L. That is why every deduction becomes more valuable at this income level.',
      },
      {
        heading: 'What can you do?',
        bullets: [
          'Maximise all deductions (80C, NPS, HRA) — each rupee saved reduces surcharge too',
          'Use employer NPS (80CCD2) — works in both regimes',
          'Consider HUF (Hindu Undivided Family) to split income — consult a CA',
          'Explore LTCG harvesting on equity investments — surcharge capped at 15% for equity LTCG',
        ],
      },
    ],
    keyNumbers: [
      { label: 'Kicks in at', value: '₹50,00,000 taxable income' },
      { label: 'Rate range', value: '10% to 37% on tax' },
      { label: 'Plus cess', value: '4% on (tax + surcharge)' },
      { label: 'Regime', value: 'Both Old and New' },
    ],
  },
]

function KeyNumber({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  )
}

function Article({ article }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card">
      {/* Header — always visible */}
      <button
        className="w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{article.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                  {article.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{article.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{article.oneLiner}</p>
            </div>
          </div>
          <span className="text-slate-400 text-sm flex-shrink-0 mt-1">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body — expanded */}
      {open && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">

          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-2">
            {article.keyNumbers.map((kn, i) => (
              <KeyNumber key={i} label={kn.label} value={kn.value} />
            ))}
          </div>

          {/* Body sections */}
          {article.body.map((section, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-slate-700 mb-1.5">{section.heading}</h4>
              {section.text && (
                <p className="text-sm text-slate-600 leading-relaxed">{section.text}</p>
              )}
              {section.bullets && (
                <ul className="space-y-1.5">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-orange-400 mt-1 flex-shrink-0">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Articles() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Tax Guide — In Plain English</h2>
        <p className="text-sm text-slate-500">Click any section to understand it without the jargon.</p>
      </div>
      {ARTICLES.map(article => (
        <Article key={article.id} article={article} />
      ))}
      <p className="text-xs text-slate-400 text-center pt-2 pb-6">
        Based on Indian Income Tax Act, FY 2024-25. Consult a CA for personalised advice.
      </p>
    </div>
  )
}
