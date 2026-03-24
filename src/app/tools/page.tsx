'use client'

export default function ToolsPage() {
  const tools = [
    {
      title: 'Route Points Advisor',
      description: 'Enter a route and cabin class — see every way to book it with your points, ranked by value. Factors in transfers, bonuses, and surcharges.',
      href: '/tools/route-advisor',
      icon: '🧭',
      color: '#2563eb',
    },
    {
      title: 'Sweet Spots',
      description: 'The best-value redemptions in award travel, personalized to your wallet. See which aspirational trips your points can unlock.',
      href: '/tools/sweet-spots',
      icon: '🎯',
      color: '#d97706',
    },
    {
      title: 'Award Charts',
      description: 'Browse award pricing by program, route, and cabin class. Compare how many points you need across different programs.',
      href: '/tools/award-charts',
      icon: '📊',
      color: '#7c3aed',
    },
    {
      title: 'Transfer Calculator',
      description: 'Find the optimal path to transfer bank points to any airline. Compare transfer ratios, bonuses, and total cost.',
      href: '/tools/transfer-calculator',
      icon: '🔄',
      color: '#059669',
    },
  ]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Travel Rewards Tools</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Calculators and explorers to help you get the most value from your points and miles.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tools.map(tool => (
          <a
            key={tool.href}
            href={tool.href}
            style={{
              display: 'flex', gap: 18, padding: 24,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow)',
              textDecoration: 'none', color: 'inherit',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              backgroundColor: `${tool.color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              {tool.icon}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: tool.color }}>{tool.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tool.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
