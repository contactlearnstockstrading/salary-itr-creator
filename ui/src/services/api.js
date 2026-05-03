const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function signup({ name, email, password }) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Signup failed')
  return data
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Login failed')
  return data
}

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
