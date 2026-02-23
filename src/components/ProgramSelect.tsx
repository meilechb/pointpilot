'use client'

import { useState, useRef, useEffect } from 'react'

export type ProgramOption = {
  value: string
  label: string
  detail?: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: ProgramOption[]
  placeholder?: string
  style?: React.CSSProperties
}

export default function ProgramSelect({ value, onChange, options, placeholder, style }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ProgramOption[]>([])
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
    if (val.length === 0) {
      setResults(options.slice(0, 10))
      setShowDropdown(true)
      return
    }
    const search = val.toLowerCase()
    const matches = options.filter(o =>
      o.label.toLowerCase().includes(search) ||
      o.value.toLowerCase().includes(search) ||
      (o.detail && o.detail.toLowerCase().includes(search))
    ).slice(0, 10)
    setResults(matches)
    setShowDropdown(matches.length > 0)
  }

  const handleSelect = (option: ProgramOption) => {
    setQuery(option.value)
    onChange(option.value)
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

  const handleFocus = () => {
    if (query.length === 0) {
      setResults(options.slice(0, 10))
      setShowDropdown(true)
    } else if (results.length > 0) {
      setShowDropdown(true)
    } else {
      handleInput(query)
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={handleFocus}
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
          maxHeight: 260,
          overflowY: 'auto',
          marginTop: 4,
        }}>
          {results.map((option, i) => (
            <div
              key={option.value}
              onMouseDown={() => handleSelect(option)}
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
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{option.label}</span>
                {option.detail && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>{option.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
