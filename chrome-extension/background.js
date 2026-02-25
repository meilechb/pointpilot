// Background service worker
// Caches intercepted raw payloads and parsed flights per tab, manages auth token

const flightCache = {}     // tabId -> [flight, ...]
const rawPayloadCache = {} // tabId -> [{ url, payload }, ...]
const parsedUrls = {}      // tabId -> Set of URLs already sent to AI (so we don't re-parse)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // --- Raw payload from content.js (intercepted network response) ---
  if (msg.type === 'RAW_PAYLOAD') {
    const tabId = sender.tab?.id
    if (!tabId) return
    const existing = rawPayloadCache[tabId] || []
    // Dedupe by URL
    const alreadyHave = existing.some(p => p.url === msg.url)
    if (!alreadyHave) {
      rawPayloadCache[tabId] = [...existing, { url: msg.url, payload: msg.payload }].slice(-10)
    }
  }

  // --- Structured flights from JSON-LD (content.js) ---
  if (msg.type === 'FLIGHTS_DETECTED') {
    const tabId = sender.tab?.id
    if (!tabId) return
    const existing = flightCache[tabId] || []
    const existingKeys = new Set(existing.map(f => flightKey(f)))
    const newFlights = (msg.flights || []).filter(f => !existingKeys.has(flightKey(f)))
    flightCache[tabId] = [...existing, ...newFlights]
    const count = flightCache[tabId].length
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#4338CA', tabId })
  }

  // --- PAYLOADS_DUMP_DONE: content script finished forwarding on-demand payloads ---
  if (msg.type === 'PAYLOADS_DUMP_DONE') {
    // Nothing to do — payloads were already received via RAW_PAYLOAD messages above
  }

  // --- Popup asking for raw payloads to send to AI ---
  if (msg.type === 'GET_RAW_PAYLOADS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) { sendResponse({ payloads: [] }); return }

      const cached = rawPayloadCache[tabId] || []
      if (cached.length > 0) {
        // Already have payloads — return immediately
        sendResponse({ payloads: cached })
        return
      }

      // No cached payloads — ask content script to dump from MAIN world
      // then wait a moment for the RAW_PAYLOAD messages to come in
      chrome.tabs.sendMessage(tabId, { type: 'REQUEST_PAYLOADS_DUMP' }, () => {
        // Wait 300ms for the dump messages to arrive, then return whatever we got
        setTimeout(() => {
          sendResponse({ payloads: rawPayloadCache[tabId] || [] })
        }, 300)
      })
    })
    return true // async response
  }

  // --- Popup asking for already-parsed flights ---
  if (msg.type === 'GET_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      sendResponse({ flights: flightCache[tabId] || [] })
    })
    return true
  }

  // --- Popup storing AI-parsed flights ---
  if (msg.type === 'STORE_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) return
      const existing = flightCache[tabId] || []
      const existingKeys = new Set(existing.map(f => flightKey(f)))
      const newFlights = (msg.flights || []).filter(f => !existingKeys.has(flightKey(f)))
      flightCache[tabId] = [...existing, ...newFlights]
      const count = flightCache[tabId].length
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId })
      chrome.action.setBadgeBackgroundColor({ color: '#4338CA', tabId })
    })
  }

  // --- Clear after flight added ---
  if (msg.type === 'CLEAR_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId) {
        flightCache[tabId] = []
        rawPayloadCache[tabId] = []
        chrome.action.setBadgeText({ text: '', tabId })
      }
    })
  }

  // --- Auth ---
  if (msg.type === 'GET_AUTH') {
    chrome.storage.local.get(['access_token', 'refresh_token', 'user_email'], (result) => {
      sendResponse(result)
    })
    return true
  }

  if (msg.type === 'SET_AUTH') {
    chrome.storage.local.set({
      access_token: msg.access_token,
      refresh_token: msg.refresh_token,
      user_email: msg.user_email,
    })
  }

  if (msg.type === 'CLEAR_AUTH') {
    chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email'])
  }
})

// Clear cache when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    flightCache[tabId] = []
    rawPayloadCache[tabId] = []
    chrome.action.setBadgeText({ text: '', tabId })
  }
})

function flightKey(f) {
  return `${f.flightCode || ''}|${f.departureAirport || ''}|${f.arrivalAirport || ''}|${f.departureTime || ''}`
}
