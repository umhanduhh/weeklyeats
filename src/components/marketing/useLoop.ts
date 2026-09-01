'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * step goes 0..steps, holds at the end for `hold` ms, then restarts.
 * Pass `paused` (reduced-motion or off-screen) to freeze the timer chain.
 */
export function useLoop(steps: number, ms: number, hold = 2200, paused = false) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (paused) return
    const t =
      step >= steps
        ? setTimeout(() => setStep(0), hold)
        : setTimeout(() => setStep((s) => s + 1), ms)
    return () => clearTimeout(t)
  }, [step, steps, ms, hold, paused])
  return step
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Gates a loop to only run while its element is scrolled into view. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView] as const
}
