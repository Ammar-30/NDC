const BASE = 'http://localhost:3000/api'
const TOKEN_KEY = 'laundry_token'
const REQUEST_TIMEOUT_MS = 15000

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value))
    }
  })
  const query = qs.toString()
  return query ? `?${query}` : ''
}

function redirectToLogin() {
  localStorage.removeItem(TOKEN_KEY)
  window.location.assign('/login')
}

export async function apiRequest(method, path, body) {
  const headers = {}
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out — please try again')
    }
    throw new Error('Network error — check your connection')
  } finally {
    clearTimeout(timeout)
  }

  if (res.status === 401) {
    redirectToLogin()
    const unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401
    throw unauthorizedError
  }

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(payload.error || payload.message || res.statusText || 'Request failed')
    err.status = res.status
    throw err
  }
  return payload
}

export function getOrders(params = {}) {
  return apiRequest('GET', `/orders${toQuery(params)}`)
}

export function createOrder(data) {
  return apiRequest('POST', '/orders', data)
}

export function updateOrderStatus(id, status) {
  return apiRequest('PUT', `/orders/${id}/status`, { status })
}

export function getOrderWhatsApp(id) {
  return apiRequest('GET', `/orders/${id}/whatsapp`)
}

export function searchCustomer(phone) {
  return apiRequest('GET', `/customers/search${toQuery({ phone })}`)
}

export function getCustomers(params = {}) {
  return apiRequest('GET', `/customers${toQuery(params)}`)
}

export function createCustomer(data) {
  return apiRequest('POST', '/customers', data)
}

export function getCustomer(id) {
  return apiRequest('GET', `/customers/${id}`)
}

export function getPriceList() {
  return apiRequest('GET', '/price-list')
}

export function getPriceListAll() {
  return apiRequest('GET', '/price-list/all')
}

export function createPriceListItem(data) {
  return apiRequest('POST', '/price-list', data)
}

export function updatePriceListItem(id, data) {
  return apiRequest('PUT', `/price-list/${id}`, data)
}

export function togglePriceListItem(id) {
  return apiRequest('PUT', `/price-list/${id}/toggle`)
}

export function deletePriceListItem(id) {
  return apiRequest('DELETE', `/price-list/${id}`)
}

export function getInventory() {
  return apiRequest('GET', '/inventory')
}

export function updateInventory(id, data) {
  return apiRequest('PUT', `/inventory/${id}`, data)
}

export function getLowStock() {
  return apiRequest('GET', '/inventory/low-stock')
}

export function getReportsBranches(date) {
  if (typeof date === 'object' && date !== null) {
    return apiRequest('GET', `/reports/branches${toQuery(date)}`)
  }
  return apiRequest('GET', `/reports/branches${toQuery({ date })}`)
}

export function getReportsDaily(params) {
  return apiRequest('GET', `/reports/daily${toQuery(params)}`)
}

export function getReportsOrders(params) {
  return apiRequest('GET', `/reports/orders${toQuery(params)}`)
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

export function getAdminStats() {
  return apiRequest('GET', '/admin/stats')
}

export function getAdminOwners() {
  return apiRequest('GET', '/admin/owners')
}
export function createAdminOwner(data) {
  return apiRequest('POST', '/admin/owners', data)
}
export function updateAdminOwner(id, data) {
  return apiRequest('PUT', `/admin/owners/${id}`, data)
}

export function getAdminBranches() {
  return apiRequest('GET', '/admin/branches')
}
export function createAdminBranch(data) {
  return apiRequest('POST', '/admin/branches', data)
}
export function updateAdminBranch(id, data) {
  return apiRequest('PUT', `/admin/branches/${id}`, data)
}

export function getAdminUsers() {
  return apiRequest('GET', '/admin/users')
}
export function createAdminUser(data) {
  return apiRequest('POST', '/admin/users', data)
}
export function updateAdminUser(id, data) {
  return apiRequest('PUT', `/admin/users/${id}`, data)
}
export function deleteAdminUser(id) {
  return apiRequest('DELETE', `/admin/users/${id}`)
}

export function getAdminAdmins() {
  return apiRequest('GET', '/admin/admins')
}
export function createAdminAdmin(data) {
  return apiRequest('POST', '/admin/admins', data)
}
export function updateAdminAdmin(id, data) {
  return apiRequest('PUT', `/admin/admins/${id}`, data)
}

export function getActivityLogs(params = {}) {
  return apiRequest('GET', `/admin/activity-logs${toQuery(params)}`)
}
