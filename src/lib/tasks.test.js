import { describe, it, expect } from 'vitest'
import { carriedOverDays, partitionTodayTasks, sortOpenTasks, URGENCY_ORDER } from './tasks'

const T = (over) => ({ id: Math.random().toString(36), title:'x', urgency:'medium', due_date:'2026-05-12', completed:false, completed_at:null, ...over })
const TODAY = '2026-05-12'

describe('carriedOverDays', () => {
  it('0 when due today or future', () => {
    expect(carriedOverDays(T({ due_date:'2026-05-12' }), TODAY)).toBe(0)
    expect(carriedOverDays(T({ due_date:'2026-05-20' }), TODAY)).toBe(0)
  })
  it('counts days when overdue', () => {
    expect(carriedOverDays(T({ due_date:'2026-05-10' }), TODAY)).toBe(2)
  })
})

describe('partitionTodayTasks', () => {
  it('open = incomplete with due_date <= today; future not included', () => {
    const open1 = T({ due_date:'2026-05-12' })
    const carried = T({ due_date:'2026-05-09' })
    const future = T({ due_date:'2026-05-15' })
    const doneToday = T({ completed:true, completed_at:'2026-05-12T10:00:00Z' })
    const donePast = T({ completed:true, completed_at:'2026-05-10T10:00:00Z' })
    const { open, doneToday: dt, hidden } = partitionTodayTasks([open1, carried, future, doneToday, donePast], TODAY)
    expect(open.map(t=>t.id)).toEqual(expect.arrayContaining([open1.id, carried.id]))
    expect(open).toHaveLength(2)
    expect(dt.map(t=>t.id)).toEqual([doneToday.id])
    expect(hidden.map(t=>t.id)).toEqual(expect.arrayContaining([future.id, donePast.id]))
  })
})

describe('sortOpenTasks', () => {
  it('high urgency first, then oldest due_date', () => {
    const a = T({ urgency:'low', due_date:'2026-05-01' })
    const b = T({ urgency:'high', due_date:'2026-05-11' })
    const c = T({ urgency:'high', due_date:'2026-05-05' })
    expect(sortOpenTasks([a,b,c]).map(t=>t.id)).toEqual([c.id, b.id, a.id])
  })
})

describe('URGENCY_ORDER', () => {
  it('high > medium > low', () => {
    expect(URGENCY_ORDER.high).toBeGreaterThan(URGENCY_ORDER.medium)
    expect(URGENCY_ORDER.medium).toBeGreaterThan(URGENCY_ORDER.low)
  })
})
