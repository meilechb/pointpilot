// content.js — runs in isolated world, bridges injected.js <-> background

// 1. Inject the MAIN world script so it can wrap fetch/XHR before page scripts run
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = () => script.remove()
;(document.head || document.documentElement).prepend(script)

// 2. Listen for flights detected by injected.js
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type === 'POINTPILOT_FLIGHTS') {
    chrome.runtime.sendMessage({
      type: 'FLIGHTS_DETECTED',
      flights: event.data.flights,
    })
  }
})

// 3. Also scrape JSON-LD and DOM when page finishes loading
function scrapePageFlights() {
  const flights = []

  // --- JSON-LD ---
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
    try {
      const data = JSON.parse(el.textContent)
      const items = Array.isArray(data) ? data : [data]
      items.forEach(item => {
        if (item['@type'] === 'Flight' || item['@type'] === 'FlightReservation') {
          const f = item['@type'] === 'FlightReservation' ? item.reservationFor : item
          if (f) {
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
              cashAmount: null,
              pointsAmount: null,
              feesAmount: null,
              cabinClass: null,
            })
          }
        }
      })
    } catch (_) {}
  })

  // --- Per-site DOM scraping ---
  const host = window.location.hostname

  if (host.includes('google.com/travel/flights') || host.includes('flights.google.com')) {
    scrapeGoogleFlights(flights)
  } else if (host.includes('united.com')) {
    scrapeUnited(flights)
  } else if (host.includes('delta.com')) {
    scrapeDelta(flights)
  } else if (host.includes('aa.com') || host.includes('americanairlines.com')) {
    scrapeAA(flights)
  } else if (host.includes('virginatlantic.com')) {
    scrapeVirginAtlantic(flights)
  }

  if (flights.length > 0) {
    chrome.runtime.sendMessage({ type: 'FLIGHTS_DETECTED', flights })
  }
}

function scrapeGoogleFlights(flights) {
  document.querySelectorAll('[data-flight-leg]').forEach(el => {
    // Try various possible selectors
    const airline = el.querySelector('.sSHqwe, [data-gs*="airline"]')?.textContent?.trim()
    const times = el.querySelectorAll('.wtdjmc, [aria-label*="Departure time"], [aria-label*="Arrival time"]')
    const price = el.querySelector('.YMlIz, .FpEdX span, [data-gs*="price"]')?.textContent?.trim()
    const airports = el.querySelectorAll('.G2WY5c, .iata-code, [data-gs*="airport"]')

    if (airports.length >= 2) {
      flights.push({
        flightCode: el.querySelector('.Ir0Voe, .flight-code')?.textContent?.trim() || null,
        airlineName: airline || null,
        departureAirport: airports[0]?.textContent?.trim()?.substring(0, 3) || null,
        arrivalAirport: airports[1]?.textContent?.trim()?.substring(0, 3) || null,
        departureTime: times[0]?.textContent?.trim() || null,
        arrivalTime: times[1]?.textContent?.trim() || null,
        date: null,
        arrivalDate: null,
        duration: el.querySelector('.gvkrdb, .duration')?.textContent?.trim() || null,
        cashAmount: price ? parseFloat(price.replace(/[^0-9.]/g, '')) || null : null,
        pointsAmount: null,
        feesAmount: null,
        cabinClass: el.querySelector('.N872Rd, .cabin-class')?.textContent?.trim() || null,
      })
    }
  })
}

function scrapeUnited(flights) {
  document.querySelectorAll('.app-components-Shopping-FlightResult--FlightResult, .flight-result-item').forEach(el => {
    const code = el.querySelector('.app-components-Shopping-FlightNumber--flightNumber, .flight-number')?.textContent?.trim()
    const airports = el.querySelectorAll('.app-components-Airport-AirportCode--code, .airport-code')
    const times = el.querySelectorAll('.app-components-TimeLine-TimeLine--time, .flight-time')
    const cashEl = el.querySelector('.app-components-Shopping-PriceBreakdown--price, .price-amount')
    const pointsEl = el.querySelector('.miles-amount, .award-miles')

    if (airports.length >= 2) {
      flights.push({
        flightCode: code || null,
        airlineName: 'United Airlines',
        departureAirport: airports[0]?.textContent?.trim() || null,
        arrivalAirport: airports[airports.length - 1]?.textContent?.trim() || null,
        departureTime: times[0]?.textContent?.trim() || null,
        arrivalTime: times[times.length - 1]?.textContent?.trim() || null,
        date: null,
        arrivalDate: null,
        duration: null,
        cashAmount: cashEl ? parseFloat(cashEl.textContent.replace(/[^0-9.]/g, '')) || null : null,
        pointsAmount: pointsEl ? parseFloat(pointsEl.textContent.replace(/[^0-9]/g, '')) || null : null,
        feesAmount: null,
        cabinClass: el.querySelector('.cabin-class, .fare-name')?.textContent?.trim() || null,
      })
    }
  })
}

function scrapeDelta(flights) {
  document.querySelectorAll('.flight-result, .fare-offer-card').forEach(el => {
    const airports = el.querySelectorAll('.airport-code, .iata')
    const times = el.querySelectorAll('.departure-time, .arrival-time, .time')
    const price = el.querySelector('.fare-price, .price')?.textContent?.trim()
    const miles = el.querySelector('.miles, .award-miles, .fare-miles')?.textContent?.trim()

    if (airports.length >= 2) {
      flights.push({
        flightCode: el.querySelector('.flight-number, .flight-code')?.textContent?.trim() || null,
        airlineName: 'Delta Air Lines',
        departureAirport: airports[0]?.textContent?.trim() || null,
        arrivalAirport: airports[airports.length - 1]?.textContent?.trim() || null,
        departureTime: times[0]?.textContent?.trim() || null,
        arrivalTime: times[times.length - 1]?.textContent?.trim() || null,
        date: null,
        arrivalDate: null,
        duration: el.querySelector('.duration, .travel-time')?.textContent?.trim() || null,
        cashAmount: price ? parseFloat(price.replace(/[^0-9.]/g, '')) || null : null,
        pointsAmount: miles ? parseFloat(miles.replace(/[^0-9]/g, '')) || null : null,
        feesAmount: null,
        cabinClass: el.querySelector('.cabin, .cabin-class')?.textContent?.trim() || null,
      })
    }
  })
}

function scrapeAA(flights) {
  document.querySelectorAll('.flight-segment, .slice-detail, .flight-result').forEach(el => {
    const airports = el.querySelectorAll('.airport, .city-code, .iata-code')
    const times = el.querySelectorAll('.time, .departure, .arrival')
    const price = el.querySelector('.price, .amount')?.textContent?.trim()
    const miles = el.querySelector('.miles, .points, .award')?.textContent?.trim()

    if (airports.length >= 2) {
      flights.push({
        flightCode: el.querySelector('.flight-number, .flight-code')?.textContent?.trim() || null,
        airlineName: 'American Airlines',
        departureAirport: airports[0]?.textContent?.trim() || null,
        arrivalAirport: airports[airports.length - 1]?.textContent?.trim() || null,
        departureTime: times[0]?.textContent?.trim() || null,
        arrivalTime: times[times.length - 1]?.textContent?.trim() || null,
        date: null,
        arrivalDate: null,
        duration: el.querySelector('.duration, .travel-time')?.textContent?.trim() || null,
        cashAmount: price ? parseFloat(price.replace(/[^0-9.]/g, '')) || null : null,
        pointsAmount: miles ? parseFloat(miles.replace(/[^0-9]/g, '')) || null : null,
        feesAmount: null,
        cabinClass: el.querySelector('.cabin, .cabin-class, .brand')?.textContent?.trim() || null,
      })
    }
  })
}

function scrapeVirginAtlantic(flights) {
  document.querySelectorAll('.flight-result, .result-item, [class*="FlightResult"]').forEach(el => {
    const airports = el.querySelectorAll('[class*="airport"], [class*="Airport"], .iata')
    const times = el.querySelectorAll('[class*="time"], [class*="Time"]')
    const miles = el.querySelector('[class*="miles"], [class*="Miles"], [class*="points"]')?.textContent?.trim()
    const price = el.querySelector('[class*="price"], [class*="Price"]')?.textContent?.trim()
    const taxes = el.querySelector('[class*="tax"], [class*="Tax"], [class*="fee"]')?.textContent?.trim()

    if (airports.length >= 2) {
      flights.push({
        flightCode: el.querySelector('[class*="flightNumber"], [class*="FlightNumber"]')?.textContent?.trim() || null,
        airlineName: 'Virgin Atlantic',
        departureAirport: airports[0]?.textContent?.trim()?.substring(0, 3) || null,
        arrivalAirport: airports[airports.length - 1]?.textContent?.trim()?.substring(0, 3) || null,
        departureTime: times[0]?.textContent?.trim() || null,
        arrivalTime: times[times.length - 1]?.textContent?.trim() || null,
        date: null,
        arrivalDate: null,
        duration: el.querySelector('[class*="duration"], [class*="Duration"]')?.textContent?.trim() || null,
        cashAmount: price ? parseFloat(price.replace(/[^0-9.]/g, '')) || null : null,
        pointsAmount: miles ? parseFloat(miles.replace(/[^0-9]/g, '')) || null : null,
        feesAmount: taxes ? parseFloat(taxes.replace(/[^0-9.]/g, '')) || null : null,
        cabinClass: el.querySelector('[class*="cabin"], [class*="Cabin"], [class*="class"]')?.textContent?.trim() || null,
      })
    }
  })
}

// Run after page loads
if (document.readyState === 'complete') {
  setTimeout(scrapePageFlights, 2000)
} else {
  window.addEventListener('load', () => setTimeout(scrapePageFlights, 2000))
}

// Also re-scrape on dynamic content changes (SPAs)
let scrapeTimer = null
const observer = new MutationObserver(() => {
  clearTimeout(scrapeTimer)
  scrapeTimer = setTimeout(scrapePageFlights, 1500)
})
observer.observe(document.body, { childList: true, subtree: true })
