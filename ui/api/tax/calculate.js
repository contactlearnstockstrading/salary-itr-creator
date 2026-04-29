/**
 * Vercel Serverless Function — POST /api/tax/calculate
 *
 * Full port of the Spring Boot TaxCalculatorService to Node.js.
 * No external dependencies — pure JavaScript math.
 *
 * Old Regime slabs (FY 2024-25):
 *   0 – 2.5L   →  0%
 *   2.5L – 5L  →  5%
 *   5L – 10L   → 20%
 *   > 10L      → 30%
 *
 * New Regime slabs (Budget 2024, FY 2024-25):
 *   0 – 3L     →  0%
 *   3L – 7L    →  5%
 *   7L – 10L   → 10%
 *   10L – 12L  → 15%
 *   12L – 15L  → 20%
 *   > 15L      → 30%
 */

// ── Limits ────────────────────────────────────────────────────────────────────
const STANDARD_DEDUCTION    = 50_000
const MAX_80C               = 1_50_000
const MAX_80TTA             = 10_000
const MAX_80CCD1B           = 50_000
const LTA_CAP               = 75_000
const NEW_STANDARD_DEDUCTION = 75_000

// ── Formatters ────────────────────────────────────────────────────────────────
function inr(amount) {
  if (amount >= 1_00_00_000) return `Rs.${(amount / 1_00_00_000).toFixed(1)} Cr`
  if (amount >= 10_00_000)   return `Rs.${(amount / 1_00_000).toFixed(0)} L`
  if (amount >= 1_00_000)    return `Rs.${(amount / 1_00_000).toFixed(1)} L`
  if (amount >= 1_000)       return `Rs.${Math.round(amount).toLocaleString('en-IN')}`
  return `Rs.${Math.round(amount)}`
}

// ── HRA ───────────────────────────────────────────────────────────────────────
function computeHRA(basic, hraReceived, rentPaid, metro) {
  if (hraReceived <= 0 || rentPaid <= 0) return 0
  const c1 = hraReceived
  const c2 = Math.max(0, rentPaid - 0.10 * basic)
  const c3 = metro ? 0.50 * basic : 0.40 * basic
  return Math.round(Math.min(c1, c2, c3))
}

// ── Old Regime tax ────────────────────────────────────────────────────────────
function computeTax(income) {
  if (income <= 0) return 0

  let baseTax = 0
  if (income > 2_50_000)  baseTax += Math.min(income - 2_50_000, 2_50_000) * 0.05
  if (income > 5_00_000)  baseTax += Math.min(income - 5_00_000, 5_00_000) * 0.20
  if (income > 10_00_000) baseTax += (income - 10_00_000) * 0.30

  const surcharge = surchargeRate(income) * baseTax
  let total = (baseTax + surcharge) * 1.04  // 4% cess

  if (income <= 5_00_000) total = 0  // Section 87A

  return Math.round(total)
}

// ── New Regime tax ────────────────────────────────────────────────────────────
function computeNewRegimeTax(income) {
  if (income <= 0) return 0

  let baseTax = 0
  if (income > 3_00_000)  baseTax += Math.min(income - 3_00_000, 4_00_000) * 0.05
  if (income > 7_00_000)  baseTax += Math.min(income - 7_00_000, 3_00_000) * 0.10
  if (income > 10_00_000) baseTax += Math.min(income - 10_00_000, 2_00_000) * 0.15
  if (income > 12_00_000) baseTax += Math.min(income - 12_00_000, 3_00_000) * 0.20
  if (income > 15_00_000) baseTax += (income - 15_00_000) * 0.30

  const surcharge = surchargeRate(income) * baseTax
  let total = (baseTax + surcharge) * 1.04  // 4% cess

  if (income <= 7_00_000) total = 0  // 87A rebate — higher threshold in new regime

  return Math.round(total)
}

function surchargeRate(income) {
  if (income > 5_00_00_000) return 0.37
  if (income > 2_00_00_000) return 0.25
  if (income > 1_00_00_000) return 0.15
  if (income >   50_00_000) return 0.10
  return 0
}

function effectiveRate(tax, gross) {
  if (!gross) return 0
  return Math.round((tax / gross) * 10_000) / 100
}

// ── Old Regime suggestion builders ───────────────────────────────────────────

function suggest80C(req, bd, taxable, tax) {
  const used = bd['80C']
  if (used >= MAX_80C) return null
  const gap    = MAX_80C - used
  const saving = tax - computeTax(Math.max(0, taxable - gap))
  return {
    section: '80C',
    priority: gap > 50_000 ? 'HIGH' : 'MEDIUM',
    title: `${inr(gap)} of Section 80C Limit Still Unutilized`,
    message: `You can invest ${inr(gap)} more to claim the full ${inr(MAX_80C)} deduction under Section 80C and save up to ${inr(saving)} in tax.`,
    details: [
      'ELSS Mutual Funds – 3-year lock-in, historically 12–15% p.a. returns (best for wealth creation + tax saving)',
      'PPF (Public Provident Fund) – 7.1% tax-free returns, govt-backed, 15-year tenure with partial withdrawal',
      'Life Insurance Premium (term plan / LIC / endowment policy) – protect family AND save tax',
      '5-Year Tax-Saving Fixed Deposit – guaranteed returns, zero market risk',
      'NSC (National Savings Certificate) – 7.7% p.a., issued by India Post, 5-year maturity',
      'EPF Voluntary Provident Fund (VPF) top-up – earns same rate as EPF (8.15%), fully tax-free',
      'Home loan principal repayment (if applicable) – qualifies under 80C',
      "Children's tuition fees for up to 2 children – full-time education in India only",
    ],
    potentialSaving: Math.max(0, saving),
  }
}

function suggest80CCD1B(req, bd, taxable, tax) {
  const used = bd['80CCD1B']
  if (used >= MAX_80CCD1B) return null
  const gap    = MAX_80CCD1B - used
  const saving = tax - computeTax(Math.max(0, taxable - gap))
  return {
    section: '80CCD(1B)',
    priority: 'HIGH',
    title: `NPS Tier-1: Exclusive ${inr(gap)} Extra Deduction Available`,
    message: `Section 80CCD(1B) grants an ADDITIONAL ${inr(MAX_80CCD1B)} deduction OVER AND ABOVE your ${inr(MAX_80C)} 80C limit — exclusively for NPS Tier-1. Potential saving: ${inr(saving)}.`,
    details: [
      'NPS Tier-1 is a government-regulated pension account – very safe and transparent',
      'Choose your allocation: Equity (E) up to 75%, Corporate Bonds (C), Govt Securities (G)',
      `This deduction is SEPARATE from 80C — combine both for maximum ${inr(MAX_80C + MAX_80CCD1B)} deduction`,
      'Open NPS online at enps.nsdl.com or through your bank (SBI, HDFC, ICICI, etc.)',
      'At retirement: 60% lump sum (partially tax-free) + 40% mandatory annuity for monthly pension',
      'Partial withdrawals allowed after 3 years for specified reasons (illness, education, home)',
      'Available under Old Tax Regime only',
    ],
    potentialSaving: Math.max(0, saving),
  }
}

function suggestHRA(req, bd, taxable, tax) {
  if (req.hraReceived <= 0) return null

  if (req.rentPaid <= 0) {
    const maxPossible = Math.min(req.hraReceived, req.metro ? 0.50 * req.basicSalary : 0.40 * req.basicSalary)
    const saving = tax - computeTax(Math.max(0, taxable - Math.round(maxPossible)))
    return {
      section: 'HRA',
      priority: 'HIGH',
      title: `HRA Received But Exemption Not Claimed — Potential Loss: ${inr(saving)}`,
      message: `You receive HRA of ${inr(Math.round(req.hraReceived))}/yr but declared zero rent. Paying rent (even to parents) could save up to ${inr(saving)} in tax annually.`,
      details: [
        'Pay rent to parents or in-laws — 100% legal, accepted by Income Tax Dept.',
        'Your parents declare it as rental income (usually in 0% or 5% slab due to basic exemption)',
        'Get monthly rent receipts on ₹100 stamp paper signed by the landlord',
        'Submit Form 12BB to HR/employer with: landlord name, address, and monthly amount',
        "If annual rent exceeds ₹1,00,000 — mandatory to provide landlord's PAN card",
        'HRA Exemption Formula: minimum of (1) Actual HRA, (2) Rent − 10% basic, (3) 50/40% basic',
      ],
      potentialSaving: Math.max(0, saving),
    }
  }

  const currentHRA = bd['HRA']
  if (currentHRA < req.hraReceived) {
    const c1 = req.hraReceived
    const c2 = Math.max(0, req.rentPaid - 0.10 * req.basicSalary)
    const c3 = req.metro ? 0.50 * req.basicSalary : 0.40 * req.basicSalary
    const limiting = (c2 <= c1 && c2 <= c3)
      ? 'Condition 2 (Rent − 10% of basic)'
      : `Condition 3 (${req.metro ? '50' : '40'}% of basic)`
    return {
      section: 'HRA',
      priority: 'MEDIUM',
      title: `HRA Exemption Capped by ${limiting}`,
      message: `Your HRA exemption is ${inr(currentHRA)} out of ${inr(Math.round(req.hraReceived))} received. The lowest of 3 conditions applies.`,
      details: [
        `Condition 1 – Actual HRA received: ${inr(Math.round(req.hraReceived))}`,
        `Condition 2 – Rent paid − 10% of basic: ${inr(Math.round(Math.max(0, req.rentPaid - 0.10 * req.basicSalary)))}`,
        `Condition 3 – ${req.metro ? '50' : '40'}% of basic salary: ${inr(Math.round(req.metro ? 0.50 * req.basicSalary : 0.40 * req.basicSalary))}`,
        'Increasing your rent paid can raise Condition 2 and potentially increase your exemption',
        'Ensure you are paying actual rent — sub-letting your own property to yourself is not allowed',
      ],
      potentialSaving: 0,
    }
  }
  return null
}

function suggest80CCD2(req, bd, taxable, tax) {
  if (bd['80CCD2'] > 0) return null
  const maxPossible = Math.round(0.10 * req.basicSalary)
  const saving      = tax - computeTax(Math.max(0, taxable - maxPossible))
  return {
    section: '80CCD(2)',
    priority: 'MEDIUM',
    title: `Employer NPS [80CCD(2)] Not Used — Free Tax Saving via CTC Restructuring`,
    message: `Employer NPS contribution is FULLY TAX-FREE with no monetary cap. For your basic salary, max benefit is ${inr(maxPossible)}/yr — saving up to ${inr(saving)} at zero extra cost.`,
    details: [
      'Request HR to restructure your CTC: reduce a taxable component, add Employer NPS contribution',
      'Your total CTC stays exactly the same — no cost to you or employer',
      'Private sector employees: max 10% of (Basic + DA) under 80CCD(2)',
      'This deduction works under BOTH Old and New Tax Regime — universally beneficial',
      'It builds your NPS retirement corpus while saving tax every year',
      'Unlike 80C and 80CCD(1B), this has no fixed upper limit in law (capped by 10% of basic)',
    ],
    potentialSaving: Math.max(0, saving),
  }
}

function suggest80TTA(req) {
  const interest = req.savingsInterest || 0
  if (interest <= 0) return null

  if (interest <= MAX_80TTA) {
    return {
      section: '80TTA',
      priority: 'INFO',
      title: `Savings Interest ${inr(Math.round(interest))} Fully Exempt Under 80TTA`,
      message: `Your entire savings account interest is within the ${inr(MAX_80TTA)} Section 80TTA limit — no tax on this amount.`,
      details: [
        '80TTA covers interest from: savings accounts in scheduled banks, co-op banks, and post offices',
        'Fixed Deposit / Recurring Deposit interest is NOT covered — it is fully taxable',
        'Senior citizens (age 60+) should use Section 80TTB instead — limit is Rs.50,000',
        "Remember to declare this interest in your ITR under 'Income from Other Sources'",
        'Collect interest certificate from your bank for accurate reporting',
      ],
      potentialSaving: 0,
    }
  }

  const excess = Math.round(interest) - MAX_80TTA
  return {
    section: '80TTA',
    priority: 'INFO',
    title: `80TTA Limit Exceeded — ${inr(excess)} Extra Interest is Taxable`,
    message: `Only ${inr(MAX_80TTA)} of your ${inr(Math.round(interest))} savings interest is exempt. The remaining ${inr(excess)} is added to taxable income.`,
    details: [
      'Spreading savings across multiple banks does NOT increase the 80TTA exemption limit',
      'Consider parking excess funds in liquid debt mutual funds — more tax-efficient (LTCG if held 3+ yrs)',
      'ELSS or PPF could be better alternatives for parking surplus cash with tax benefits',
      'Declare all interest income in ITR (Form 26AS reconciliation) to avoid IT notices',
    ],
    potentialSaving: 0,
  }
}

function suggestLTA(bd) {
  const lta = bd['LTA']
  if (lta <= 0) return null
  return {
    section: 'LTA',
    priority: 'INFO',
    title: `LTA Exemption of ${inr(lta)} Applied — Keep Your Travel Documents`,
    message: 'Leave Travel Allowance exemption has been applied. Ensure you submit travel proof to your employer.',
    details: [
      'LTA covers DOMESTIC travel only — international travel is not exempt',
      'Available TWICE in a 4-year block (current block: 2022–2025)',
      'Eligible transport: Economy class airfare OR AC First Class / AC 2-Tier rail fare',
      'Submit to employer: boarding passes, air/rail tickets, hotel bills (travel only)',
      'Covers travel of: self, spouse, up to 2 children, dependent parents and siblings',
      'Unused LTA in a block can be carried forward to the first year of the next block (once)',
    ],
    potentialSaving: 0,
  }
}

function suggestSurcharge(taxableIncome) {
  if (taxableIncome <= 50_00_000) return null
  const rate = taxableIncome > 5_00_00_000 ? 37
    : taxableIncome > 2_00_00_000 ? 25
    : taxableIncome > 1_00_00_000 ? 15 : 10
  return {
    section: 'Surcharge',
    priority: 'HIGH',
    title: `Surcharge Alert: ${rate}% Surcharge on Tax — Advanced Planning Needed`,
    message: `Your taxable income exceeds Rs.50 Lakh, attracting a ${rate}% surcharge on top of regular tax. Consult a CA for income restructuring.`,
    details: [
      'Form a Hindu Undivided Family (HUF) to split income — HUF gets its own basic exemption slab',
      'Section 54 / 54F exemption if you have capital gains from property or equity sale',
      'Gift to spouse or family members (clubbing provisions apply — verify with CA first)',
      'All deductions (80C, NPS, HRA) are even more valuable — ₹1 saved = ₹1 + surcharge + cess',
      'Consider pre-paying home loan for 80C benefit and interest deduction under Section 24(b)',
      'Explore LTCG (Long Term Capital Gains) harvesting on equity to utilize 10% LTCG exemption',
    ],
    potentialSaving: 0,
  }
}

// ── New Regime suggestion builders ───────────────────────────────────────────

function suggestNewRegime80CCD2(req, ded80CCD2, taxable, tax) {
  if (ded80CCD2 > 0) return null
  const maxPossible = Math.round(0.10 * req.basicSalary)
  const saving      = tax - computeNewRegimeTax(Math.max(0, taxable - maxPossible))
  return {
    section: '80CCD(2)',
    priority: 'HIGH',
    title: `Employer NPS [80CCD(2)] Works in New Regime — ${inr(maxPossible)} Tax-Free`,
    message: `80CCD(2) Employer NPS is one of the few deductions allowed under the New Regime. Your employer can contribute ${inr(maxPossible)}/yr tax-free, saving you up to ${inr(saving)}.`,
    details: [
      '80CCD(2) Employer NPS is explicitly allowed under the New Tax Regime — unlike 80C, HRA, LTA',
      'Request HR to restructure your CTC: reduce a taxable component, add Employer NPS contribution',
      'Total CTC stays exactly the same — zero extra cost to you or your employer',
      'Private sector: up to 10% of Basic + DA qualifies; no fixed rupee cap in law',
      'Builds your NPS retirement corpus tax-efficiently every year',
    ],
    potentialSaving: Math.max(0, saving),
  }
}

function suggestNewRegimeSurcharge(taxableIncome) {
  if (taxableIncome <= 50_00_000) return null
  const rate = taxableIncome > 5_00_00_000 ? 37
    : taxableIncome > 2_00_00_000 ? 25
    : taxableIncome > 1_00_00_000 ? 15 : 10
  return {
    section: 'Surcharge',
    priority: 'HIGH',
    title: `Surcharge Alert: ${rate}% Applies in New Regime Too — CA Planning Needed`,
    message: `Your New Regime taxable income exceeds ₹50L, attracting ${rate}% surcharge. Very few tools are available to reduce it under New Regime.`,
    details: [
      'Employer NPS [80CCD(2)] is one of the few deductions that reduce New Regime taxable income',
      'HUF (Hindu Undivided Family) formation splits income — valid under both regimes',
      'New Regime caps surcharge at 25% for LTCG on equity — consult CA if you have investment income',
      'Consult a CA for a personalised income-restructuring strategy',
    ],
    potentialSaving: 0,
  }
}

// ── Sort suggestions HIGH → MEDIUM → INFO ────────────────────────────────────
function sortSuggestions(list) {
  const order = { HIGH: 0, MEDIUM: 1, INFO: 2 }
  return list.sort((a, b) => order[a.priority] - order[b.priority])
}

// ── Main calculation ──────────────────────────────────────────────────────────
function calculate(req) {
  const gross    = req.grossSalary    || 0
  const basic    = req.basicSalary    || 0
  const hra      = req.hraReceived    || 0
  const rent     = req.rentPaid       || 0
  const metro    = req.metro !== false
  const lta      = req.ltaReceived    || 0
  const c80C     = req.section80C     || 0
  const c80CCD1B = req.section80CCD1B || 0
  const c80CCD2  = req.section80CCD2  || 0
  const interest = req.savingsInterest || 0

  // ── Old Regime deductions ─────────────────────────────────────────────────
  const hraExemption = computeHRA(basic, hra, rent, metro)
  const ltaExemption = Math.min(lta, LTA_CAP)
  const ded80C       = Math.min(c80C, MAX_80C)
  const ded80CCD1B   = Math.min(c80CCD1B, MAX_80CCD1B)
  const ded80CCD2    = Math.min(c80CCD2, 0.10 * basic)
  const ded80TTA     = Math.min(interest, MAX_80TTA)

  const breakdown = {
    standardDeduction: STANDARD_DEDUCTION,
    '80C':    Math.round(ded80C),
    '80CCD1B':Math.round(ded80CCD1B),
    '80CCD2': Math.round(ded80CCD2),
    '80TTA':  Math.round(ded80TTA),
    HRA:      hraExemption,
    LTA:      Math.round(ltaExemption),
  }

  const totalDeductions = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const taxableIncome   = Math.max(0, Math.round(gross) - totalDeductions)
  const estimatedTax    = computeTax(taxableIncome)
  const effectiveTaxRate = effectiveRate(estimatedTax, gross)

  // ── Old Regime suggestions ────────────────────────────────────────────────
  const suggestions = sortSuggestions([
    suggest80C(req, breakdown, taxableIncome, estimatedTax),
    suggest80CCD1B(req, breakdown, taxableIncome, estimatedTax),
    suggestHRA(req, breakdown, taxableIncome, estimatedTax),
    suggest80CCD2(req, breakdown, taxableIncome, estimatedTax),
    suggest80TTA(req),
    suggestLTA(breakdown),
    suggestSurcharge(taxableIncome),
  ].filter(Boolean))

  // ── New Regime ────────────────────────────────────────────────────────────
  const newDed80CCD2 = Math.round(Math.min(c80CCD2, 0.10 * basic))
  const newBreakdown = {
    standardDeduction: NEW_STANDARD_DEDUCTION,
    '80CCD2': newDed80CCD2,
  }
  const newTotalDeductions = NEW_STANDARD_DEDUCTION + newDed80CCD2
  const newTaxableIncome   = Math.max(0, Math.round(gross) - newTotalDeductions)
  const newEstimatedTax    = computeNewRegimeTax(newTaxableIncome)
  const newEffectiveTaxRate = effectiveRate(newEstimatedTax, gross)

  const newSuggestions = sortSuggestions([
    suggestNewRegime80CCD2(req, newDed80CCD2, newTaxableIncome, newEstimatedTax),
    suggestNewRegimeSurcharge(newTaxableIncome),
  ].filter(Boolean))

  const recommendedRegime = newEstimatedTax < estimatedTax ? 'NEW' : 'OLD'

  return {
    taxableIncome,
    totalDeductions,
    estimatedTax,
    effectiveTaxRate,
    grossSalary: gross,
    breakdown,
    suggestions,
    newRegimeTaxableIncome:   newTaxableIncome,
    newRegimeTotalDeductions: newTotalDeductions,
    newRegimeEstimatedTax:    newEstimatedTax,
    newRegimeEffectiveTaxRate: newEffectiveTaxRate,
    newRegimeBreakdown:       newBreakdown,
    newRegimeSuggestions:     newSuggestions,
    recommendedRegime,
  }
}

// ── Vercel handler ────────────────────────────────────────────────────────────
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const body = req.body || {}
  if (!body.grossSalary || !body.basicSalary || body.grossSalary <= 0 || body.basicSalary <= 0) {
    return res.status(400).json({ message: 'grossSalary and basicSalary are required' })
  }

  return res.status(200).json(calculate(body))
}
