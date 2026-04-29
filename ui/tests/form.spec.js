import { test, expect } from '@playwright/test'
import { mockCalculateApi, fillForm, MOCK_RESPONSE } from './fixtures.js'

test.describe('Input Form', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // ── Page load ──────────────────────────────────────────────────────────────

  test('shows header with branding', async ({ page }) => {
    await expect(page.getByText('TaxSmart Advisor')).toBeVisible()
    // Scope to header to avoid matching the footer disclaimer
    await expect(page.locator('header').getByText(/Old Regime/)).toBeVisible()
    await expect(page.locator('header').getByText(/FY 2024-25/)).toBeVisible()
  })

  test('shows placeholder results panel before calculation', async ({ page }) => {
    await expect(page.getByText('Your Tax Report Awaits')).toBeVisible()
    await expect(page.getByText(/Fill in your salary details/)).toBeVisible()
  })

  test('shows all four form sections', async ({ page }) => {
    await expect(page.getByText('Salary Structure')).toBeVisible()
    await expect(page.getByText('Housing & Rent')).toBeVisible()
    await expect(page.getByText('Investments & Deductions')).toBeVisible()
    await expect(page.getByText('Other Income')).toBeVisible()
  })

  // ── Field presence ─────────────────────────────────────────────────────────

  test('salary section has all required fields', async ({ page }) => {
    await expect(page.locator('input[name="grossSalary"]')).toBeVisible()
    await expect(page.locator('input[name="basicSalary"]')).toBeVisible()
    await expect(page.locator('input[name="hraReceived"]')).toBeVisible()
    await expect(page.locator('input[name="ltaReceived"]')).toBeVisible()
  })

  test('housing section has rent field and city toggle', async ({ page }) => {
    await expect(page.locator('input[name="rentPaid"]')).toBeVisible()
    await expect(page.getByText('Metro City')).toBeVisible()
    await expect(page.getByText('Non-Metro')).toBeVisible()
  })

  test('investments section has all three NPS/80C fields', async ({ page }) => {
    await expect(page.locator('input[name="section80C"]')).toBeVisible()
    await expect(page.locator('input[name="section80CCD1B"]')).toBeVisible()
    await expect(page.locator('input[name="section80CCD2"]')).toBeVisible()
  })

  test('other income section has savings interest field', async ({ page }) => {
    await expect(page.locator('input[name="savingsInterest"]')).toBeVisible()
  })

  // ── Validation / submit button ─────────────────────────────────────────────

  test('submit button is disabled with empty form', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Calculate Tax/i })
    await expect(btn).toBeDisabled()
  })

  test('submit button stays disabled with only grossSalary filled', async ({ page }) => {
    await page.fill('input[name="grossSalary"]', '1200000')
    const btn = page.getByRole('button', { name: /Calculate Tax/i })
    await expect(btn).toBeDisabled()
  })

  test('submit button becomes enabled when grossSalary + basicSalary are filled', async ({ page }) => {
    await page.fill('input[name="grossSalary"]', '1200000')
    await page.fill('input[name="basicSalary"]', '500000')
    const btn = page.getByRole('button', { name: /Calculate Tax/i })
    await expect(btn).toBeEnabled()
  })

  // ── City type toggle ───────────────────────────────────────────────────────

  test('Metro City is selected by default', async ({ page }) => {
    const metroBtn = page.getByRole('button', { name: /Metro City/i })
    await expect(metroBtn).toHaveClass(/border-blue-500/)
  })

  test('clicking Non-Metro deselects Metro', async ({ page }) => {
    const metroBtn    = page.getByRole('button', { name: /Metro City/i })
    const nonMetroBtn = page.getByRole('button', { name: /Non-Metro/i })

    await nonMetroBtn.click()
    await expect(nonMetroBtn).toHaveClass(/border-blue-500/)
    await expect(metroBtn).not.toHaveClass(/border-blue-500/)
  })

  test('clicking Metro re-selects it after switching to Non-Metro', async ({ page }) => {
    const metroBtn    = page.getByRole('button', { name: /Metro City/i })
    const nonMetroBtn = page.getByRole('button', { name: /Non-Metro/i })

    await nonMetroBtn.click()
    await metroBtn.click()
    await expect(metroBtn).toHaveClass(/border-blue-500/)
  })

  // ── Helper text ────────────────────────────────────────────────────────────

  test('shows helper text for key fields', async ({ page }) => {
    await expect(page.getByText(/Total annual income — all components/)).toBeVisible()
    await expect(page.getByText(/Typically 40–50% of CTC/)).toBeVisible()
    await expect(page.getByText(/Metro cities: Delhi, Mumbai, Kolkata, Chennai/)).toBeVisible()
    await expect(page.getByText(/exempt up to ₹10,000 under 80TTA/)).toBeVisible()
  })

  // ── Form submission triggers API call ─────────────────────────────────────

  test('submitting form sends correct JSON to the API', async ({ page }) => {
    await mockCalculateApi(page)

    let requestBody = null
    page.on('request', req => {
      if (req.url().includes('/api/tax/calculate')) {
        requestBody = JSON.parse(req.postData())
      }
    })

    await fillForm(page)

    // Set up waitForResponse BEFORE click so the promise is ready when the response arrives
    const responsePromise = page.waitForResponse('**/api/tax/calculate')
    await page.getByRole('button', { name: /Calculate Tax/i }).click()
    await responsePromise

    expect(requestBody).toMatchObject({
      grossSalary:  1_200_000,
      basicSalary:    500_000,
      hraReceived:    240_000,
      rentPaid:       300_000,
      metro:          true,
      section80C:      50_000,
    })
    // Optional fields default to 0
    expect(requestBody.section80CCD1B).toBe(0)
    expect(requestBody.section80CCD2).toBe(0)
    expect(requestBody.savingsInterest).toBe(0)
  })

  test('sends metro:false when Non-Metro is selected', async ({ page }) => {
    await mockCalculateApi(page)

    let requestBody = null
    page.on('request', req => {
      if (req.url().includes('/api/tax/calculate')) {
        requestBody = JSON.parse(req.postData())
      }
    })

    await fillForm(page)
    await page.getByRole('button', { name: /Non-Metro/i }).click()
    const responsePromise = page.waitForResponse('**/api/tax/calculate')
    await page.getByRole('button', { name: /Calculate Tax/i }).click()
    await responsePromise

    expect(requestBody.metro).toBe(false)
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  test('shows loading spinner while API call is in flight', async ({ page }) => {
    // Delay the response so we can assert loading state
    await page.route('**/api/tax/calculate', async (route) => {
      await page.waitForTimeout(200)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESPONSE),
      })
    })

    await fillForm(page)
    await page.getByRole('button', { name: /Calculate Tax/i }).click()

    // Spinner should appear while loading
    await expect(page.locator('.animate-spin')).toBeVisible()
    // Results appear after load completes
    await expect(page.getByText('Tax Summary')).toBeVisible({ timeout: 5000 })
  })

  // ── Error state ────────────────────────────────────────────────────────────

  test('shows error message when API returns 500', async ({ page }) => {
    await page.route('**/api/tax/calculate', route =>
      route.fulfill({ status: 500, body: '{"message":"Internal server error"}' })
    )

    await fillForm(page)
    await page.getByRole('button', { name: /Calculate Tax/i }).click()

    // api.js uses err.message from the JSON body when available
    await expect(page.getByText('Internal server error')).toBeVisible()
  })

  test('shows error message when network fails', async ({ page }) => {
    await page.route('**/api/tax/calculate', route => route.abort())

    await fillForm(page)
    await page.getByRole('button', { name: /Calculate Tax/i }).click()

    // api.js wraps network errors with this message
    await expect(page.getByText(/Failed to calculate\. Is the backend running/)).toBeVisible()
  })
})
