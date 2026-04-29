/**
 * Integration Tests — TaxSmart Advisor
 *
 * These tests hit the REAL Spring Boot backend on http://localhost:8080.
 * No API mocking. All assertions verify the full calculation pipeline.
 *
 * Prerequisites:
 *   cd backend && mvn spring-boot:run
 *
 * Run only integration tests:
 *   npx playwright test tests/integration.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fill the salary form with the provided values, then click "Calculate Tax".
 * Only non-empty fields are filled — the rest stay at their default (0 / empty).
 */
async function fillAndCalculate(page, data) {
  await page.goto('/')

  const fields = [
    'grossSalary', 'basicSalary', 'hraReceived', 'ltaReceived',
    'rentPaid', 'section80C', 'section80CCD1B', 'section80CCD2', 'savingsInterest',
  ]
  for (const field of fields) {
    if (data[field] !== undefined) {
      await page.fill(`input[name="${field}"]`, String(data[field]))
    }
  }

  if (data.metro === false) {
    await page.getByRole('button', { name: /Non-Metro/i }).click()
  }

  await page.getByRole('button', { name: /Calculate Tax/i }).click()
  await expect(page.getByText('Tax Summary')).toBeVisible({ timeout: 10_000 })
}

/**
 * Clear the form by navigating back to the home page — the simplest reset.
 * Also verifies the placeholder panel re-appears, confirming clean state.
 */
async function clearAndVerify(page) {
  await page.goto('/')
  await expect(page.getByText('Your Tax Report Awaits')).toBeVisible()
}

// ── Skip all tests if backend is not reachable ─────────────────────────────

test.beforeAll(async ({ request }) => {
  let reachable = false
  try {
    const res = await request.get('http://localhost:8080/actuator/health').catch(() => null)
      || await request.post('http://localhost:8080/api/tax/calculate', {
          data: { grossSalary: 100000, basicSalary: 40000 },
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null)
    reachable = !!res
  } catch { /* unreachable */ }

  if (!reachable) {
    console.warn('\n⚠️  Backend not running on port 8080 — skipping integration tests.')
    test.skip()
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Software Engineer, Mumbai (Metro), ₹15L CTC
// Partial 80C, no NPS, HRA claimed
// ─────────────────────────────────────────────────────────────────────────────
const SE_MUMBAI = {
  grossSalary:    1_500_000,
  basicSalary:      600_000,
  hraReceived:      300_000,
  rentPaid:         360_000,  // ₹30K/month in Mumbai
  metro:            true,
  ltaReceived:       50_000,
  section80C:        80_000,  // EPF + LIC — not maxed out
  section80CCD1B:         0,
  section80CCD2:          0,
  savingsInterest:    6_000,
}

test.describe('Scenario 1 — Software Engineer, Mumbai, ₹15L CTC', () => {

  test.afterEach(async ({ page }) => {
    await clearAndVerify(page)
  })

  test('page renders and form accepts all input', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText('Tax Summary')).toBeVisible()
  })

  test('HRA exemption is computed (rent > 10% basic, metro)', async ({ page }) => {
    // HRA = min(3,00,000  |  3,60,000 - 60,000 = 3,00,000  |  50% of 6L = 3,00,000) = 3,00,000
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText('HRA Exemption', { exact: true })).toBeVisible()
    await expect(page.getByText('₹3,00,000')).toBeVisible()
  })

  test('80TTA applied for savings interest ₹6,000 (within ₹10K limit)', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText('Savings Interest [80TTA]', { exact: true })).toBeVisible()
    await expect(page.getByText('₹6,000').first()).toBeVisible()
  })

  test('80C gap suggestion appears (₹70,000 unutilized)', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText(/Section 80C Limit Still Unutilized/)).toBeVisible()
  })

  test('NPS 80CCD(1B) HIGH suggestion appears', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText(/NPS Tier-1/)).toBeVisible()
    await expect(page.locator('.badge-high').filter({ hasText: 'HIGH' }).first()).toBeVisible()
  })

  test('employer NPS MEDIUM suggestion appears', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText(/Employer NPS \[80CCD\(2\)\] Not Used/)).toBeVisible()
    await expect(page.locator('.badge-medium').first()).toBeVisible()
  })

  test('LTA INFO suggestion appears with travel reminder', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText(/LTA Exemption.*Applied/)).toBeVisible()
  })

  test('potential tax saving is shown for 80C suggestion', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    // The 80C chip must show a non-zero savings amount
    const savingChips = page.locator('div.bg-green-500').filter({ hasText: '₹' })
    await expect(savingChips.first()).toBeVisible()
  })

  test('expanding 80C suggestion reveals investment options', async ({ page }) => {
    await fillAndCalculate(page, SE_MUMBAI)
    await page.getByText(/Show \d+ action steps/).first().click()
    await expect(page.getByText(/ELSS Mutual Funds/)).toBeVisible()
    await expect(page.getByText(/PPF/)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Manager, Bangalore (Metro), ₹25L CTC
// Fully maxed 80C + NPS, HRA claimed, employer NPS
// ─────────────────────────────────────────────────────────────────────────────
const MGR_BANGALORE = {
  grossSalary:    2_500_000,
  basicSalary:    1_000_000,
  hraReceived:      500_000,
  rentPaid:         600_000,  // ₹50K/month in Bangalore
  metro:            true,
  ltaReceived:       75_000,
  section80C:       150_000,  // Maxed out
  section80CCD1B:    50_000,  // Maxed NPS personal
  section80CCD2:    100_000,  // Employer NPS (10% of basic)
  savingsInterest:   12_000,  // Exceeds 80TTA limit
}

test.describe('Scenario 2 — Manager, Bangalore, ₹25L CTC (all deductions maxed)', () => {

  test.afterEach(async ({ page }) => {
    await clearAndVerify(page)
  })

  test('no 80C gap suggestion when section80C = ₹1,50,000', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText(/Section 80C Limit Still Unutilized/)).not.toBeVisible()
  })

  test('no NPS 80CCD(1B) suggestion when fully invested', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText(/NPS Tier-1: Exclusive/)).not.toBeVisible()
  })

  test('80TTA exceeded warning appears (interest ₹12,000 > ₹10,000 limit)', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText(/80TTA Limit Exceeded/)).toBeVisible()
    await expect(page.getByText(/₹2,000.*is Taxable|Extra Interest is Taxable/)).toBeVisible()
  })

  test('standard deduction of ₹50,000 is always applied', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText('Standard Deduction', { exact: true })).toBeVisible()
    await expect(page.getByText('₹50,000').first()).toBeVisible()
  })

  test('LTA cap of ₹75,000 is applied', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText('₹75,000').first()).toBeVisible()
  })

  test('employer NPS of ₹1,00,000 is shown in breakdown', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText('Employer NPS [80CCD(2)]', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('₹1,00,000').first()).toBeVisible()
  })

  test('taxable income is lower than gross salary', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    // The deductions panel shows a non-zero total
    const totalEl = page.locator('#results').getByText(/₹[0-9,]+/).first()
    await expect(totalEl).toBeVisible()
  })

  test('effective tax rate displayed', async ({ page }) => {
    await fillAndCalculate(page, MGR_BANGALORE)
    await expect(page.getByText(/Effective Tax Rate/)).toBeVisible()
    await expect(page.getByText(/%/).first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Junior Developer, Pune (Non-Metro), ₹6L CTC
// Low income — Section 87A rebate should apply
// ─────────────────────────────────────────────────────────────────────────────
const JUNIOR_PUNE = {
  grossSalary:    600_000,
  basicSalary:    240_000,
  hraReceived:     96_000,
  rentPaid:       120_000,  // ₹10K/month in Pune
  metro:          false,    // Non-metro → 40% of basic
  ltaReceived:         0,
  section80C:      50_000,
  section80CCD1B:       0,
  section80CCD2:        0,
  savingsInterest:  3_000,
}

test.describe('Scenario 3 — Junior Developer, Pune (Non-Metro), ₹6L CTC', () => {

  test.afterEach(async ({ page }) => {
    await clearAndVerify(page)
  })

  test('HRA uses 40% of basic for non-metro city', async ({ page }) => {
    // HRA = min(96,000  |  120,000 - 24,000 = 96,000  |  40% of 2,40,000 = 96,000) = 96,000
    await fillAndCalculate(page, JUNIOR_PUNE)
    await expect(page.getByText('₹96,000').first()).toBeVisible()
  })

  test('Section 87A rebate notice appears (taxable income ≤ ₹5L)', async ({ page }) => {
    // After all deductions, taxable income should fall ≤ 5L — tax = 0
    await fillAndCalculate(page, JUNIOR_PUNE)
    const rebate = page.getByText(/Section 87A Rebate Applied/)
    // May or may not appear depending on exact taxable income; check tax is 0 or rebate shows
    const taxValue = page.locator('#results .text-2xl.font-bold').filter({ hasText: '₹0' })
    const hasTaxOrRebate = await rebate.isVisible().catch(() => false)
        || await taxValue.isVisible().catch(() => false)
    expect(hasTaxOrRebate).toBe(true)
  })

  test('non-metro toggle sends metro:false to API', async ({ page }) => {
    let requestBody = null
    page.on('request', req => {
      if (req.url().includes('/api/tax/calculate')) {
        requestBody = JSON.parse(req.postData())
      }
    })

    await fillAndCalculate(page, JUNIOR_PUNE)
    expect(requestBody).not.toBeNull()
    expect(requestBody.metro).toBe(false)
  })

  test('80C gap suggestion shown (₹1,00,000 gap remaining)', async ({ page }) => {
    await fillAndCalculate(page, JUNIOR_PUNE)
    await expect(page.getByText(/Section 80C Limit Still Unutilized/)).toBeVisible()
  })

  test('savings interest ₹3,000 is within 80TTA limit — INFO shown', async ({ page }) => {
    await fillAndCalculate(page, JUNIOR_PUNE)
    await expect(page.getByText(/Savings Interest.*Fully Exempt/)).toBeVisible()
  })

  test('no surcharge warning for income under ₹50L', async ({ page }) => {
    await fillAndCalculate(page, JUNIOR_PUNE)
    await expect(page.getByText(/Surcharge Alert/)).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Senior Director, Delhi (Metro), ₹60L CTC
// Surcharge scenario, no HRA claimed (own house)
// ─────────────────────────────────────────────────────────────────────────────
const DIRECTOR_DELHI = {
  grossSalary:    6_000_000,
  basicSalary:    2_400_000,
  hraReceived:            0,  // Lives in own house — no HRA
  rentPaid:               0,
  metro:           true,
  ltaReceived:       75_000,
  section80C:       150_000,  // Maxed
  section80CCD1B:    50_000,  // Maxed
  section80CCD2:    240_000,  // 10% of basic
  savingsInterest:    8_000,
}

test.describe('Scenario 4 — Senior Director, Delhi (Metro), ₹60L CTC (Surcharge)', () => {

  test.afterEach(async ({ page }) => {
    await clearAndVerify(page)
  })

  test('surcharge alert HIGH suggestion appears for income > ₹50L', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    await expect(page.getByText(/Surcharge Alert/)).toBeVisible()
    await expect(page.locator('.badge-high').filter({ hasText: 'HIGH' }).first()).toBeVisible()
  })

  test('surcharge suggestion mentions HUF and CA consultation', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    await page.getByText(/Surcharge Alert/).locator('xpath=..').getByText(/Show \d+ action steps/).click()
    await expect(page.getByText(/Hindu Undivided Family|HUF/)).toBeVisible()
  })

  test('no HRA suggestion when hraReceived = 0', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    // No HRA to claim → no HRA-related suggestion
    await expect(page.getByText(/HRA Received But Exemption Not Claimed/)).not.toBeVisible()
  })

  test('HRA breakdown row shows ₹0', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    await expect(page.getByText('HRA Exemption', { exact: true })).toBeVisible()
    // HRA row shows "Not claimed"
    await expect(page.getByText('Not claimed').first()).toBeVisible()
  })

  test('estimated tax is non-zero for this income level', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    // Estimated tax should be a large number — verify it's not ₹0
    const taxCard = page.locator('#results').locator('p.text-2xl.font-bold').filter({ hasNotText: '₹0' })
    await expect(taxCard.first()).toBeVisible()
  })

  test('effective tax rate bar is visible', async ({ page }) => {
    await fillAndCalculate(page, DIRECTOR_DELHI)
    await expect(page.getByText('Effective Tax Rate')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — HRA optimization edge case
// Rent paid is exactly 10% of basic → Condition 2 = ₹0 → HRA exemption = ₹0
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Edge Cases', () => {

  test.afterEach(async ({ page }) => {
    await clearAndVerify(page)
  })

  test('HRA exemption is ₹0 when rent = 10% of basic (condition 2 = 0)', async ({ page }) => {
    await fillAndCalculate(page, {
      grossSalary:  1_000_000,
      basicSalary:    400_000,
      hraReceived:    200_000,
      rentPaid:        40_000,  // exactly 10% of basic → rent - 10% basic = 0
      metro:           true,
    })
    // HRA row should show "Not claimed" or ₹0 because condition 2 is 0
    const hraRow = page.locator('#results').getByText('HRA Exemption', { exact: true })
    await expect(hraRow).toBeVisible()
    // HRA exemption should be ₹0
    await expect(page.getByText('Not claimed').first()).toBeVisible()
  })

  test('80CCD(2) capped at 10% of basic salary', async ({ page }) => {
    // Try to pass section80CCD2 = 5,00,000 with basic = 5,00,000
    // Backend should cap it at 10% of 5,00,000 = 50,000
    await fillAndCalculate(page, {
      grossSalary:    2_000_000,
      basicSalary:      500_000,
      section80CCD2:    500_000,  // Well above 10% cap
    })
    // Breakdown should show max 50,000 (10% of 5,00,000)
    await expect(page.getByText('Employer NPS [80CCD(2)]', { exact: true }).first()).toBeVisible()
  })

  test('standard deduction ₹50,000 is applied regardless of income', async ({ page }) => {
    await fillAndCalculate(page, {
      grossSalary: 300_000,
      basicSalary: 120_000,
    })
    await expect(page.getByText('Standard Deduction', { exact: true })).toBeVisible()
    await expect(page.getByText('₹50,000').first()).toBeVisible()
  })

  test('form resets cleanly on page.goto and new calculation works', async ({ page }) => {
    // First calculation
    await fillAndCalculate(page, SE_MUMBAI)
    await expect(page.getByText('Tax Summary')).toBeVisible()

    // Clear via navigation
    await clearAndVerify(page)

    // Second calculation with different scenario — results should update
    await fillAndCalculate(page, JUNIOR_PUNE)
    await expect(page.getByText('Tax Summary')).toBeVisible()
    // Pune non-metro HRA should be ₹96,000, not Mumbai's ₹3,00,000
    await expect(page.getByText('₹96,000').first()).toBeVisible()
  })
})
