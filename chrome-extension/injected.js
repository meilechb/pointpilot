// injected.js — runs in MAIN world (has access to window, page's JS)
// Wraps fetch and XHR to intercept flight data from airline API responses

;(function () {
  if (window.__pointpilotInjected) return
  window.__pointpilotInjected = true

  // ---- Fetch interceptor ----
  const origFetch = window.fetch
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args)
    try {
      const clone = res.clone()
      clone.json().then(data => {
        const flights = extractFlights(data)
        if (flights.length) {
          window.postMessage({ type: 'POINTPILOT_FLIGHTS', flights }, '*')
        }
      }).catch(() => {})
    } catch (_) {}
    return res
  }

  // ---- XHR interceptor ----
  const origOpen = XMLHttpRequest.prototype.open
  const origSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._ppUrl = url
    return origOpen.apply(this, [method, url, ...rest])
  }
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const data = JSON.parse(this.responseText)
        const flights = extractFlights(data)
        if (flights.length) {
          window.postMessage({ type: 'POINTPILOT_FLIGHTS', flights }, '*')
        }
      } catch (_) {}
    })
    return origSend.apply(this, args)
  }

  // ---- Main extraction logic ----
  function extractFlights(data) {
    const results = []
    walk(data, results, 0)
    return dedupe(results)
  }

  function walk(obj, results, depth) {
    if (depth > 12 || !obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      obj.forEach(item => walk(item, results, depth + 1))
      return
    }

    // Try to parse this object as a flight
    const flight = tryParseFlight(obj)
    if (flight) {
      results.push(flight)
      return // don't recurse into a recognized flight object
    }

    Object.values(obj).forEach(v => walk(v, results, depth + 1))
  }

  function tryParseFlight(obj) {
    // Must have at minimum: some airport identifiers and times
    const dep = findField(obj, ['departureAirport', 'departure_airport', 'origin', 'from', 'originCode', 'departureStation', 'dep', 'departureIata', 'originAirportCode'])
    const arr = findField(obj, ['arrivalAirport', 'arrival_airport', 'destination', 'to', 'destinationCode', 'arrivalStation', 'arr', 'arrivalIata', 'destinationAirportCode'])

    if (!dep || !arr) return null

    // Extract airport codes (IATA = 3 letters)
    const depCode = extractIata(dep)
    const arrCode = extractIata(arr)
    if (!depCode || !arrCode || depCode === arrCode) return null

    const depTime = findField(obj, ['departureTime', 'departure_time', 'departureDatetime', 'departureDateTime', 'scheduledDeparture', 'std', 'localDepartureTime', 'departureLocalTime'])
    const arrTime = findField(obj, ['arrivalTime', 'arrival_time', 'arrivalDatetime', 'arrivalDateTime', 'scheduledArrival', 'sta', 'localArrivalTime', 'arrivalLocalTime'])

    const flightNum = findField(obj, ['flightNumber', 'flight_number', 'flightNo', 'flight_no', 'flightCode', 'flightDesignator', 'carrierCode', 'number', 'designator'])
    const airline = findField(obj, ['airlineName', 'airline_name', 'carrier', 'carrierName', 'marketingCarrier', 'operatingCarrier', 'airline', 'airlinecode'])
    const duration = findField(obj, ['duration', 'flightDuration', 'flight_duration', 'travelTime', 'elapsedTime'])
    const stops = findField(obj, ['stops', 'numberOfStops', 'stopCount', 'connections'])

    // Cash price
    const cashPrice = findPrice(obj, ['price', 'amount', 'totalPrice', 'fare', 'totalFare', 'total', 'cost', 'priceAmount', 'totalAmount', 'basePrice'])
    // Points/miles price
    const pointsPrice = findPrice(obj, ['miles', 'points', 'awardMiles', 'rewardMiles', 'pointsRequired', 'milesRequired', 'totalMiles', 'totalPoints', 'awardPoints'])
    // Taxes/fees
    const fees = findPrice(obj, ['taxes', 'fees', 'taxesAndFees', 'surcharges', 'totalTaxes', 'taxAmount'])
    // Cabin class
    const cabin = findField(obj, ['cabin', 'cabinClass', 'cabin_class', 'classOfService', 'bookingClass', 'fareClass', 'serviceClass', 'cabinType'])

    // Need at least a departure airport + arrival airport to be useful
    // Time is optional but strongly preferred
    if (!depCode || !arrCode) return null

    return {
      departureAirport: depCode,
      arrivalAirport: arrCode,
      departureTime: formatTime(depTime),
      arrivalTime: formatTime(arrTime),
      date: extractDate(depTime),
      arrivalDate: extractDate(arrTime),
      flightCode: cleanFlightCode(flightNum),
      airlineName: typeof airline === 'string' ? airline : (airline?.name || airline?.description || null),
      duration: parseDuration(duration),
      stops: typeof stops === 'number' ? stops : (Array.isArray(stops) ? stops.length : null),
      cashAmount: cashPrice,
      pointsAmount: pointsPrice,
      feesAmount: fees,
      cabinClass: typeof cabin === 'string' ? cabin : null,
    }
  }

  function findField(obj, keys) {
    for (const key of keys) {
      // exact match
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
      // case-insensitive match
      const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase())
      if (found && obj[found] !== undefined && obj[found] !== null && obj[found] !== '') return obj[found]
    }
    return null
  }

  function findPrice(obj, keys) {
    const raw = findField(obj, keys)
    if (raw === null || raw === undefined) return null
    if (typeof raw === 'number') return raw
    if (typeof raw === 'string') {
      const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
      return isNaN(n) ? null : n
    }
    if (typeof raw === 'object' && raw !== null) {
      // { amount: 300, currency: 'USD' }
      const amt = raw.amount ?? raw.value ?? raw.total ?? raw.price
      if (amt !== undefined) return typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/[^0-9.]/g, ''))
    }
    return null
  }

  function extractIata(val) {
    if (!val) return null
    if (typeof val === 'string') {
      const upper = val.trim().toUpperCase()
      if (/^[A-Z]{3}$/.test(upper)) return upper
      // Try extracting from longer string like "JFK - John F Kennedy"
      const match = upper.match(/\b([A-Z]{3})\b/)
      return match ? match[1] : null
    }
    if (typeof val === 'object') {
      return extractIata(val.code || val.iata || val.iataCode || val.airportCode || val.id || val.identifier)
    }
    return null
  }

  function formatTime(val) {
    if (!val) return null
    if (typeof val === 'string') {
      // ISO: 2024-12-15T14:30:00
      const m = val.match(/T(\d{2}:\d{2})/)
      if (m) return m[1]
      // Already HH:MM
      if (/^\d{2}:\d{2}/.test(val)) return val.substring(0, 5)
      // HHmm
      if (/^\d{4}$/.test(val)) return `${val.substring(0,2)}:${val.substring(2,4)}`
    }
    return null
  }

  function extractDate(val) {
    if (!val) return null
    if (typeof val === 'string') {
      const m = val.match(/(\d{4}-\d{2}-\d{2})/)
      return m ? m[1] : null
    }
    return null
  }

  function parseDuration(val) {
    if (!val) return null
    if (typeof val === 'number') return val // assume minutes
    if (typeof val === 'string') {
      // "PT2H30M" ISO 8601
      const iso = val.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
      if (iso) return (parseInt(iso[1] || '0') * 60) + parseInt(iso[2] || '0')
      // "2h 30m" or "150"
      const hm = val.match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/)
      if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2] || '0')
      const mins = parseInt(val)
      if (!isNaN(mins)) return mins
    }
    return null
  }

  function cleanFlightCode(val) {
    if (!val) return null
    if (typeof val === 'string') {
      const m = val.trim().toUpperCase().match(/([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)/)
      return m ? m[1].replace(/\s/g, '') : val.trim()
    }
    if (typeof val === 'object') {
      const carrier = val.carrierCode || val.carrier || val.airline || ''
      const num = val.flightNumber || val.number || ''
      if (carrier && num) return `${carrier}${num}`.toUpperCase()
    }
    return null
  }

  function dedupe(flights) {
    const seen = new Set()
    return flights.filter(f => {
      const key = `${f.flightCode}|${f.departureAirport}|${f.arrivalAirport}|${f.departureTime}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
})()
