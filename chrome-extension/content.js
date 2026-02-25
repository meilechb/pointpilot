// content.js — runs in isolated world, bridges injected.js <-> background

// 1. Inject the MAIN world script as early as possible
// Use document.documentElement (always available at document_start) not document.head
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = () => script.remove()
document.documentElement.prepend(script)

// 2. Forward raw payloads from injected.js to background (real-time)
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type === 'POINTPILOT_RAW_PAYLOAD') {
    try {
      chrome.runtime.sendMessage({
        type: 'RAW_PAYLOAD',
        url: event.data.url,
        payload: event.data.payload,
      })
    } catch (_) {
      // Extension context invalidated (e.g. extension reloaded) — ignore
    }
  }
})

// 3. JSON-LD scraping — runs once on load, then watches for dynamic inserts
function scrapeJsonLd() {
  const flights = []
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
    try {
      const data = JSON.parse(el.textContent)
      const items = Array.isArray(data) ? data : [data]
      items.forEach(item => {
        if (item['@type'] === 'Flight' || item['@type'] === 'FlightReservation') {
          const f = item['@type'] === 'FlightReservation' ? item.reservationFor : item
          if (f && f.departureAirport && f.arrivalAirport) {
            flights.push({
              flightCode: f.flightNumber || null,
              airlineName: f.provider?.name || f.airline?.name || null,
              departureAirport: f.departureAirport?.iataCode || f.departureAirport?.name || null,
              arrivalAirport: f.arrivalAirport?.iataCode || f.arrivalAirport?.name || null,
              departureTime: f.departureTime ? f.departureTime.substring(11, 16) : null,
              arrivalTime: f.arrivalTime ? f.arrivalTime.substring(11, 16) : null,
              date: f.departureTime ? f.departureTime.substring(0, 10) : null,
              arrivalDate: f.arrivalTime ? f.arrivalTime.substring(0, 10) : null,
              duration: null,
              stops: null,
              cashAmount: null,
              pointsAmount: null,
              feesAmount: null,
              cabinClass: null,
              pricingTiers: [],
            })
          }
        }
      })
    } catch (_) {}
  })
  if (flights.length > 0) {
    try {
      chrome.runtime.sendMessage({ type: 'FLIGHTS_DETECTED', flights })
    } catch (_) {}
  }
}

// Run after page load and watch for dynamic JSON-LD inserts
if (document.readyState === 'complete') {
  scrapeJsonLd()
} else {
  window.addEventListener('load', scrapeJsonLd)
}

// Watch for dynamically inserted JSON-LD script tags
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeName === 'SCRIPT' && node.type === 'application/ld+json') {
        scrapeJsonLd()
        return
      }
    }
  }
})
observer.observe(document.documentElement, { childList: true, subtree: true })
