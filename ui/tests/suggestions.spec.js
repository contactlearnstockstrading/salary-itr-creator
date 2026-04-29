import { test, expect } from '@playwright/test'
import { mockCalculateApi, fillForm, MOCK_RESPONSE } from './fixtures.js'

async function calculateAndWait(page) {
  await page.goto('/')
  await mockCalculateApi(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Calculate Tax/i }).click()
  await expect(page.getByText('CA-Style Tax Saving Suggestions')).toBeVisible()
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Suggestions Panel', () => {

  test('shows suggestions heading', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('CA-Style Tax Saving Suggestions')).toBeVisible()
  })

  test('shows urgent count badge for HIGH priority items', async ({ page }) => {
    await calculateAndWait(page)
    // 2 HIGH priority suggestions in MOCK_RESPONSE
    await expect(page.getByText('2 urgent')).toBeVisible()
  })

  test('shows total potential savings banner', async ({ page }) => {
    await calculateAndWait(page)
    // 20600 + 15450 + 9270 = 45320
    await expect(page.getByText(/Potential Annual Tax Savings/)).toBeVisible()
    await expect(page.getByText('₹45,320')).toBeVisible()
  })

  test('shows "Act on HIGH priority items first" advice', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/Act on HIGH priority items first/)).toBeVisible()
  })

  // ── Priority badges ────────────────────────────────────────────────────────

  test('HIGH priority suggestions have red badge', async ({ page }) => {
    await calculateAndWait(page)
    // Scope to suggestion cards — the header also uses .badge-high for the "2 urgent" count
    const badge = page.locator('.badge-high').filter({ hasText: 'HIGH' }).first()
    await expect(badge).toBeVisible()
  })

  test('MEDIUM priority suggestions have amber badge', async ({ page }) => {
    await calculateAndWait(page)
    const badge = page.locator('.badge-medium').first()
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('MEDIUM')
  })

  test('suggestions are sorted HIGH before MEDIUM', async ({ page }) => {
    await calculateAndWait(page)
    const badges = page.locator('.badge-high, .badge-medium').all()
    const list = await badges
    // Get text of each badge in DOM order
    const texts = await Promise.all((await page.locator('.badge-high, .badge-medium').all()).map(b => b.textContent()))
    // All HIGH badges should appear before MEDIUM
    const firstMedium = texts.indexOf('MEDIUM')
    const lastHigh    = texts.lastIndexOf('HIGH')
    expect(lastHigh).toBeLessThan(firstMedium === -1 ? Infinity : firstMedium)
  })

  // ── Section tags ───────────────────────────────────────────────────────────

  test('shows section tags for each suggestion', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('80C').first()).toBeVisible()
    // exact:true avoids matching form labels and body text that also contain "80CCD(1B)"
    await expect(page.getByText('80CCD(1B)', { exact: true })).toBeVisible()
    await expect(page.getByText('80CCD(2)', { exact: true })).toBeVisible()
    await expect(page.getByText('HRA', { exact: true }).first()).toBeVisible()
  })

  // ── Titles & messages ──────────────────────────────────────────────────────

  test('shows 80C suggestion title', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/Section 80C Limit Still Unutilized/)).toBeVisible()
  })

  test('shows NPS 80CCD(1B) suggestion title', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/NPS Tier-1: Exclusive/)).toBeVisible()
  })

  test('shows employer NPS MEDIUM suggestion', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/Employer NPS \[80CCD\(2\)\] Not Used/)).toBeVisible()
  })

  // ── Potential savings chip ─────────────────────────────────────────────────

  test('shows "Save up to" chip for suggestions with potentialSaving > 0', async ({ page }) => {
    await calculateAndWait(page)
    const chips = page.getByText('Save up to')
    await expect(chips.first()).toBeVisible()
  })

  test('shows correct saving amount on 80C suggestion chip', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('₹20,600')).toBeVisible()
  })

  test('shows correct saving on NPS suggestion chip', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('₹15,450')).toBeVisible()
  })

  test('does NOT show saving chip for INFO suggestions with potentialSaving=0', async ({ page }) => {
    await calculateAndWait(page)
    // 3 of 4 mock suggestions have potentialSaving > 0 — verify each saving amount is shown
    await expect(page.getByText('₹20,600')).toBeVisible()
    await expect(page.getByText('₹15,450')).toBeVisible()
    await expect(page.getByText('₹9,270')).toBeVisible()
    // The HRA INFO suggestion (potentialSaving=0) should NOT render a chip
    // Confirmed by verifying no chip with ₹0 appears inside a green savings chip
    await expect(page.locator('div.bg-green-500').filter({ hasText: '₹0' })).toHaveCount(0)
  })

  // ── Expandable action steps ────────────────────────────────────────────────

  test('action steps are hidden by default', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText('ELSS Mutual Funds')).not.toBeVisible()
  })

  test('clicking "Show action steps" expands the details', async ({ page }) => {
    await calculateAndWait(page)
    const showBtn = page.getByText(/Show \d+ action steps/).first()
    await showBtn.click()
    await expect(page.getByText('ELSS Mutual Funds')).toBeVisible()
  })

  test('action step bullets are numbered', async ({ page }) => {
    await calculateAndWait(page)
    await page.getByText(/Show \d+ action steps/).first().click()
    // Number badges 1, 2, 3 should be visible
    await expect(page.getByText('1').first()).toBeVisible()
    await expect(page.getByText('2').first()).toBeVisible()
  })

  test('clicking "Hide action steps" collapses the details', async ({ page }) => {
    await calculateAndWait(page)
    const showBtn = page.getByText(/Show \d+ action steps/).first()
    await showBtn.click()
    await expect(page.getByText('ELSS Mutual Funds')).toBeVisible()

    const hideBtn = page.getByText('Hide action steps').first()
    await hideBtn.click()
    await expect(page.getByText('ELSS Mutual Funds')).not.toBeVisible()
  })

  test('expanding one card does not expand others', async ({ page }) => {
    await calculateAndWait(page)
    // Expand first card (80C)
    await page.getByText(/Show \d+ action steps/).first().click()
    await expect(page.getByText('ELSS Mutual Funds')).toBeVisible()

    // Second card (NPS) details should NOT be visible yet
    await expect(page.getByText('enps.nsdl.com')).not.toBeVisible()
  })

  test('multiple cards can be expanded simultaneously', async ({ page }) => {
    await calculateAndWait(page)
    // Click first "Show" button, then click what is now the new first "Show" button
    await page.getByText(/Show \d+ action steps/).first().click()
    await page.getByText(/Show \d+ action steps/).first().click()

    await expect(page.getByText('ELSS Mutual Funds')).toBeVisible()
    await expect(page.getByText('enps.nsdl.com')).toBeVisible()
  })

  // ── Disclaimer ────────────────────────────────────────────────────────────

  test('shows disclaimer at bottom of suggestions', async ({ page }) => {
    await calculateAndWait(page)
    await expect(page.getByText(/Consult a CA for personalised advice/)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Recalculation', () => {

  test('results update when form is resubmitted with different data', async ({ page }) => {
    await page.goto('/')

    // First calculation
    await mockCalculateApi(page, MOCK_RESPONSE)
    await fillForm(page)
    await page.getByRole('button', { name: /Calculate Tax/i }).click()
    await expect(page.getByText('₹1,03,000')).toBeVisible()

    // Second calculation with low-income mock
    await mockCalculateApi(page, { ...MOCK_RESPONSE, estimatedTax: 0, effectiveTaxRate: 0 })
    await page.fill('input[name="grossSalary"]', '500000')
    await page.getByRole('button', { name: /Calculate Tax/i }).click()

    await expect(page.getByText('₹0').first()).toBeVisible()
  })
})
