// Background service worker
// Caches intercepted raw payloads and parsed flights per tab, manages auth token

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id })
})

const flightCache = {}     // tabId -> [flight, ...]
const rawPayloadCache = {} // tabId -> [{ url, payload }, ...]

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'RAW_PAYLOAD') {
    const tabId = sender.tab?.id
    if (!tabId) return
    const existing = rawPayloadCache[tabId] || []
    const alreadyHave = existing.some(p => p.url === msg.url)
    if (!alreadyHave) {
      rawPayloadCache[tabId] = [...existing, { url: msg.url, payload: msg.payload }].slice(-10)
    }

  } else if (msg.type === 'FLIGHTS_DETECTED') {
    const tabId = sender.tab?.id
    if (!tabId) return
    const existing = flightCache[tabId] || []
    const existingKeys = new Set(existing.map(f => flightKey(f)))
    const newFlights = (msg.flights || []).filter(f => !existingKeys.has(flightKey(f)))
    flightCache[tabId] = [...existing, ...newFlights]
    const count = flightCache[tabId].length
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#4338CA', tabId })

  } else if (msg.type === 'GET_RAW_PAYLOADS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) { sendResponse({ payloads: [] }); return }
      sendResponse({ payloads: rawPayloadCache[tabId] || [] })
    })
    return true

  } else if (msg.type === 'GET_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      sendResponse({ flights: flightCache[tabId] || [] })
    })
    return true

  } else if (msg.type === 'STORE_FLIGHTS') {
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

  } else if (msg.type === 'CLEAR_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId) {
        flightCache[tabId] = []
        rawPayloadCache[tabId] = []
        chrome.action.setBadgeText({ text: '', tabId })
      }
    })

  } else if (msg.type === 'GET_AUTH') {
    chrome.storage.local.get(['access_token', 'refresh_token', 'user_email'], (result) => {
      sendResponse(result)
    })
    return true

  } else if (msg.type === 'SET_AUTH') {
    chrome.storage.local.set({
      access_token: msg.access_token,
      refresh_token: msg.refresh_token,
      user_email: msg.user_email,
    })

  } else if (msg.type === 'CLEAR_AUTH') {
    chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email'])
  }
})

// Only clear cache on full page navigations (not SPA route changes)
// We detect real navigations by checking if the URL changes significantly
const tabUrls = {}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    // URL changed — this is a real navigation, clear the cache
    tabUrls[tabId] = changeInfo.url
    flightCache[tabId] = []
    rawPayloadCache[tabId] = []
    chrome.action.setBadgeText({ text: '', tabId })
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  delete flightCache[tabId]
  delete rawPayloadCache[tabId]
  delete tabUrls[tabId]
})

function flightKey(f) {
  // Use route + time for dedup; fallback to airline if no flight code
  const code = f.flightCode || f.airlineName || ''
  const dep = f.departureAirport || ''
  const arr = f.arrivalAirport || ''
  const time = f.departureTime || ''
  const date = f.date || ''
  return `${code}|${dep}|${arr}|${time}|${date}`
}
