// Point Tripper Chrome Extension - Popup
const SUPABASE_URL = 'https://qlghqnkbkjzzdjlpccyr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZ2hxbmtia2p6emRqbHBjY3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODI3NjgsImV4cCI6MjA4NzM1ODc2OH0.3s0m1TKi0-4PuZPGjvZCBdsH_Rfy7Mo9xNoLoUQ2BiQ'
const API_BASE = 'https://www.pointtripper.com'

const app = document.getElementById('app')

// State
let state = {
  screen: 'loading', // loading | login | analyzing | flights | details | selectTrip | success
  token: null,
  userEmail: null,
  flights: [],
  selectedFlight: null,
  selectedTiers: [],
  trips: [],
  selectedTripId: null,
  error: null,
  debugInfo: null,
  lastDebug: null,
  saving: false,
  analyzeProgress: 0, // 0-100 for progress bar
  hasMorePayloads: false, // true if network payloads available for deeper scan
  showPassword: false,
  addedFlightKeys: [], // track which flights have been added (by flightCode+dep+arr+time)
}

function setState(updates) {
  Object.assign(state, updates)
  render()
}

// ---- Auth ----

async function loadAuth() {
  return new Promise(resolve => {
    chrome.storage.local.get(['access_token', 'refresh_token', 'user_email'], result => {
      resolve(result || {})
    })
  })
}

function saveAuth(access_token, refresh_token, user_email) {
  return new Promise(resolve => {
    chrome.storage.local.set({ access_token, refresh_token, user_email }, resolve)
  })
}

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.message || 'Login failed')
  return data
}

function logout() {
  chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email'])
  setState({ token: null, userEmail: null, screen: 'login', error: null })
}

function handleAuthError() {
  chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email'])
  setState({ token: null, userEmail: null, screen: 'login', error: 'Session expired. Please sign in again.' })
}

// ---- API calls ----

async function fetchTrips() {
  const res = await fetch(`${API_BASE}/api/trips`, {
    headers: { Authorization: `Bearer ${state.token}` },
  })
  if (res.status === 401) { handleAuthError(); throw new Error('Session expired') }
  if (!res.ok) throw new Error('Failed to load trips')
  return res.json()
}

async function addFlightToTrip(tripId, flightData) {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}/flight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify(flightData),
  })
  if (res.status === 401) { handleAuthError(); throw new Error('Session expired') }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to add flight')
  }
  return res.json()
}

// ---- Flight detection ----

async function loadFlights() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_FLIGHTS' }, result => {
      resolve(result?.flights || [])
    })
  })
}

async function loadRawPayloads() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_RAW_PAYLOADS' }, result => {
      resolve(result?.payloads || [])
    })
  })
}

async function readPagePayloads(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => (window.__pointpilotPayloads || []).filter(p => p && p.payload && p.payload.length > 200),
    })
    return results?.[0]?.result || []
  } catch (_) {
    return []
  }
}

async function readPageText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Try to extract only the main flight results area, ignoring ads/popups/nav/footer
        // Common selectors for flight result containers on booking sites
        const resultSelectors = [
          // Skyscanner
          '[class*="FlightsResults"]',
          '[class*="ResultList"]',
          '[class*="day-list"]',
          '[class*="ItineraryList"]',
          'main [class*="itinerary"]',
          // Google Flights
          '[class*="gws-flights-results"]',
          'ul[class*="result"]',
          // United
          '[class*="flight-result"]',
          '[class*="FlightList"]',
          // Delta
          '[class*="search-results"]',
          // AA
          '[class*="results-grid"]',
          // Generic
          'main',
          '[role="main"]',
          '#main-content',
          '#search-results',
        ]

        let resultText = ''
        for (const sel of resultSelectors) {
          const el = document.querySelector(sel)
          if (el && el.innerText && el.innerText.length > 200) {
            resultText = el.innerText
            break
          }
        }

        // If we found a focused result area, use it; otherwise fall back to body
        const text = resultText || (document.body?.innerText || '')
        return text.replace(/\s{3,}/g, '\n\n').substring(0, 15000)
      },
    })
    return results?.[0]?.result || ''
  } catch (_) {
    return ''
  }
}

async function parseFlightsWithAI(payloads, pageUrl) {
  if (!state.token) throw new Error('Not logged in')
  const res = await fetch(`${API_BASE}/api/parse-flights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      payloads: payloads.map(p => (typeof p === 'string' ? p : p.payload)),
      url: pageUrl,
    }),
  })
  if (res.status === 401) { handleAuthError(); throw new Error('Session expired') }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${body.substring(0, 200)}`)
  }
  const data = await res.json()
  if (data.debug) {
    setState({ lastDebug: data.debug })
  }
  if (data.error && (!data.flights || data.flights.length === 0)) {
    throw new Error(data.error)
  }
  return data.flights || []
}

function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0] || null)
    })
  })
}

function storeFlights(flights) {
  chrome.runtime.sendMessage({ type: 'STORE_FLIGHTS', flights })
}

// ---- Helpers ----

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function formatFlightLabel(f) {
  const parts = []
  if (f.flightCode) parts.push(f.flightCode)
  if (f.airlineName) parts.push(f.airlineName)
  return parts.join(' · ') || 'Flight'
}

function formatPrice(f) {
  const parts = []
  if (f.cashAmount) parts.push(`$${f.cashAmount.toLocaleString()}`)
  if (f.pointsAmount) parts.push(`${Math.round(f.pointsAmount).toLocaleString()} pts`)
  if (f.feesAmount && f.pointsAmount) parts.push(`+ $${f.feesAmount} fees`)
  return parts.join(' / ') || null
}

function formatTime(t) {
  if (!t) return ''
  if (t.length > 5) return t.substring(11, 16)
  return t
}

function formatDuration(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function getBookingSite() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0]?.url || ''
      try {
        const host = new URL(url).hostname.replace('www.', '')
        resolve(host)
      } catch { resolve('') }
    })
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function flightKey(f) {
  return `${f.flightCode || ''}|${f.departureAirport || ''}|${f.arrivalAirport || ''}|${formatTime(f.departureTime) || ''}`
}

function formatRoute(f) {
  const dep = f.departureAirport || '?'
  const arr = f.arrivalAirport || '?'
  const stopovers = f.stopoverAirports && f.stopoverAirports.length > 0 ? f.stopoverAirports : []
  return [dep, ...stopovers, arr].join(' → ')
}

// ---- Tier building ----
function buildTiersFromFlight(flight) {
  const tiers = []
  if (flight.pricingTiers && flight.pricingTiers.length > 0) {
    return flight.pricingTiers
  }
  if (flight.cashAmount || flight.pointsAmount) {
    tiers.push({
      id: crypto.randomUUID(),
      label: flight.cabinClass || 'Standard',
      paymentType: flight.pointsAmount ? 'points' : 'cash',
      cashAmount: flight.cashAmount || null,
      pointsAmount: flight.pointsAmount || null,
      feesAmount: flight.feesAmount || null,
    })
  }
  return tiers
}

// ---- Render ----

function render() {
  app.innerHTML = ''
  const s = state.screen

  if (s !== 'loading') {
    app.appendChild(renderHeader())
  }

  const screen = document.createElement('div')
  screen.className = 'screen'

  if (s === 'loading') {
    screen.innerHTML = `<div style="padding:40px;text-align:center;color:#6b7280">
      <div class="spinner" style="border-color:rgba(67,56,202,0.3);border-top-color:#4338ca;display:inline-block"></div>
    </div>`
  } else if (s === 'analyzing') {
    const pct = state.analyzeProgress || 0
    const showSkeleton = pct >= 55
    screen.innerHTML = `<div style="padding:32px 16px;text-align:center">
      <div style="width:100%;height:6px;background:#e0e0f0;border-radius:3px;overflow:hidden;margin-bottom:16px">
        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#4338ca,#6366f1);border-radius:3px;transition:width 0.3s ease"></div>
      </div>
      <div style="font-weight:600;color:#1e1b4b;font-size:15px">Analyzing flights...</div>
      <div style="margin-top:8px;font-size:13px;color:#4b5563">Filter results on the booking site for faster, more accurate detection</div>
      ${showSkeleton ? `
        <div class="flight-list" style="margin-top:20px">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      ` : ''}
    </div>`
  } else if (s === 'login') {
    screen.appendChild(renderLogin())
  } else if (s === 'flights') {
    screen.appendChild(renderFlightPicker())
  } else if (s === 'details') {
    screen.appendChild(renderDetails())
  } else if (s === 'selectTrip') {
    screen.appendChild(renderTripPicker())
  } else if (s === 'success') {
    screen.appendChild(renderSuccess())
  }

  app.appendChild(screen)
}

function renderHeader() {
  const el = document.createElement('div')
  el.className = 'header'
  el.innerHTML = `
    <div class="header-logo">
      <img src="icon.png" alt="Point Tripper" />
      <span>Point Tripper</span>
    </div>
    ${state.userEmail ? `
      <div style="display:flex;align-items:center;gap:8px">
        <span class="header-user">${state.userEmail}</span>
        <button class="btn-link" id="logoutBtn">Sign out</button>
      </div>
    ` : ''}
  `
  el.querySelector('#logoutBtn')?.addEventListener('click', logout)
  return el
}

function renderLogin() {
  const el = document.createElement('div')
  el.innerHTML = `
    <div class="login-title">Sign in to Point Tripper</div>
    <div class="login-sub">Log in to add flights to your trips</div>
    ${state.error ? `<div class="error">${state.error}</div>` : ''}
    <label>Email</label>
    <input type="email" id="email" placeholder="you@example.com" autocomplete="email" />
    <label>Password</label>
    <div style="position:relative">
      <input type="${state.showPassword ? 'text' : 'password'}" id="password" placeholder="••••••••" autocomplete="current-password" style="padding-right:40px" />
      <button type="button" id="togglePw" style="position:absolute;right:8px;top:50%;transform:translateY(-60%);background:none;border:none;cursor:pointer;color:#6b7280;font-size:15px;padding:4px;line-height:1" title="${state.showPassword ? 'Hide password' : 'Show password'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
          ${state.showPassword ? '' : '<line x1="1" y1="1" x2="23" y2="23"/>'}
        </svg>
      </button>
    </div>
    <button class="btn" id="loginBtn">Sign In</button>
  `

  const emailInput = el.querySelector('#email')
  const passwordInput = el.querySelector('#password')
  const loginBtn = el.querySelector('#loginBtn')

  el.querySelector('#togglePw').addEventListener('click', () => {
    state.showPassword = !state.showPassword
    passwordInput.type = state.showPassword ? 'text' : 'password'
    const btn = el.querySelector('#togglePw')
    btn.title = state.showPassword ? 'Hide password' : 'Show password'
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
      ${state.showPassword ? '' : '<line x1="1" y1="1" x2="23" y2="23"/>'}
    </svg>`
  })

  const doLogin = async () => {
    const email = emailInput.value.trim()
    const password = passwordInput.value
    if (!email || !password) return
    loginBtn.disabled = true
    loginBtn.innerHTML = '<span class="spinner"></span>Signing in...'
    try {
      const data = await login(email, password)
      const userEmail = data.user?.email || email
      await saveAuth(data.access_token, data.refresh_token, userEmail)
      state.token = data.access_token
      state.userEmail = userEmail
      await goToFlights()
    } catch (err) {
      loginBtn.disabled = false
      loginBtn.textContent = 'Sign In'
      setState({ error: err.message })
    }
  }

  loginBtn.addEventListener('click', doLogin)
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin() })
  return el
}

function renderFlightPicker() {
  const el = document.createElement('div')
  const flights = state.flights

  if (flights.length === 0) {
    const debug = state.lastDebug
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✈️</div>
        <div class="empty-title">No flights detected</div>
        ${state.error ? `<div style="font-size:13px;color:#dc2626;margin-top:8px;word-break:break-all;text-align:left">${state.error}</div>` : ''}
        ${debug ? `<div style="font-size:11px;color:#4b5563;margin-top:6px;text-align:left;word-break:break-all;white-space:pre-wrap"><b>AI sent ${debug.payloadCount || '?'} payloads (${(debug.sizes||[]).join(',')} chars)</b>&#10;<b>Said:</b> ${esc(debug.aiSaid || debug.geminiSaid || '(empty)')}&#10;<b>Sample:</b> ${esc(debug.payloadSample || '(none)')}</div>` : ''}
        <button class="btn btn-secondary" id="retryBtn" style="margin-top:12px">Retry</button>
      </div>
    `
    el.querySelector('#retryBtn')?.addEventListener('click', () => {
      setState({ error: null, lastDebug: null })
      goToFlights()
    })
    return el
  }

  // Tip when many flights
  const tip = flights.length > 10
    ? `<div style="font-size:13px;color:#4b5563;margin-bottom:8px;background:#f5f3ff;padding:8px 10px;border-radius:6px">Tip: Filter results on the booking site first for faster detection.</div>`
    : ''

  el.innerHTML = `${tip}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div class="section-title" style="margin-bottom:0">${flights.length} flight${flights.length !== 1 ? 's' : ''} detected — pick one</div>
      <button class="btn btn-sm btn-secondary" id="rescanBtn" style="margin:0;flex-shrink:0">Refresh results</button>
    </div>`
  const list = document.createElement('div')
  list.className = 'flight-list'

  flights.forEach((f, i) => {
    const card = document.createElement('div')
    const isAdded = state.addedFlightKeys.includes(flightKey(f))
    card.className = 'flight-card' + (isAdded ? ' added' : '')

    const stopAirports = f.stopoverAirports && f.stopoverAirports.length > 0 ? f.stopoverAirports.join(', ') : ''
    const stopsLabel = f.stops === 0 ? 'Nonstop' : (f.stops ? `${f.stops} stop${f.stops > 1 ? 's' : ''}${stopAirports ? ` (${stopAirports})` : ''}` : '')
    const depTime = formatTime(f.departureTime)
    const arrTime = formatTime(f.arrivalTime)

    card.innerHTML = `
      <div class="flight-times">
        ${depTime ? `<span class="time-big">${depTime}</span>` : ''}
        ${depTime ? `<span class="time-arrow">→</span>` : ''}
        ${arrTime ? `<span class="time-big">${arrTime}</span>` : ''}
        ${f.duration ? `<span class="time-duration">${formatDuration(f.duration)}</span>` : ''}
        ${stopsLabel ? `<span class="time-stops">${stopsLabel}</span>` : ''}
      </div>
      <div class="flight-meta">
        <span class="flight-route-inline">${formatRoute(f)}</span>
        ${f.flightCode ? `<span>${f.flightCode}</span>` : ''}
        ${f.airlineName ? `<span>${f.airlineName}</span>` : ''}
        ${isAdded ? `<span class="badge added-badge">Added</span>` : ''}
      </div>
    `
    card.addEventListener('click', () => selectFlight(f))
    list.appendChild(card)
  })

  el.appendChild(list)

  // Rescan button — clears cache and re-analyzes the current tab
  el.querySelector('#rescanBtn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_FLIGHTS' })
    setState({ flights: [], error: null, lastDebug: null, hasMorePayloads: false })
    goToFlights()
  })

  // "Scan deeper" button if we have network payloads we haven't used yet
  if (state.hasMorePayloads) {
    const moreBtn = document.createElement('button')
    moreBtn.className = 'btn btn-secondary'
    moreBtn.style.marginTop = '10px'
    moreBtn.textContent = 'Scan deeper (analyze raw API data)'
    moreBtn.addEventListener('click', () => {
      setState({ hasMorePayloads: false })
      goToFlights(true) // deep scan
    })
    el.appendChild(moreBtn)
  }

  return el
}

async function selectFlight(flight) {
  const bookingSite = await getBookingSite()
  setState({
    selectedFlight: { ...flight, bookingSite },
    selectedTiers: buildTiersFromFlight(flight),
    screen: 'details',
  })
}

function renderDetails() {
  const f = state.selectedFlight
  const tiers = buildTiersFromFlight(f)
  const el = document.createElement('div')

  let summaryHTML = `
    <div class="segment-summary">
      <div class="seg-route">${formatRoute(f)}</div>
      <div class="seg-detail">
        ${f.flightCode ? `${f.flightCode} · ` : ''}${f.airlineName || ''}
        ${f.date ? ` · ${f.date}` : ''}
        ${f.departureTime ? ` · ${formatTime(f.departureTime)} → ${formatTime(f.arrivalTime)}` : ''}
        ${f.duration ? ` · ${formatDuration(f.duration)}` : ''}
      </div>
    </div>
  `

  let tierHTML = ''
  if (tiers.length === 0) {
    tierHTML = `
      <div class="section-title">Pricing</div>
      <div class="field-row">
        <div>
          <label>Type</label>
          <select id="paymentType">
            <option value="cash">Cash</option>
            <option value="points">Points / Miles</option>
          </select>
        </div>
        <div>
          <label id="priceLabel">Amount ($)</label>
          <input type="number" id="priceAmount" placeholder="e.g. 450" value="${f.cashAmount || ''}" />
        </div>
      </div>
      <div id="feesRow" style="display:none">
        <label>Taxes + Fees ($)</label>
        <input type="number" id="feesAmount" placeholder="e.g. 25" value="${f.feesAmount || ''}" />
      </div>
    `
  } else if (tiers.length === 1) {
    const t = tiers[0]
    const priceStr = t.paymentType === 'points'
      ? `${Math.round(t.pointsAmount || 0).toLocaleString()} pts${t.feesAmount ? ` + $${t.feesAmount} fees` : ''}`
      : `$${(t.cashAmount || 0).toLocaleString()}`
    tierHTML = `
      <div class="section-title">Pricing</div>
      <div class="tier-card selected" style="cursor:default">
        <div class="tier-info">
          <div class="tier-label">${t.label}</div>
          <div class="tier-price">${priceStr} · ${t.paymentType === 'points' ? 'Points' : 'Cash'}</div>
        </div>
        <span style="color:#4338ca;font-size:18px">✓</span>
      </div>
      <div style="height:10px"></div>
    `
  } else {
    tierHTML = `<div class="section-title">Select pricing tier(s) to save</div><div class="tier-grid" id="tierGrid">`
    tiers.forEach((t, i) => {
      const priceStr = t.paymentType === 'points'
        ? `${Math.round(t.pointsAmount || 0).toLocaleString()} pts${t.feesAmount ? ` + $${t.feesAmount} fees` : ''}`
        : `$${(t.cashAmount || 0).toLocaleString()}`
      tierHTML += `
        <label class="tier-card" id="tier_${i}">
          <input type="checkbox" value="${i}" ${i === 0 ? 'checked' : ''} />
          <div class="tier-info">
            <div class="tier-label">${t.label}</div>
            <div class="tier-price">${priceStr} · ${t.paymentType === 'points' ? 'Points' : 'Cash'}</div>
          </div>
        </label>
      `
    })
    tierHTML += `</div>`
  }

  el.innerHTML = `
    ${summaryHTML}
    <label>Booking site</label>
    <input type="text" id="bookingSite" value="${f.bookingSite || ''}" placeholder="e.g. united.com" />
    ${tierHTML}
    ${state.error ? `<div class="error">${state.error}</div>` : ''}
    <button class="btn" id="nextBtn">Select Trip →</button>
    <button class="btn btn-secondary" id="backBtn" style="margin-top:8px">← Back</button>
  `

  const paymentTypeEl = el.querySelector('#paymentType')
  const priceLabelEl = el.querySelector('#priceLabel')
  const feesRowEl = el.querySelector('#feesRow')
  if (paymentTypeEl) {
    paymentTypeEl.addEventListener('change', () => {
      const isPoints = paymentTypeEl.value === 'points'
      if (priceLabelEl) priceLabelEl.textContent = isPoints ? 'Points / Miles' : 'Amount ($)'
      if (feesRowEl) feesRowEl.style.display = isPoints ? 'block' : 'none'
    })
  }

  el.querySelectorAll('.tier-card input[type="checkbox"]').forEach(cb => {
    const card = cb.closest('.tier-card')
    if (cb.checked) card.classList.add('selected')
    cb.addEventListener('change', () => {
      card.classList.toggle('selected', cb.checked)
    })
  })

  el.querySelector('#backBtn').addEventListener('click', () => {
    setState({ screen: 'flights', error: null })
  })

  el.querySelector('#nextBtn').addEventListener('click', async () => {
    let selectedTiers = []
    const tierCheckboxes = el.querySelectorAll('.tier-grid input[type="checkbox"]')
    if (tierCheckboxes.length > 0) {
      tierCheckboxes.forEach(cb => {
        if (cb.checked) selectedTiers.push(tiers[parseInt(cb.value)])
      })
      if (selectedTiers.length === 0) {
        setState({ error: 'Please select at least one pricing tier.' })
        return
      }
    } else if (tiers.length === 1) {
      selectedTiers = tiers
    } else {
      const payType = paymentTypeEl?.value || 'cash'
      const amount = parseFloat(el.querySelector('#priceAmount')?.value || '0') || null
      const fees = parseFloat(el.querySelector('#feesAmount')?.value || '0') || null
      selectedTiers = [{
        id: crypto.randomUUID(),
        label: 'Standard',
        paymentType: payType,
        cashAmount: payType === 'cash' ? amount : null,
        pointsAmount: payType === 'points' ? amount : null,
        feesAmount: fees,
      }]
    }

    const bookingSite = el.querySelector('#bookingSite')?.value.trim() || ''
    const updatedFlight = { ...state.selectedFlight, bookingSite }

    try {
      const trips = await fetchTrips()
      setState({ trips, selectedTiers, selectedFlight: updatedFlight, screen: 'selectTrip', error: null })
    } catch (err) {
      if (state.screen === 'login') return
      setState({ error: err.message })
    }
  })

  return el
}

function renderTripPicker() {
  const el = document.createElement('div')
  const trips = state.trips

  if (trips.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗺️</div>
        <div class="empty-title">No trips yet</div>
        <div class="empty-sub">Create a trip on Point Tripper first, then come back to add flights.</div>
      </div>
    `
    return el
  }

  el.innerHTML = `<div class="section-title">Which trip?</div>`
  const list = document.createElement('div')
  list.className = 'trip-list'

  trips.forEach(trip => {
    const item = document.createElement('div')
    item.className = 'trip-item'
    const route = trip.legs?.length > 0
      ? trip.legs.map(l => l.from).concat(trip.legs[trip.legs.length - 1].to).join(' → ')
      : ''
    item.innerHTML = `
      <div class="trip-name">${trip.name || 'Untitled Trip'}</div>
      ${route ? `<div class="trip-route">${route}</div>` : ''}
      ${trip.departureDate ? `<div class="trip-route">${trip.departureDate}</div>` : ''}
    `
    item.addEventListener('click', () => addFlight(trip))
    list.appendChild(item)
  })

  el.appendChild(list)

  const back = document.createElement('button')
  back.className = 'btn btn-secondary'
  back.style.marginTop = '12px'
  back.textContent = '← Back'
  back.addEventListener('click', () => setState({ screen: 'details', error: null }))
  el.appendChild(back)

  return el
}

async function addFlight(trip) {
  if (state.saving) return
  setState({ saving: true, error: null })

  const f = state.selectedFlight
  const tiers = state.selectedTiers
  const primaryTier = tiers[0]
  const additionalTiers = tiers.slice(1)

  let legIndex = 0
  if (trip.legs && trip.legs.length > 1) {
    const depMatch = trip.legs.findIndex(l =>
      l.from?.toUpperCase() === (f.departureAirport || '').toUpperCase()
    )
    if (depMatch >= 0) legIndex = depMatch
  }

  const segment = {
    flightCode: f.flightCode || '',
    airlineName: f.airlineName || '',
    date: f.date || '',
    arrivalDate: f.arrivalDate || f.date || '',
    departureAirport: f.departureAirport || '',
    arrivalAirport: f.arrivalAirport || '',
    departureTime: formatTime(f.departureTime) || '',
    arrivalTime: formatTime(f.arrivalTime) || '',
    departureTimeUtc: '',
    arrivalTimeUtc: '',
    duration: f.duration || null,
  }

  const flightData = {
    legIndex,
    segments: [segment],
    bookingSite: f.bookingSite || '',
    paymentType: primaryTier.paymentType,
    cashAmount: primaryTier.cashAmount,
    pointsAmount: primaryTier.pointsAmount,
    feesAmount: primaryTier.feesAmount,
    defaultTierLabel: primaryTier.label,
    pricingTiers: [primaryTier, ...additionalTiers],
  }

  try {
    await addFlightToTrip(trip.id, flightData)
    const key = flightKey(f)
    const addedKeys = state.addedFlightKeys.includes(key) ? state.addedFlightKeys : [...state.addedFlightKeys, key]
    setState({ saving: false, screen: 'success', selectedTripId: trip.id, addedFlightKeys: addedKeys })
  } catch (err) {
    if (state.screen === 'login') return
    setState({ saving: false, error: err.message })
  }
}

function renderSuccess() {
  const el = document.createElement('div')
  const trip = state.trips.find(t => t.id === state.selectedTripId)
  el.innerHTML = `
    <div class="success-icon">✅</div>
    <div class="success-title">Flight added!</div>
    <div class="success-sub">Successfully added to "${trip?.name || 'your trip'}"</div>
    <a href="https://www.pointtripper.com/trip/${state.selectedTripId}" target="_blank" class="btn">
      Open Trip in Point Tripper
    </a>
    <button class="btn btn-secondary" id="addAnotherBtn">Add Another Flight</button>
  `
  el.querySelector('#addAnotherBtn').addEventListener('click', () => {
    // Reuse previously detected flights — no need to re-scan the page
    setState({ screen: 'flights', selectedFlight: null, selectedTiers: [], error: null })
  })
  return el
}

// ---- Init ----

async function goToFlights(deepScan = false) {
  const tab = await getCurrentTab()
  const tabId = tab?.id
  const pageUrl = tab?.url || ''

  // Get already-parsed flights (JSON-LD hits from content.js)
  const existingFlights = await loadFlights()

  // If we already have parsed flights cached, show them immediately (unless deep scanning)
  if (existingFlights.length > 0 && !deepScan) {
    setState({ flights: existingFlights, screen: 'flights' })
    return
  }

  setState({ screen: 'analyzing', analyzeProgress: 2, debugInfo: 'Reading page...' })

  // Smooth progress animation: creeps slowly toward target, never quite reaching it
  let progressTarget = 8
  let progressCurrent = 2
  const progressInterval = setInterval(() => {
    if (progressCurrent < progressTarget) {
      const remaining = progressTarget - progressCurrent
      // Very slow: 2% of remaining distance per tick — feels deliberate, never jumps
      const step = Math.max(0.15, remaining * 0.02)
      progressCurrent = Math.min(progressTarget, progressCurrent + step)
      if (state.screen === 'analyzing') {
        state.analyzeProgress = Math.round(progressCurrent)
        render()
      }
    }
  }, 200)

  try {
    if (!tabId) {
      clearInterval(progressInterval)
      setState({ flights: [], screen: 'flights', error: 'Debug: no active tab' })
      return
    }

    // Step 1: Read page text (fast — this is what the user sees)
    progressTarget = 12
    setState({ screen: 'analyzing', debugInfo: 'Reading page text...' })
    let pageText = await readPageText(tabId)

    // Step 2: Check for network payloads
    progressTarget = 20
    setState({ screen: 'analyzing', debugInfo: 'Checking intercepted data...' })
    const cachedPayloads = await loadRawPayloads()
    const pagePayloads = cachedPayloads.length > 0 ? cachedPayloads : await readPagePayloads(tabId)

    // If page text is too short and no network data, wait for SPA
    if (pageText.length < 3000 && pagePayloads.length === 0) {
      progressTarget = 30
      setState({ screen: 'analyzing', debugInfo: 'Waiting for page to load...' })
      await sleep(2000)
      pageText = await readPageText(tabId)
    }

    // Strategy: send page text only for fast initial scan
    // If deepScan requested, also include network payloads
    let payloads = []
    let debugSource = ''
    let hasMore = false

    if (deepScan && pagePayloads.length > 0) {
      // Deep scan: send network payloads + page text
      payloads = pagePayloads
      debugSource = `network(${pagePayloads.length})`
      if (pageText.length > 500) {
        payloads = [...payloads, { payload: pageText }]
        debugSource += `+page`
      }
    } else {
      // Fast scan: page text only (much smaller, faster AI response)
      if (pageText.length > 500) {
        payloads = [{ payload: pageText }]
        debugSource = `pagetext(${pageText.length}ch)`
        hasMore = pagePayloads.length > 0
      } else if (pagePayloads.length > 0) {
        // No page text, use network payloads
        payloads = pagePayloads
        debugSource = `network(${pagePayloads.length})`
      }
    }

    if (payloads.length === 0) {
      clearInterval(progressInterval)
      setState({ flights: [], screen: 'flights', error: `Debug: no data (tabId=${tabId})` })
      return
    }

    progressTarget = 70
    setState({ screen: 'analyzing', debugInfo: `Analyzing flight data...` })

    const aiFlights = await parseFlightsWithAI(payloads, pageUrl)

    clearInterval(progressInterval)
    setState({ screen: 'analyzing', analyzeProgress: 100, debugInfo: 'Done!' })

    if (aiFlights.length > 0) {
      storeFlights(aiFlights)
    }

    setState({
      flights: aiFlights,
      screen: 'flights',
      hasMorePayloads: hasMore && aiFlights.length > 0,
      error: aiFlights.length === 0 ? `Debug: AI returned 0 flights (source: ${debugSource})` : null,
    })
  } catch (err) {
    clearInterval(progressInterval)
    if (state.screen === 'login') return
    setState({ flights: existingFlights, screen: 'flights', error: `Error: ${err.message}` })
  }
}

async function init() {
  setState({ screen: 'loading' })
  const auth = await loadAuth()

  if (auth.access_token) {
    state.token = auth.access_token
    state.userEmail = auth.user_email
    await goToFlights()
  } else {
    setState({ screen: 'login' })
  }
}

init()