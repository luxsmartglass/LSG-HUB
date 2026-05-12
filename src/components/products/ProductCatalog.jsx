import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../theme/useTheme'

const DEFAULT_FX = 1.37

function marginColor(pct, c) {
  if (pct >= 50) return c.success
  if (pct >= 30) return c.warning
  return c.danger
}

function CategoryBadge({ label, type, c }) {
  const tone = type === 'film'
    ? { bg: c.highlightSoft, text: c.highlight }
    : type === 'glass'
    ? { bg: c.successSoft, text: c.success }
    : { bg: c.warningSoft, text: c.warning }

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: c.radius.pill,
      fontSize: c.text.xs,
      fontWeight: c.weight.label,
      background: tone.bg,
      color: tone.text,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function ProductCard({ name, sellPrice, sellUnit, costPrice, description, category, categoryType, costNote, c }) {
  const margin = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0

  return (
    <div style={{
      background: c.surface,
      borderRadius: c.radius.lg,
      padding: 20,
      border: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: c.shadowSm,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: 0, lineHeight: 1.3 }}>
          {name}
        </p>
        <CategoryBadge label={category} type={categoryType} c={c} />
      </div>

      <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: 0, lineHeight: c.leading.normal }}>
        {description}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: c.surfaceHover, borderRadius: c.radius.md, padding: '10px 12px' }}>
          <p style={{ color: c.textMuted, fontSize: 10.5, margin: '0 0 3px', fontWeight: c.weight.label, letterSpacing: '0.05em' }}>SELL PRICE</p>
          <p style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: 0 }}>
            ${sellPrice.toFixed(2)}
            <span style={{ fontSize: c.text.xs, color: c.textMuted, fontWeight: 400, marginLeft: 2 }}>{sellUnit}</span>
          </p>
        </div>
        <div style={{ background: c.surfaceHover, borderRadius: c.radius.md, padding: '10px 12px' }}>
          <p style={{ color: c.textMuted, fontSize: 10.5, margin: '0 0 3px', fontWeight: c.weight.label, letterSpacing: '0.05em' }}>COST PRICE</p>
          <p style={{ color: c.textSecondary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: 0 }}>
            ${costPrice.toFixed(2)}
            <span style={{ fontSize: c.text.xs, fontWeight: 400, marginLeft: 2 }}>{sellUnit}</span>
          </p>
        </div>
      </div>

      <div style={{ background: c.surfaceHover, borderRadius: c.radius.md, padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <p style={{ color: c.textMuted, fontSize: 10.5, margin: 0, fontWeight: c.weight.label, letterSpacing: '0.05em' }}>GROSS MARGIN</p>
          <p style={{ color: marginColor(margin, c), fontSize: c.text.base, fontWeight: c.weight.strong, margin: 0 }}>
            {margin.toFixed(1)}%
          </p>
        </div>
        <div style={{ height: 5, background: c.border, borderRadius: 3 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, margin))}%`,
            background: marginColor(margin, c),
            borderRadius: 3,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {costNote && (
        <p style={{ color: c.textMuted, fontSize: c.text.xs, margin: 0, fontStyle: 'italic' }}>{costNote}</p>
      )}
    </div>
  )
}

export default function ProductCatalog() {
  const { c } = useTheme()
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
      color: c.accent,
      fontSize: c.text.sm,
      fontWeight: c.weight.label,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      margin: '0 0 14px',
      paddingBottom: 8,
      borderBottom: `1px solid ${c.border}`,
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
          background: c.surface,
          border: `1px solid ${c.accent}44`,
          borderRadius: c.radius.pill,
          padding: '5px 14px',
          fontSize: c.text.sm,
          color: c.accent,
          fontWeight: c.weight.strong,
          boxShadow: c.shadowSm,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: fxLoading ? c.warning : c.success,
            display: 'inline-block',
          }} />
          FX: {fx.toFixed(2)} CAD/USD
        </span>
        <span style={{ color: c.textMuted, fontSize: c.text.sm }}>
          All costs shown in CAD at current exchange rate
        </span>
      </div>

      {/* Film & Glass */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Film & Glass Products" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filmProducts.map(p => <ProductCard key={p.name} {...p} c={c} />)}
        </div>
      </div>

      {/* Normal Transformers */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Normal Transformers — $189/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {normalTransformers.map(p => <ProductCard key={p.name} {...p} c={c} />)}
        </div>
      </div>

      {/* Dimming Transformers */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Dimming Transformers — $239/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {dimmingTransformers.map(p => <ProductCard key={p.name} {...p} c={c} />)}
        </div>
      </div>

      {/* Multi-Channel */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Multi-Channel Controllers — $239/unit" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {multiChannel.map(p => <ProductCard key={p.name} {...p} c={c} />)}
        </div>
      </div>
    </div>
  )
}
