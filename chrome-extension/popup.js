// PointPilot Chrome Extension - Popup
const SUPABASE_URL = 'https://qlghqnkbkjzzdjlpccyr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZ2hxbmtia2p6emRqbHBjY3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODI3NjgsImV4cCI6MjA4NzM1ODc2OH0.3s0m1TKi0-4PuZPGjvZCBdsH_Rfy7Mo9xNoLoUQ2BiQ'
const API_BASE = 'https://pointpilot.vercel.app'

const app = document.getElementById('app')

// State
let state = {
  screen: 'loading', // loading | login | flights | details | selectTrip | success
  token: null,
  userEmail: null,
  flights: [],
  selectedFlight: null,
  selectedTiers: [], // array of tier objects to save
  trips: [],
  selectedTripId: null,
  error: null,
  saving: false,
}

function setState(updates) {
  Object.assign(state, updates)
  render()
}

// ---- Auth ----

async function loadAuth() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH' }, result => {
      resolve(result || {})
    })
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
  chrome.runtime.sendMessage({ type: 'CLEAR_AUTH' })
  setState({ token: null, userEmail: null, screen: 'login', error: null })
}

// ---- API calls ----

async function fetchTrips() {
  const res = await fetch(`${API_BASE}/api/trips`, {
    headers: { Authorization: `Bearer ${state.token}` },
  })
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

// ---- Helpers ----

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

// ---- Tier building ----
// Build tier options from a flight (could be one tier or multiple)
function buildTiersFromFlight(flight) {
  const tiers = []

  // If there are explicit pricingTiers, use those
  if (flight.pricingTiers && flight.pricingTiers.length > 0) {
    return flight.pricingTiers
  }

  // Build from top-level price fields
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

  // Header always shown (except on loading screen)
  if (s !== 'loading') {
    app.appendChild(renderHeader())
  }

  const screen = document.createElement('div')
  screen.className = 'screen'

  if (s === 'loading') {
    screen.innerHTML = `<div style="padding:40px;text-align:center;color:#6b7280">
      <div class="spinner" style="border-color:rgba(67,56,202,0.3);border-top-color:#4338ca;display:inline-block"></div>
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
      <img src="icon.png" alt="PointPilot" />
      <span>PointPilot</span>
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
    <div class="login-title">Sign in to PointPilot</div>
    <div class="login-sub">Log in to add flights to your trips</div>
    ${state.error ? `<div class="error">${state.error}</div>` : ''}
    <label>Email</label>
    <input type="email" id="email" placeholder="you@example.com" autocomplete="email" />
    <label>Password</label>
    <input type="password" id="password" placeholder="••••••••" autocomplete="current-password" />
    <button class="btn" id="loginBtn">Sign In</button>
  `

  const emailInput = el.querySelector('#email')
  const passwordInput = el.querySelector('#password')
  const loginBtn = el.querySelector('#loginBtn')

  const doLogin = async () => {
    const email = emailInput.value.trim()
    const password = passwordInput.value
    if (!email || !password) return
    loginBtn.disabled = true
    loginBtn.innerHTML = '<span class="spinner"></span>Signing in...'
    try {
      const data = await login(email, password)
      chrome.runtime.sendMessage({
        type: 'SET_AUTH',
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_email: data.user?.email || email,
      })
      state.token = data.access_token
      state.userEmail = data.user?.email || email
      await goToFlights()
    } catch (err) {
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
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✈️</div>
        <div class="empty-title">No flights detected</div>
        <div class="empty-sub">Browse to a flight results page and the extension will automatically detect flights. You can also search on Google Flights, United, Delta, or other airline sites.</div>
      </div>
    `
    return el
  }

  if (flights.length === 1) {
    // Auto-select and jump straight to details
    setTimeout(() => selectFlight(flights[0]), 0)
    el.innerHTML = `<div style="text-align:center;padding:20px;color:#6b7280">Loading flight details...</div>`
    return el
  }

  el.innerHTML = `<div class="section-title">${flights.length} flights detected — pick one</div>`
  const list = document.createElement('div')
  list.className = 'flight-list'

  flights.forEach((f, i) => {
    const card = document.createElement('div')
    card.className = 'flight-card'
    const price = formatPrice(f)
    card.innerHTML = `
      <div class="flight-route">
        <span>${f.departureAirport || '?'}</span>
        <span class="arrow">→</span>
        <span>${f.arrivalAirport || '?'}</span>
        ${f.stops === 0 ? '<span style="font-size:11px;color:#6b7280;font-weight:400">Nonstop</span>' : (f.stops ? `<span style="font-size:11px;color:#6b7280;font-weight:400">${f.stops} stop${f.stops > 1 ? 's' : ''}</span>` : '')}
      </div>
      <div class="flight-meta">
        ${f.flightCode ? `<span>${f.flightCode}</span>` : ''}
        ${f.airlineName ? `<span>${f.airlineName}</span>` : ''}
        ${f.departureTime ? `<span>${formatTime(f.departureTime)} → ${formatTime(f.arrivalTime)}</span>` : ''}
        ${f.duration ? `<span>${formatDuration(f.duration)}</span>` : ''}
        ${price ? `<span class="badge">${price}</span>` : ''}
        ${f.cabinClass ? `<span>${f.cabinClass}</span>` : ''}
      </div>
    `
    card.addEventListener('click', () => selectFlight(f))
    list.appendChild(card)
  })

  el.appendChild(list)
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

  // Segment summary
  let summaryHTML = `
    <div class="segment-summary">
      <div class="seg-route">${f.departureAirport || '?'} → ${f.arrivalAirport || '?'}</div>
      <div class="seg-detail">
        ${f.flightCode ? `${f.flightCode} · ` : ''}${f.airlineName || ''}
        ${f.date ? ` · ${f.date}` : ''}
        ${f.departureTime ? ` · ${formatTime(f.departureTime)} → ${formatTime(f.arrivalTime)}` : ''}
        ${f.duration ? ` · ${formatDuration(f.duration)}` : ''}
      </div>
    </div>
  `

  // Tier selection
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

  // Payment type toggle for manual entry
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

  // Tier checkboxes styling
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
    // Collect selected tiers
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
      // Manual entry
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
    state.selectedFlight.bookingSite = bookingSite
    state.selectedTiers = selectedTiers

    // Load trips
    try {
      const trips = await fetchTrips()
      setState({ trips, selectedTiers, screen: 'selectTrip', error: null })
    } catch (err) {
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
        <div class="empty-sub">Create a trip on PointPilot first, then come back to add flights.</div>
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

  // Build the flight object
  // Determine primary payment type and amounts from first selected tier
  const primaryTier = tiers[0]
  const additionalTiers = tiers.slice(1)

  // Find which leg index this flight belongs to (auto-detect by airports, default 0)
  let legIndex = 0
  if (trip.legs && trip.legs.length > 1) {
    const depMatch = trip.legs.findIndex(l =>
      l.from?.toUpperCase() === (f.departureAirport || '').toUpperCase()
    )
    if (depMatch >= 0) legIndex = depMatch
    // Otherwise default to 0 — user can edit in app
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
    pricingTiers: additionalTiers.length > 0 ? [primaryTier, ...additionalTiers] : [],
  }

  try {
    await addFlightToTrip(trip.id, flightData)
    chrome.runtime.sendMessage({ type: 'CLEAR_FLIGHTS' })
    setState({ saving: false, screen: 'success', selectedTripId: trip.id })
  } catch (err) {
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
    <a href="https://pointpilot.vercel.app/trip/${state.selectedTripId}" target="_blank" class="btn">
      Open Trip in PointPilot
    </a>
    <button class="btn btn-secondary" id="addAnotherBtn">Add Another Flight</button>
  `
  el.querySelector('#addAnotherBtn').addEventListener('click', () => {
    setState({ screen: 'flights', selectedFlight: null, selectedTiers: [], error: null })
    goToFlights()
  })
  return el
}

// ---- Init ----

async function goToFlights() {
  const flights = await loadFlights()
  setState({ flights, screen: 'flights' })
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
