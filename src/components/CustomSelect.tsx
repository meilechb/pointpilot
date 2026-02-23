'use client'

import { useState, useRef, useEffect } from 'react'

type Option = {
  value: string | number
  label: string
}

type Props = {
  options: Option[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
}

export default function CustomSelect({ options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          height: 42,
          padding: '10px 32px 10px 12px',
          fontSize: 14,
          color: selected ? 'var(--text)' : 'var(--text-muted)',
          backgroundColor: 'var(--bg-input)',
          border: open ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(67, 56, 202, 0.1)' : 'none',
          position: 'relative',
          userSelect: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {selected?.label || placeholder || 'Select...'}
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            transition: 'transform 0.15s',
          }}
        >
          <path d="M2 4L6 8L10 4" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {options.map((option, i) => (
            <div
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              style={{
                padding: '10px 12px',
                fontSize: 14,
                cursor: 'pointer',
                backgroundColor: option.value === value ? 'var(--primary-light)' : 'transparent',
                color: option.value === value ? 'var(--primary)' : 'var(--text)',
                fontWeight: option.value === value ? 600 : 400,
                borderBottom: i < options.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = option.value === value ? 'var(--primary-light)' : 'transparent'
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}