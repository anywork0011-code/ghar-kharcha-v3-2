// useTheme.js — Dark / Light / System theme manager
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'gk_theme'

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export default function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'dark'
  )

  // Apply on mount + when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // When system theme, listen for OS preference changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
  }

  return [theme, setTheme]
}
