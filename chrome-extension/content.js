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
  // United layout: cabin headers across the top, flight rows below.
  // Each flight row has departure/arrival times, flight number, duration.
  // Each cabin column cell has a price button.

  // Get cabin column headers (Economy, Economy (fully refundable), Premium Economy, Business)
  const cabinHeaders = []
  document.querySelectorAll('th, [class*="columnHeader"], [class*="ColumnHeader"], [class*="fareColumn"], [class*="FareColumn"]').forEach(el => {
    const text = el.textContent?.trim()
    if (text && text.length < 60 && (
      text.includes('Economy') || text.includes('Business') || text.includes('First') || text.includes('Premium')
    )) {
      cabinHeaders.push({ label: text, index: cabinHeaders.length })
    }
  })

  // Try to find flight rows
  const flightRows = document.querySelectorAll(
    '[class*="FlightCard"], [class*="flightCard"], [class*="flight-row"], [class*="FlightRow"], ' +
    '[class*="ResultRow"], [class*="resultRow"], [class*="segment-row"], [class*="SegmentRow"]'
  )

  flightRows.forEach(row => {
    // Departure + arrival time
    const timeEls = row.querySelectorAll('[class*="time"], [class*="Time"]')
    let depTime = null, arrTime = null, arrDate = null
    timeEls.forEach(el => {
      const txt = el.textContent?.trim()
      if (!txt) return
      // Match "3:20 PM" or "08:55"
      if (/^\d{1,2}:\d{2}/.test(txt) || /\d{1,2}:\d{2}\s*(AM|PM)/i.test(txt)) {
        if (!depTime) depTime = txt
        else if (!arrTime) arrTime = txt
      }
    })

    // "Arrives Apr 25" text
    const arrivalDateEl = row.querySelector('[class*="arrivalDate"], [class*="ArrivalDate"], [class*="arrives"], [class*="Arrives"]')
    if (arrivalDateEl) arrDate = arrivalDateEl.textContent?.trim() || null

    // Flight number — look for "UA 84" pattern
    let flightCode = null
    const codeEl = row.querySelector('[class*="flightNumber"], [class*="FlightNumber"], [class*="operatedBy"]')
    if (codeEl) {
      const match = codeEl.textContent?.match(/([A-Z]{2}\s?\d+)/)
      if (match) flightCode = match[1].replace(/\s/, '')
    }
    if (!flightCode) {
      // scan all text in row for flight code pattern
      const text = row.textContent || ''
      const match = text.match(/\b(UA|DL|AA|AS|B6|WN|F9)\s?(\d{1,4})\b/)
      if (match) flightCode = match[1] + match[2]
    }

    // Duration "10H, 35M"
    let duration = null
    const durEl = row.querySelector('[class*="duration"], [class*="Duration"], [class*="travelTime"]')
    if (durEl) {
      const txt = durEl.textContent?.trim() || ''
      const m = txt.match(/(\d+)\s*H[,\s]*(\d+)\s*M/i) || txt.match(/(\d+)h\s*(\d+)m/i)
      if (m) duration = parseInt(m[1]) * 60 + parseInt(m[2])
    }

    // Airports — look for 3-letter codes
    const airports = []
    row.querySelectorAll('[class*="airport"], [class*="Airport"], [class*="station"], [class*="Station"]').forEach(el => {
      const txt = el.textContent?.trim()
      if (txt && /^[A-Z]{3}$/.test(txt)) airports.push(txt)
    })
    // Fallback: scan text for IATA codes near times
    if (airports.length < 2) {
      const text = row.textContent || ''
      const matches = text.match(/\b(EWR|JFK|LGA|LAX|SFO|ORD|DEN|IAH|IAD|TLV|LHR|CDG|FRA|AMS|DXB|NRT|HND|SYD|MEL|YYZ|YVR|MIA|ATL|BOS|SEA|DFW|PHX|MSP|DTW|CLT|PHL)\b/g)
      if (matches && matches.length >= 2) {
        airports.push(matches[0], matches[matches.length - 1])
      }
    }

    if (!depTime && airports.length < 2) return // not a real flight row

    // Cabin prices in this row
    // Look for price cells (each cabin column has a price)
    const priceCells = row.querySelectorAll(
      '[class*="price"], [class*="Price"], [class*="fare"], [class*="Fare"], ' +
      'td[class*="cabin"], td[class*="Cabin"], button[class*="select"], button[class*="Select"]'
    )

    const pricingTiers = []
    const cabins = ['Economy', 'Economy (Refundable)', 'Premium Economy', 'Business', 'First']

    priceCells.forEach((cell, i) => {
      const txt = cell.textContent?.trim() || ''
      // Look for dollar amounts
      const cashMatch = txt.match(/\$\s?([\d,]+)/)
      // Look for miles/points
      const milesMatch = txt.match(/([\d,]+)\s*(miles|pts|points|mi\b)/i)

      if (cashMatch || milesMatch) {
        const cabinLabel = cabinHeaders[i]?.label || cabins[i] || `Option ${i + 1}`
        pricingTiers.push({
          id: crypto.randomUUID(),
          label: cabinLabel,
          paymentType: milesMatch && !cashMatch ? 'points' : 'cash',
          cashAmount: cashMatch ? parseFloat(cashMatch[1].replace(/,/g, '')) : null,
          pointsAmount: milesMatch ? parseFloat(milesMatch[1].replace(/,/g, '')) : null,
          feesAmount: null,
        })
      }
    })

    // Also try reading from the visible price columns directly (United's grid)
    // United shows prices as sibling elements to the flight row in a table/grid
    if (pricingTiers.length === 0) {
      // Look for any $ amounts in the row
      const allText = row.textContent || ''
      const priceMatches = [...allText.matchAll(/\$([\d,]+)/g)]
      priceMatches.forEach((m, i) => {
        const amount = parseFloat(m[1].replace(/,/g, ''))
        if (amount > 0) {
          pricingTiers.push({
            id: crypto.randomUUID(),
            label: cabins[i] || `Option ${i + 1}`,
            paymentType: 'cash',
            cashAmount: amount,
            pointsAmount: null,
            feesAmount: null,
          })
        }
      })
    }

    const primaryTier = pricingTiers[0]
    flights.push({
      flightCode: flightCode || null,
      airlineName: 'United Airlines',
      departureAirport: airports[0] || null,
      arrivalAirport: airports[1] || null,
      departureTime: depTime,
      arrivalTime: arrTime,
      date: null,
      arrivalDate: arrDate,
      duration,
      stops: row.textContent?.toLowerCase().includes('nonstop') ? 0 : null,
      cashAmount: primaryTier?.paymentType === 'cash' ? primaryTier?.cashAmount : null,
      pointsAmount: primaryTier?.paymentType === 'points' ? primaryTier?.pointsAmount : null,
      feesAmount: null,
      cabinClass: primaryTier?.label || null,
      pricingTiers: pricingTiers.length > 1 ? pricingTiers : [],
    })
  })

  // Fallback: try reading the price grid separately if rows weren't found
  if (flights.length === 0) {
    // Read cabin columns from the page header
    const cabinCols = []
    document.querySelectorAll('[class*="cabinTitle"], [class*="CabinTitle"], thead th, [role="columnheader"]').forEach(el => {
      const txt = el.textContent?.trim()
      if (txt && (txt.includes('Economy') || txt.includes('Business') || txt.includes('First') || txt.includes('Premium'))) {
        cabinCols.push(txt)
      }
    })

    // Find each flight result block
    document.querySelectorAll('[class*="result"]:not([class*="results"]), [class*="Result"]:not([class*="Results"])').forEach(block => {
      const times = []
      block.querySelectorAll('[class*="time"], [class*="Time"]').forEach(el => {
        const txt = el.textContent?.trim()
        if (txt && /\d{1,2}:\d{2}/.test(txt)) times.push(txt)
      })

      const priceEls = block.querySelectorAll('[class*="price"], [class*="Price"]')
      const pricingTiers = []
      priceEls.forEach((el, i) => {
        const txt = el.textContent?.trim() || ''
        const m = txt.match(/\$([\d,]+)/)
        if (m) {
          pricingTiers.push({
            id: crypto.randomUUID(),
            label: cabinCols[i] || cabins[i] || `Option ${i+1}`,
            paymentType: 'cash',
            cashAmount: parseFloat(m[1].replace(/,/g, '')),
            pointsAmount: null,
            feesAmount: null,
          })
        }
      })

      // Look for airport codes
      const text = block.textContent || ''
      const airportMatches = text.match(/\b([A-Z]{3})\b.*?\b([A-Z]{3})\b/)

      if (times.length >= 2 && pricingTiers.length > 0) {
        flights.push({
          flightCode: text.match(/\b(UA\d+)\b/)?.[1] || null,
          airlineName: 'United Airlines',
          departureAirport: airportMatches?.[1] || null,
          arrivalAirport: airportMatches?.[2] || null,
          departureTime: times[0],
          arrivalTime: times[times.length - 1],
          date: null,
          arrivalDate: null,
          duration: null,
          stops: text.toLowerCase().includes('nonstop') ? 0 : null,
          cashAmount: pricingTiers[0]?.cashAmount || null,
          pointsAmount: null,
          feesAmount: null,
          cabinClass: pricingTiers[0]?.label || null,
          pricingTiers: pricingTiers.length > 1 ? pricingTiers : [],
        })
      }
    })
  }
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
