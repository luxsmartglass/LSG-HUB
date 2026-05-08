import { useState } from 'react'
import ProductCatalog from './ProductCatalog'
import MarginCalculator from './MarginCalculator'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
}

export default function Products() {
  const [activeTab, setActiveTab] = useState('catalog')

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: COLORS.cream, fontSize: 26, fontWeight: 700, margin: 0 }}>
          Product Catalog
        </h1>
        <p style={{ color: '#8a9bb5', fontSize: 14, margin: '5px 0 0' }}>
          Pricing &amp; Margin Reference
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'inline-flex',
        background: COLORS.navy,
        borderRadius: 10,
        padding: 4,
        marginBottom: 28,
        gap: 2,
      }}>
        {[
          { key: 'catalog', label: 'Catalog' },
          { key: 'margin', label: 'Margin Calculator' },
        ].map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 22px',
                borderRadius: 7,
                border: 'none',
                borderBottom: isActive ? `2px solid ${COLORS.gold}` : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                background: 'transparent',
                color: isActive ? COLORS.gold : '#8a9bb5',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Routed Content */}
      {activeTab === 'catalog' ? <ProductCatalog /> : <MarginCalculator />}
    </div>
  )
}
