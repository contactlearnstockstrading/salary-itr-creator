import { test, expect } from '@playwright/test'
import {
  mockCalculateApi,
  fillForm,
  MOCK_RESPONSE,
  MOCK_RESPONSE_87A,
  MOCK_RESPONSE_OPTIMIZED,
} from './fixtures.js'

// ── Helper: navigate + fill + submit in one go ────────────────────────────────
async function calculateAndWait(page, mockResponse = MOCK_RESPONSE, formOverrides = {}) {
  await page.goto('/')
  await mockCalculateApi(page, mockResponse)
  await fillForm(page, formOverrides)
  await page.getByRole('button', { name: /Calculate Tax/i }).click()
  await expect(page.getByText('Tax Summary')).toBeVisible()
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Tax Summary Panel', () => {

  test('displays all four metric cards', async ({ page }) => {
    await calculateAndWait(page)
    // Use exact:true to avoid substring-matching similar text in other parts of the page
    await expect(page.getByText('Gross Income', { exact: true })).toBeVisible()
    await expect(page.getByText('Total Deductions', { exact: true })).toBeVisible()
    await expect(page.getByText('Taxable Income', { exact: true })).toBeVisible()
    await expect(page.getByText('Estimated Tax', { exact: true })).toBeVisible()
  })

  test('shows correct rupee values from API response', async ({ page }) => {
    await calculateAndWait(page)
    // Values appear in multiple places (summary cards + breakdown) — use .first()
    await expect(page.getByText('₹12,00,000').first()).toBeVisible()  // Gross
    await expect(page.getByText('₹2,90,000').first()).toBeVisible()   // Deductions
    await expect(page.getByText('₹9,10,000').first()).toBeVisible()   // Taxable
    await expect(page.getByText('₹1,03,000').first()).toBeVisible()   // Tax
  })

  test('shows effective tax rate as percentage', async ({ page }) => {
    await calculateAndWait(page)
    // The rate bar renders an exact <span>8.58%</span>; use exact:true to avoid the sub-text "8.58% effective rate"
    await expect(page.getByText('8.58%', { exact: true })).toBeVisible()
  })

  test('shows Section 87A rebate notice when tax is zero', async ({ page }) => {
    await calculateAndWait(page, MOCK_RESPONSE_87A)
    await expect(page.getByText(/Section 87A Rebate Applied/)).toBeVisible()
    await expect(page.getByText(/tax payable = ₹0/)).toBeVisible()
  })

  test('does NOT show 87A notice for taxable income above 5L', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/Section 87A Rebate Applied/)).not.toBeVisible()
  })

  test('tax rate progress bar is visible', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('Effective Tax Rate')).toBeVisible()
    await expect(page.getByText('0% — optimal')).toBeVisible()
    await expect(page.getByText('30% — max slab')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Deduction Breakdown Panel', () => {

  test('shows deduction breakdown section', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('Deduction Breakdown')).toBeVisible()
  })

  test('shows all deduction labels', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('Standard Deduction', { exact: true })).toBeVisible()
    await expect(page.getByText('Section 80C', { exact: true })).toBeVisible()
    await expect(page.getByText('NPS Personal [80CCD(1B)]', { exact: true })).toBeVisible()
    await expect(page.locator('#results').getByText('Employer NPS [80CCD(2)]', { exact: true })).toBeVisible()
    await expect(page.getByText('Savings Interest [80TTA]', { exact: true })).toBeVisible()
    await expect(page.getByText('HRA Exemption', { exact: true })).toBeVisible()
    await expect(page.getByText('LTA Exemption', { exact: true })).toBeVisible()
  })

  test('shows standard deduction value of ₹50,000', async ({ page }) => {
    await calculateAndWait(page)
    // Standard deduction row — always ₹50,000
    await expect(page.getByText('₹50,000').first()).toBeVisible()
  })

  test('shows max-limit helper text on capped deductions', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/max ₹1,50,000/).first()).toBeVisible()  // 80C
    await expect(page.getByText(/max ₹50,000/).first()).toBeVisible()    // 80CCD1B
  })

  test('shows "Not claimed" for zero-value deductions', async ({ page }) => {
    await calculateAndWait(page)
    // 80CCD1B, 80CCD2, 80TTA, LTA are all 0 in MOCK_RESPONSE
    const notClaimed = page.getByText('Not claimed')
    await expect(notClaimed.first()).toBeVisible()
  })

  test('shows total deduction amount in header', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('₹2,90,000').first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Fully Optimized State', () => {

  test('shows congratulations message when no suggestions', async ({ page }) => {
    await calculateAndWait(page, MOCK_RESPONSE_OPTIMIZED)
    await expect(page.getByText(/Excellent! All Deductions Optimized/)).toBeVisible()
    await expect(page.getByText(/No further tax-saving opportunities found/)).toBeVisible()
  })

  test('does NOT show suggestions section with empty suggestions', async ({ page }) => {
    await calculateAndWait(page, MOCK_RESPONSE_OPTIMIZED)
    await expect(page.getByText('CA-Style Tax Saving Suggestions')).not.toBeVisible()
  })
})
