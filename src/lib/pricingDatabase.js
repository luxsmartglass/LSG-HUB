// Exchange rate - default, overridden by Supabase settings
export const DEFAULT_FX = 1.37;

// Product types
export const ZONE_TYPES = [
  { label: 'Sauna', product: 'Laminated Glass', type: 'glass' },
  { label: 'Shower / Wet Room', product: 'Self-Adhesive Film', type: 'film' },
  { label: 'Window (Interior)', product: 'Self-Adhesive Film', type: 'film' },
  { label: 'Window (Exterior)', product: 'Laminated Glass', type: 'glass' },
  { label: 'Glass Partition', product: 'Self-Adhesive Film', type: 'film' },
  { label: 'Glass Door', product: 'Self-Adhesive Film', type: 'film' },
  { label: 'Boardroom / Office', product: 'Self-Adhesive Film', type: 'film' },
  { label: 'Feature Wall', product: 'Colour PDLC Film', type: 'film-colour' },
  { label: 'Other', product: 'Self-Adhesive Film', type: 'film' },
];

export function zoneProductType(label) {
  return ZONE_TYPES.find(z => z.label === label)?.type || 'film';
}

export function zoneProduct(label) {
  return ZONE_TYPES.find(z => z.label === label)?.product || 'Self-Adhesive Film';
}

export function filmCostPerSqm(sqm, type = 'film', fx = DEFAULT_FX) {
  if (type === 'film-colour') return sqm <= 10 ? 56 * fx : 49 * fx;
  if (sqm <= 10) return 46 * fx;
  if (sqm <= 200) return 39 * fx;
  return 37 * fx;
}

export function glassCostPerSqm(sqm, fx = DEFAULT_FX) {
  return sqm <= 100 ? 88 * fx : 78 * fx;
}

export function getTransformers(zones, useDimming) {
  const totalSqm = zones.reduce((a, z) => a + (parseFloat(z.sqm) || 0), 0);
  const numZones = zones.length;
  if (!numZones) return { units: [], recTotal: 0, reason: 'No zones added yet.', comparison: null };

  const glassZones = zones.filter(z => zoneProductType(z.type) === 'glass');
  const filmZones = zones.filter(z => zoneProductType(z.type) !== 'glass');
  const hasGlass = glassZones.length > 0;
  const hasFilm = filmZones.length > 0;

  const dimPrice = 239;
  const normalPrice = 189;
  let units = [];
  let reason = '';

  function pickSize(sqm) {
    if (sqm <= 3) return '30W';
    if (sqm <= 6) return '50W';
    if (sqm <= 12) return '100W';
    if (sqm <= 22) return '200W';
    if (sqm <= 32) return '300W';
    return '500W';
  }

  if (numZones === 1) {
    const size = pickSize(totalSqm);
    const name = useDimming ? `Dimming ${size}` : `Normal ${size}`;
    units = [{ name, qty: 1, sell: useDimming ? dimPrice : normalPrice }];
    reason = `Single zone (${totalSqm.toFixed(1)} sqm) → ${name}.`;
  } else if (hasGlass && hasFilm && totalSqm > 22) {
    const glassUnits = glassZones.map(z => {
      const size = pickSize(parseFloat(z.sqm) || 0);
      return { name: useDimming ? `Dimming ${size}` : `Normal ${size}`, qty: 1, sell: useDimming ? dimPrice : normalPrice };
    });
    const filmTotal = filmZones.reduce((a, z) => a + (parseFloat(z.sqm) || 0), 0);
    const mcName = filmTotal <= 12 ? 'Multi-Channel 6R 100W' : 'Multi-Channel 6R 200W';
    units = [...glassUnits, { name: mcName, qty: 1, sell: dimPrice }];
    reason = `Mixed glass+film >22 sqm: individual transformers for glass, ${mcName} for film.`;
  } else if (numZones >= 2) {
    if (totalSqm <= 12) {
      units = [{ name: useDimming ? 'Dimming 100W (Multi)' : 'Multi-Channel 6R 100W', qty: 1, sell: dimPrice }];
      reason = `${numZones} zones ≤12 sqm → Multi-Channel 6R 100W.`;
    } else if (totalSqm <= 22) {
      units = [{ name: useDimming ? 'Dimming 200W (Multi)' : 'Multi-Channel 6R 200W', qty: 1, sell: dimPrice }];
      reason = `${numZones} zones ≤22 sqm → Multi-Channel 6R 200W.`;
    } else {
      const size = pickSize(totalSqm / numZones);
      const name = useDimming ? `Dimming ${size}` : `Normal ${size}`;
      units = [{ name, qty: numZones, sell: useDimming ? dimPrice : normalPrice }];
      reason = `${numZones} zones, ${totalSqm.toFixed(1)} sqm → ${name} per zone.`;
    }
  }

  const recTotal = units.reduce((a, u) => a + u.sell * u.qty, 0);
  let indivTotal = 0;
  if (numZones > 1) zones.forEach(() => (indivTotal += normalPrice));
  const savings = indivTotal - recTotal;
  const comparison = savings > 0 ? `Saves $${savings} CAD vs ${numZones} individual Normal transformers ($${indivTotal}).` : null;

  return { units, recTotal, reason, comparison };
}

export function calcShipping(zones) {
  const totalSqm = zones.reduce((a, z) => a + (parseFloat(z.sqm) || 0), 0);
  const hasGlass = zones.some(z => zoneProductType(z.type) === 'glass');
  let base = totalSqm <= 10 ? 322 : totalSqm <= 25 ? 483 : totalSqm <= 50 ? 748 : 1093;
  if (hasGlass) base += 138;
  return base;
}

export function calcQuote(w, settings = {}) {
  const fx = settings.usd_cad_rate ? parseFloat(settings.usd_cad_rate) : DEFAULT_FX;
  const zones = w.zones || [];
  const complexity = parseFloat(w.complexity) || 1.0;

  let filmSqm = 0, glassSqm = 0, colourFilmSqm = 0;
  zones.forEach(z => {
    const sqm = parseFloat(z.sqm) || 0;
    const t = zoneProductType(z.type);
    if (t === 'glass') glassSqm += sqm;
    else if (t === 'film-colour') colourFilmSqm += sqm;
    else filmSqm += sqm;
  });
  const totalSqm = filmSqm + glassSqm + colourFilmSqm;

  const filmSell = parseFloat(w.film_price || w.filmPrice) || 700;
  const glassSell = parseFloat(w.glass_price || w.glassPrice) || 1050;
  const installRate = parseFloat(w.install_rate || w.installRate) || 40;

  let filmRev = (filmSqm + colourFilmSqm) * filmSell;
  let glassRev = glassSqm * glassSell;
  let installRev = totalSqm * installRate * complexity;

  const tf = getTransformers(zones, w.use_dimming || w.useDimming);
  const tfSell = tf.recTotal;

  let subRev = filmRev + glassRev + installRev;
  if ((w.discount || w.discountEnabled) && w.discount_pct > 0) {
    const d = 1 - (parseFloat(w.discount_pct) || 0) / 100;
    subRev *= d; filmRev *= d; glassRev *= d; installRev *= d;
  }

  const elecRev = (w.incl_electrician || w.inclElec) ? 977 : 0;
  const shipping = calcShipping(zones);
  const totalRev = subRev + tfSell + elecRev + shipping;

  const filmCost = filmSqm * filmCostPerSqm(filmSqm, 'film', fx) + colourFilmSqm * filmCostPerSqm(colourFilmSqm, 'film-colour', fx);
  const glassCost = glassSqm * glassCostPerSqm(glassSqm, fx);
  const tfCost = tf.units.reduce((a, u) => {
    const approxUSD = u.sell === 239 ? 145 : 46;
    return a + approxUSD * fx * u.qty;
  }, 0);
  const totalCost = filmCost + glassCost + tfCost + shipping + elecRev;
  const netMargin = totalRev - totalCost;
  const marginPct = totalRev > 0 ? (netMargin / totalRev) * 100 : 0;

  return { filmRev, glassRev, installRev, tfSell, elecRev, shipping, filmCost, glassCost, tfCost, totalRev, totalCost, netMargin, marginPct, totalSqm, filmSqm, glassSqm, colourFilmSqm, tf, zones };
}

export const PIPELINE_STAGES = [
  { id: 'new_lead', label: 'New Lead', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  { id: 'first_contact', label: 'First Contact Made', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'warm_hold', label: 'WARM HOLD', color: '#a8883c', bg: '#fef8ec', border: '#c9a84c', warm: true, subtitle: 'Architects & Designers — No Active Project Yet', tooltip: 'These contacts are warm but have no active project. Follow up every 60 days.' },
  { id: 'discovery_booked', label: 'Discovery Call Booked', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'discovery_done', label: 'Discovery Call Done', color: '#5b21b6', bg: '#ede9fe', border: '#c4b5fd' },
  { id: 'estimate_sent', label: 'Estimate Sent', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'negotiating', label: 'Negotiating', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'signed', label: 'Contract Signed', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'install_sched', label: 'Install Scheduled', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'install_done', label: 'Install Complete', color: '#a8883c', bg: '#fef8ec', border: '#c9a84c' },
  { id: 'won', label: 'Won / Closed', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { id: 'on_hold', label: 'On Hold', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', muted: true },
  { id: 'lost', label: 'Lost', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', muted: true },
];
