// Background service worker
// Caches intercepted flights per tab and manages auth token

const flightCache = {} // tabId -> [flight, ...]

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FLIGHTS_DETECTED') {
    const tabId = sender.tab?.id
    if (!tabId) return
    // Merge new flights with existing cache for this tab
    const existing = flightCache[tabId] || []
    const existingKeys = new Set(existing.map(f => flightKey(f)))
    const newFlights = (msg.flights || []).filter(f => !existingKeys.has(flightKey(f)))
    flightCache[tabId] = [...existing, ...newFlights]
    // Update extension badge
    const count = flightCache[tabId].length
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#4338CA', tabId })
  }

  if (msg.type === 'GET_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      sendResponse({ flights: flightCache[tabId] || [] })
    })
    return true // async response
  }

  if (msg.type === 'CLEAR_FLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId) {
        flightCache[tabId] = []
        chrome.action.setBadgeText({ text: '', tabId })
      }
    })
  }

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
    chrome.action.setBadgeText({ text: '', tabId })
  }
})

function flightKey(f) {
  return `${f.flightCode || ''}|${f.departureAirport || ''}|${f.arrivalAirport || ''}|${f.departureTime || ''}`
}
