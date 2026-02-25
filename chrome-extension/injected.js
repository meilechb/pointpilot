// injected.js — runs in MAIN world (has access to window, page's JS)
// Intercepts fetch and XHR responses and forwards raw JSON payloads
// that look like flight data to content.js for AI-powered extraction.

;(function () {
  if (window.__pointpilotInjected) return
  window.__pointpilotInjected = true

  // Store payloads on window so content.js can read them on-demand
  window.__pointpilotPayloads = window.__pointpilotPayloads || []

  const FLIGHT_KEYWORDS = [
    'flight', 'airport', 'depart', 'arriv', 'cabin', 'miles', 'fare',
    'itinerary', 'segment', 'carrier', 'origin', 'destination', 'duration',
    'layover', 'stopover', 'airline', 'iata', 'aircraft',
  ]
  const seenUrls = new Set()

  function looksLikeFlight(text) {
    if (text.length < 200) return false
    let matches = 0
    const lower = text.toLowerCase()
    for (const kw of FLIGHT_KEYWORDS) {
      if (lower.includes(kw)) matches++
      if (matches >= 2) return true
    }
    return false
  }

  function maybeForward(url, jsonString) {
    if (seenUrls.has(url)) return
    if (!looksLikeFlight(jsonString)) return
    seenUrls.add(url)
    // Store on window for on-demand access
    window.__pointpilotPayloads.push({ url, payload: jsonString })
    // Keep only latest 10
    if (window.__pointpilotPayloads.length > 10) window.__pointpilotPayloads.shift()
    // Also post message for immediate forwarding
    window.postMessage({ type: 'POINTPILOT_RAW_PAYLOAD', url, payload: jsonString }, '*')
  }

  // ---- Fetch interceptor ----
  const origFetch = window.fetch
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args)
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '')
      const clone = res.clone()
      clone.text().then(text => {
        try {
          JSON.parse(text) // only forward valid JSON
          maybeForward(url, text)
        } catch (_) {}
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
        const text = this.responseText
        JSON.parse(text) // only forward valid JSON
        maybeForward(this._ppUrl || '', text)
      } catch (_) {}
    })
    return origSend.apply(this, args)
  }

})()
