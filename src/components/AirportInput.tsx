'use client'

import { useState, useRef, useEffect } from 'react'
import airportsData from '@/data/airports.json'

type AirportEntry = [string, string, string, ...string[]]
const airports = airportsData as AirportEntry[]

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export default function AirportInput({ value, onChange, placeholder, style }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<AirportEntry[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInput = (val: string) => {
    setQuery(val)
    setHighlightIndex(-1)
    if (val.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    const search = val.toLowerCase()
    const matches = airports.filter(a =>
      a[0].toLowerCase().startsWith(search) ||
      a[1].toLowerCase().includes(search) ||
      (a[2] && a[2].toLowerCase().includes(search))
    ).slice(0, 8)
    setResults(matches)
    setShowDropdown(matches.length > 0)
  }

  const handleSelect = (airport: AirportEntry) => {
    setQuery(airport[0])
    onChange(airport[0])
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

  const handleBlur = () => {
    setTimeout(() => {
      if (query && query !== value) {
        onChange(query.toUpperCase())
      }
    }, 150)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          maxHeight: 240,
          overflowY: 'auto',
          marginTop: 4,
        }}>
          {results.map((airport, i) => (
            <div
              key={airport[0]}
              onMouseDown={() => handleSelect(airport)}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor: highlightIndex === i ? 'var(--primary-light)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'background-color 0.1s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{airport[0]}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>{airport[1]}</span>
                </div>
                {airport[2] && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{airport[2]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}