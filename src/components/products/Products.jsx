import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'
import { SegmentedControl } from '../ui/Tabs'
import ProductCatalog from './ProductCatalog'
import MarginCalculator from './MarginCalculator'

export default function Products() {
  const { c } = useTheme()
  const [activeTab, setActiveTab] = useState('catalog')

  return (
    <div className="fade-up" style={{ minHeight: '100vh', background: c.bg, padding: '32px 24px', fontFamily: c.font.body }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: c.textPrimary, fontSize: c.text['2xl'], fontWeight: c.weight.hero, margin: 0, fontFamily: c.font.heading }}>
          Product Catalog
        </h1>
        <p style={{ color: c.textMuted, fontSize: c.text.base, margin: '5px 0 0' }}>
          Pricing &amp; Margin Reference
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ marginBottom: 28 }}>
        <SegmentedControl
          options={[
            { key: 'catalog', label: 'Catalog' },
            { key: 'margin', label: 'Margin Calculator' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Routed Content */}
      {activeTab === 'catalog' ? <ProductCatalog /> : <MarginCalculator />}
    </div>
  )
}
