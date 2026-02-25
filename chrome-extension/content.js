// content.js — runs in isolated world, bridges injected.js <-> background

// 1. Inject the MAIN world script so it can wrap fetch/XHR before page scripts run
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = () => script.remove()
;(document.head || document.documentElement).prepend(script)

// 2. Forward raw payloads from injected.js to background
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type === 'POINTPILOT_RAW_PAYLOAD') {
    chrome.runtime.sendMessage({
      type: 'RAW_PAYLOAD',
      url: event.data.url,
      payload: event.data.payload,
    })
  }
})

// 3. JSON-LD scraping — runs once after page load (lightweight, accurate where present)
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
