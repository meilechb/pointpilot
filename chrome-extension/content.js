// content.js — runs in isolated world, bridges injected.js <-> background

// 1. Inject the MAIN world script as early as possible
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = () => script.remove()
;(document.head || document.documentElement).prepend(script)

// 2. Forward raw payloads from injected.js to background (real-time)
window.addEventListener('message', (event) => {
  if (event.source !== window) return

  if (event.data?.type === 'POINTPILOT_RAW_PAYLOAD') {
    chrome.runtime.sendMessage({
      type: 'RAW_PAYLOAD',
      url: event.data.url,
      payload: event.data.payload,
    })
  }

  // On-demand dump response: forward all stored payloads to background
  if (event.data?.type === 'POINTPILOT_PAYLOADS_DUMP') {
    const payloads = event.data.payloads || []
    payloads.forEach(({ url, payload }) => {
      chrome.runtime.sendMessage({ type: 'RAW_PAYLOAD', url, payload })
    })
    // Signal done
    chrome.runtime.sendMessage({ type: 'PAYLOADS_DUMP_DONE', count: payloads.length })
  }
})

// 3. Listen for background asking us to do an on-demand dump
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'REQUEST_PAYLOADS_DUMP') {
    window.postMessage({ type: 'POINTPILOT_GET_PAYLOADS' }, '*')
    sendResponse({ ok: true })
  }
})

// 4. JSON-LD scraping — lightweight, accurate where present
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
    chrome.runtime.sendMessage({ type: 'FLIGHTS_DETECTED', flights })
  }
}

if (document.readyState === 'complete') {
  scrapeJsonLd()
} else {
  window.addEventListener('load', scrapeJsonLd)
}
