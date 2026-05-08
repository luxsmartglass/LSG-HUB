import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
  cardBg: '#162236',
}

const DEFAULT_FX = 1.37

function marginColor(pct) {
  if (pct >= 50) return '#22c55e'
  if (pct >= 30) return '#f59e0b'
  return '#ef4444'
}

function CategoryBadge({ label, type }) {
  const palette = {
    film: { bg: '#1a2f50', text: '#60a5fa' },
    glass: { bg: '#0d2e1a', text: '#4ade80' },
    transformer: { bg: '#2e1f06', text: '#fbbf24' },
  }
  const c = palette[type] || palette.film
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function ProductCard({ name, sellPrice, sellUnit, costPrice, description, category, categoryType, costNote }) {
  const margin = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0

  return (
    <div style={{
      background: COLORS.cardBg,
      borderRadius: 12,
      padding: 20,
      border: '1px solid #1e3352',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ color: COLORS.cream, fontSize: 14.5, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
          {name}
        </p>
        <CategoryBadge label={category} type={categoryType} />
      </div>

      <p style={{ color: '#8a9bb5', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#0f1d35', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ color: '#8a9bb5', fontSize: 10.5, margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.05em' }}>SELL PRICE</p>
          <p style={{ color: COLORS.cream, fontSize: 15, fontWeight: 700, margin: 0 }}>
            ${sellPrice.toFixed(2)}
            <span style={{ fontSize: 11, color: '#8a9bb5', fontWeight: 400, marginLeft: 2 }}>{sellUnit}</span>
          </p>
        </div>
        <div style={{ background: '#0f1d35', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ color: '#8a9bb5', fontSize: 10.5, margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.05em' }}>COST PRICE</p>
          <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 700, margin: 0 }}>
            ${costPrice.toFixed(2)}
            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{sellUnit}</span>
          </p>
        </div>
      </div>

      <div style={{ background: '#0f1d35', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <p style={{ color: '#8a9bb5', fontSize: 10.5, margin: 0, fontWeight: 600, letterSpacing: '0.05em' }}>GROSS MARGIN</p>
          <p style={{ color: marginColor(margin), fontSize: 14, fontWeight: 700, margin: 0 }}>
            {margin.toFixed(1)}%
          </p>
        </div>
        <div style={{ height: 5, background: '#1e3352', borderRadius: 3 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, margin))}%`,
            background: marginColor(margin),
            borderRadius: 3,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {costNote && (
        <p style={{ color: '#637a96', fontSize: 11, margin: 0, fontStyle: 'italic' }}>{costNote}</p>
      )}
    </div>
  )
}

export default function ProductCatalog() {
  const [fx, setFx] = useState(DEFAULT_FX)
  const [fxLoading, setFxLoading] = useState(true)

  useEffect(() => {
    async function loadFx() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'usd_cad_rate')
          .single()
        if (data?.value) setFx(parseFloat(data.value) || DEFAULT_FX)
      } catch {
        // use default
      } finally {
        setFxLoading(false)
      }
    }
    loadFx()
  }, [])

  // Film costs
  const fc1 = 46 * fx   // ≤10 sqm
  const fc2 = 39 * fx   // ≤200 sqm
  const fc3 = 37 * fx   // >200 sqm
  const cc1 = 56 * fx   // colour ≤10
  const cc2 = 49 * fx   // colour >10
  const gc1 = 88 * fx   // glass ≤100
  const gc2 = 78 * fx   // glass >100

  const filmProducts = [
    {
      name: 'Self-Adhesive PDLC Film',
      sellPrice: 700,
      sellUnit: '/sqm',
      costPrice: fc2,
      description: 'Crystal-clear privacy film. Switchable opaque↔transparent. Self-adhesive installation.',
      category: 'Film',
      categoryType: 'film',
      costNote: `≤10sqm: $${fc1.toFixed(0)} · ≤200sqm: $${fc2.toFixed(0)} · >200sqm: $${fc3.toFixed(0)} /sqm`,
    },
    {
      name: 'Colour PDLC Film',
      sellPrice: 700,
      sellUnit: '/sqm',
      costPrice: cc2,
      description: 'Available in custom tints. Premium switchable film for feature installations.',
      category: 'Film',
      categoryType: 'film',
      costNote: `≤10sqm: $${cc1.toFixed(0)} · >10sqm: $${cc2.toFixed(0)} /sqm`,
    },
    {
      name: 'Laminated Smart Glass',
      sellPrice: 1050,
      sellUnit: '/sqm',
      costPrice: gc1,
      description: 'Factory-laminated switchable glass. For saunas, exterior windows, structural glazing.',
      category: 'Glass',
      categoryType: 'glass',
      costNote: `≤100sqm: $${gc1.toFixed(0)} · >100sqm: $${gc2.toFixed(0)} /sqm`,
    },
  ]

  const normalSizes = ['30W', '50W', '100W', '200W', '300W', '500W']
  const normalTransformers = normalSizes.map(size => ({
    name: `Normal ${size} Transformer`,
    sellPrice: 189,
    sellUnit: '/unit',
    costPrice: 46 * fx,
    description: `Standard PWM transformer for PDLC film and glass. ${size} capacity.`,
    category: 'Transformer',
    categoryType: 'transformer',
  }))

  const dimmingTransformers = normalSizes.map(size => ({
    name: `Dimming ${size} Transformer`,
    sellPrice: 239,
    sellUnit: '/unit',
    costPrice: 95 * fx,
    description: `Smooth dimming control for premium PDLC installations. ${size} capacity.`,
    category: 'Transformer',
    categoryType: 'transformer',
  }))

  const multiChannel = [
    {
      name: 'Multi-Channel 6R 100W',
      sellPrice: 239,
      sellUnit: '/unit',
      costPrice: 109 * fx,
      description: 'Independently control up to 6 PDLC zones. 100W total capacity. Ideal for offices and partitions.',
      category: 'Transformer',
      categoryType: 'transformer',
    },
    {
      name: 'Multi-Channel 6R 200W',
      sellPrice: 239,
      sellUnit: '/unit',
      costPrice: 109 * fx,
      description: 'Independently control up to 6 PDLC zones. 200W total capacity. Ideal for larger multi-zone installs.',
      category: 'Transformer',
      categoryType: 'transformer',
    },
  ]

  const SectionHeader = ({ title }) => (
    <h2 style={{
      color: COLORS.gold,
      fontSize: 12.5,
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      margin: '0 0 14px',
      paddingBottom: 8,
      borderBottom: `1px solid #1e3352`,
    }}>
      {title}
    </h2>
  )

  return (
    <div>
      {/* FX Rate Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: COLORS.navy,
          border: `1px solid ${COLORS.gold}55`,
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 12.5,
          color: COLORS.gold,
          fontWeight: 600,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: fxLoading ? '#f59e0b' : '#22c55e',
            display: 'inline-block',
          }} />
          FX: {fx.toFixed(2)} CAD/USD
        </span>
        <span style={{ color: '#637a96', fontSize: 12 }}>
          All costs shown in CAD at current exchange rate
        </span>
      </div>

      {/* Film & Glass */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Film & Glass Products" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filmProducts.map(p => <ProductCard key={p.name} {...p} />)}
        </div>
      </div>

      {/* Normal Transformers */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Normal Transformers — $189/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {normalTransformers.map(p => <ProductCard key={p.name} {...p} />)}
        </div>
      </div>

      {/* Dimming Transformers */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Dimming Transformers — $239/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {dimmingTransformers.map(p => <ProductCard key={p.name} {...p} />)}
        </div>
      </div>

      {/* Multi-Channel */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Multi-Channel Controllers — $239/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {multiChannel.map(p => <ProductCard key={p.name} {...p} />)}
        </div>
      </div>
    </div>
  )
}
