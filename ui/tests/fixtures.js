/**
 * Shared test fixtures and helpers for TaxSmart Playwright tests.
 */

// ── Realistic mock API response ───────────────────────────────────────────────
// Scenario: Gross 12L, Basic 5L, HRA 2.4L, Rent 3L (metro), 80C 50K
export const MOCK_RESPONSE = {
  grossSalary:     1_200_000,
  taxableIncome:     910_000,
  totalDeductions:   290_000,
  estimatedTax:      103_000,
  effectiveTaxRate:     8.58,
  breakdown: {
    standardDeduction: 50_000,
    '80C':             50_000,
    '80CCD1B':              0,
    '80CCD2':               0,
    '80TTA':                0,
    HRA:              190_000,
    LTA:                    0,
  },
  // New Regime: standard ₹75K only (80CCD2 not used) → taxable 11.25L → tax ₹71,500
  newRegimeTaxableIncome:   1_125_000,
  newRegimeTotalDeductions:    75_000,
  newRegimeEstimatedTax:       71_500,
  newRegimeEffectiveTaxRate:     5.96,
  newRegimeBreakdown: {
    standardDeduction: 75_000,
    '80CCD2':               0,
  },
  newRegimeSuggestions: [
    {
      section:       '80CCD(2)',
      priority:      'HIGH',
      title:         'Employer NPS [80CCD(2)] Works in New Regime — Rs.50,000 Tax-Free',
      message:       '80CCD(2) Employer NPS is one of the few deductions allowed under the New Regime.',
      details:       ['Request HR to restructure your CTC'],
      potentialSaving: 5_150,
    },
  ],
  recommendedRegime: 'NEW',
  suggestions: [
    {
      section:       '80C',
      priority:      'HIGH',
      title:         'Rs.1.0 L of Section 80C Limit Still Unutilized',
      message:       'You can invest Rs.1.0 L more to claim the full Rs.1.5 L deduction under Section 80C and save up to Rs.20,600 in tax.',
      details: [
        'ELSS Mutual Funds – 3-year lock-in, historically 12–15% p.a. returns (best for wealth creation + tax saving)',
        'PPF (Public Provident Fund) – 7.1% tax-free returns, govt-backed, 15-year tenure with partial withdrawal',
        'Life Insurance Premium (term plan / LIC / endowment policy) – protect family AND save tax',
        '5-Year Tax-Saving Fixed Deposit – guaranteed returns, zero market risk',
        'NSC (National Savings Certificate) – 7.7% p.a., issued by India Post, 5-year maturity',
      ],
      potentialSaving: 20_600,
    },
    {
      section:       '80CCD(1B)',
      priority:      'HIGH',
      title:         'NPS Tier-1: Exclusive Rs.50,000 Extra Deduction Available',
      message:       'Section 80CCD(1B) grants an ADDITIONAL Rs.50,000 deduction OVER AND ABOVE your Rs.1.5 L 80C limit.',
      details: [
        'NPS Tier-1 is a government-regulated pension account – very safe and transparent',
        'Choose your allocation: Equity (E) up to 75%, Corporate Bonds (C), Govt Securities (G)',
        'Open NPS online at enps.nsdl.com or through your bank',
      ],
      potentialSaving: 15_450,
    },
    {
      section:       '80CCD(2)',
      priority:      'MEDIUM',
      title:         'Employer NPS [80CCD(2)] Not Used — Free Tax Saving via CTC Restructuring',
      message:       'Employer NPS contribution is FULLY TAX-FREE with no monetary cap.',
      details: [
        'Request HR to restructure your CTC: reduce a taxable component, add Employer NPS contribution',
        'Available under BOTH Old and New Tax Regime — universally beneficial',
      ],
      potentialSaving: 9_270,
    },
    {
      section:       'HRA',
      priority:      'INFO',
      title:         'HRA Exemption Limited by Condition 2 (Rent − 10% of basic)',
      message:       'Your HRA exemption is Rs.1.9 L out of Rs.2.4 L received.',
      details: [
        'Condition 1 – Actual HRA received: Rs.2.4 L',
        'Condition 2 – Rent paid − 10% of basic: Rs.2.5 L',
        'Condition 3 – 50% of basic salary: Rs.2.5 L',
      ],
      potentialSaving: 0,
    },
  ],
}

// Scenario: low income — 87A rebate applies (both regimes)
export const MOCK_RESPONSE_87A = {
  ...MOCK_RESPONSE,
  grossSalary:    500_000,
  taxableIncome:  300_000,
  totalDeductions:200_000,
  estimatedTax:         0,
  effectiveTaxRate:     0,
  // New Regime: 5L - 75K = 4.25L taxable → ≤7L → 87A → tax 0
  newRegimeTaxableIncome:   425_000,
  newRegimeTotalDeductions:  75_000,
  newRegimeEstimatedTax:          0,
  newRegimeEffectiveTaxRate:      0,
  newRegimeBreakdown: { standardDeduction: 75_000, '80CCD2': 0 },
  newRegimeSuggestions: [],
  recommendedRegime: 'OLD',
}

// Scenario: all deductions maxed — no HIGH suggestions
export const MOCK_RESPONSE_OPTIMIZED = {
  grossSalary:    1_200_000,
  taxableIncome:    700_000,
  totalDeductions:  500_000,
  estimatedTax:      62_400,
  effectiveTaxRate:    5.2,
  breakdown: {
    standardDeduction: 50_000,
    '80C':            150_000,
    '80CCD1B':         50_000,
    '80CCD2':          48_000,
    '80TTA':           10_000,
    HRA:              192_000,
    LTA:                    0,
  },
  suggestions: [],
  // New Regime: standard ₹75K + 80CCD2 ₹48K = ₹1.23L → taxable 10.77L → tax ₹64,012
  newRegimeTaxableIncome:   1_077_000,
  newRegimeTotalDeductions:   123_000,
  newRegimeEstimatedTax:       64_012,
  newRegimeEffectiveTaxRate:     5.33,
  newRegimeBreakdown: { standardDeduction: 75_000, '80CCD2': 48_000 },
  newRegimeSuggestions: [],
  recommendedRegime: 'OLD',
}

// ── Helper: mock the /api/tax/calculate endpoint ──────────────────────────────
export async function mockCalculateApi(page, response = MOCK_RESPONSE) {
  await page.route('**/api/tax/calculate', async (route) => {
    await route.fulfill({
      status:  200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

// ── Helper: fill in the form with standard test values ────────────────────────
export async function fillForm(page, overrides = {}) {
  const values = {
    grossSalary:     '1200000',
    basicSalary:     '500000',
    hraReceived:     '240000',
    ltaReceived:     '',
    rentPaid:        '300000',
    section80C:      '50000',
    section80CCD1B:  '',
    section80CCD2:   '',
    savingsInterest: '',
    ...overrides,
  }

  for (const [name, value] of Object.entries(values)) {
    if (value !== '') {
      await page.fill(`input[name="${name}"]`, value)
    }
  }
}
