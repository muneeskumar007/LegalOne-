import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/* ─── Context ────────────────────────────────────────────────────────── */

const ThemeContext = createContext(null)

/* ─── Helpers ────────────────────────────────────────────────────────── */

/** Read stored theme; fall back to 'light' (the JD dashboard default). */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('legalone-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* localStorage unavailable (private mode, etc.) */
  }
  return 'light'
}

/** Apply theme to <html data-theme="..."> so CSS variables react instantly. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/* ─── Provider ───────────────────────────────────────────────────────── */

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  /* Apply on first render */
  useEffect(() => {
    applyTheme(theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback((next) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem('legalone-theme', next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      try {
        localStorage.setItem('legalone-theme', next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/* ─── Hook ───────────────────────────────────────────────────────────── */

/** @returns {{ theme: 'light'|'dark', setTheme: (t: string) => void, toggleTheme: () => void }} */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
