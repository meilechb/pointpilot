'use client'

import { useState, useRef, useEffect } from 'react'
import airportsData from '@/data/airports.json'

// Format: [iata, name, country, type, cityCode?]
type AirportEntry = [string, string, string, string, string | null]

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export default function AirportInput({ value, onChange, placeholder = 'Airport or city', style }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<AirportEntry[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const search = (q: string) => {
    if (q.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    const lower = q.toLowerCase()
    const matches = (airportsData as AirportEntry[]).filter(([iata, name, country]) =>
      iata.toLowerCase().startsWith(lower) ||
      name.toLowerCase().includes(lower) ||
      (lower.length >= 2 && country.toLowerCase() === lower)
    )

    // Sort: exact IATA match first, then cities, then starts-with, then the rest
    matches.sort((a, b) => {
      const aIata = a[0].toLowerCase()
      const bIata = b[0].toLowerCase()
      const aName = a[1].toLowerCase()
      const bName = b[1].toLowerCase()
      const aType = a[3]
      const bType = b[3]

      if (aIata === lower && bIata !== lower) return -1
      if (bIata === lower && aIata !== lower) return 1

      // Cities before airports when searching by name
      if (aType === 'city' && bType !== 'city' && aName.includes(lower)) return -1
      if (bType === 'city' && aType !== 'city' && bName.includes(lower)) return 1

      if (aIata.startsWith(lower) && !bIata.startsWith(lower)) return -1
      if (bIata.startsWith(lower) && !aIata.startsWith(lower)) return 1

      if (aName.startsWith(lower) && !bName.startsWith(lower)) return -1
      if (bName.startsWith(lower) && !aName.startsWith(lower)) return 1

      return aName.localeCompare(bName)
    })

    setResults(matches.slice(0, 8))
    setShowDropdown(matches.length > 0)
    setHighlightIndex(-1)
  }

  const handleInput = (val: string) => {
    setQuery(val)
    search(val)
    onChange(val.toUpperCase())
  }

  const handleSelect = (entry: AirportEntry) => {
    setQuery(entry[0])
    onChange(entry[0])
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { if (query.length >= 2) search(query) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
      />
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {results.map((entry, i) => (
            <div
              key={`${entry[0]}-${i}`}
              onClick={() => handleSelect(entry)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: i === highlightIndex ? '#f0f0f0' : '#fff',
                borderBottom: i < results.length - 1 ? '1px solid #f5f5f5' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span style={{ fontSize: 14 }}>
                <strong>{entry[0]}</strong>
                <span style={{ color: '#666', marginLeft: 8 }}>{entry[1]}</span>
                {entry[3] === 'city' && <span style={{ color: '#999', marginLeft: 6, fontSize: 12 }}>(all airports)</span>}
              </span>
              <span style={{ color: '#999', fontSize: 12 }}>{entry[2]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}