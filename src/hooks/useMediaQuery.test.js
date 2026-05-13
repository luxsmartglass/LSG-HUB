import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery, useIsMobile } from './useMediaQuery'

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),       // legacy
    removeListener: vi.fn(),    // legacy
    dispatchEvent: vi.fn(),
  }))
}

describe('useMediaQuery', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns true when the query matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('returns false when the query does not match', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('useIsMobile uses the 768px breakpoint', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)')
    expect(result.current).toBe(true)
  })

  it('returns false when matchMedia is unavailable', () => {
    // @ts-ignore
    delete window.matchMedia
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })
})
