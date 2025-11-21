import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'tvip_theme_preference'

const prefersDarkMode = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }
  } catch (error) {
    // Ignore storage errors and fall back to system preference
  }

  return prefersDarkMode() ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => getInitialTheme())

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch (error) {
      // Fail silently when localStorage is not available
    }
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event) => {
      try {
        const storedTheme = window.localStorage.getItem(STORAGE_KEY)
        if (storedTheme === 'light' || storedTheme === 'dark') {
          return
        }
      } catch (error) {
        // If storage is not available, allow system preference changes
      }

      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
