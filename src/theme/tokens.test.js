import { describe, it, expect } from 'vitest'
import { light, dark, resolveMode, weight, text } from './tokens'

describe('resolveMode', () => {
  it('uses stored value when valid', () => {
    expect(resolveMode('light', true)).toBe('light')
    expect(resolveMode('dark', false)).toBe('dark')
  })
  it("'system' or null falls back to OS preference", () => {
    expect(resolveMode('system', true)).toBe('dark')
    expect(resolveMode('system', false)).toBe('light')
    expect(resolveMode(null, true)).toBe('dark')
    expect(resolveMode(undefined, false)).toBe('light')
  })
  it('garbage stored value falls back to dark', () => {
    expect(resolveMode('banana', false)).toBe('dark')
  })
})

describe('token parity', () => {
  it('light and dark expose the same keys', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort())
  })
  it('exposes weight and text scales', () => {
    expect(weight.body).toBeGreaterThanOrEqual(500)
    expect(text.base).toBe(14)
  })
})
