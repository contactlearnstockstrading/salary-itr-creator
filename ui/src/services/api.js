const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * POST /api/tax/calculate
 * Sends salary details to the Spring Boot backend and returns tax calculation result.
 */
export async function calculateTax(formData) {
  let response
  try {
    response = await fetch(`${API_BASE}/tax/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
  } catch {
    throw new Error('Failed to calculate. Is the backend running on port 8080?')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Server error: ${response.status}`)
  }

  return response.json()
}
