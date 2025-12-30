"use client"

import { useEffect, useState } from "react"

export type Language = "uz" | "uzc" | "ru" | "en"

const SUPPORTED_LANGUAGES: Language[] = ["uz", "uzc", "ru", "en"]
const DEFAULT_LANGUAGE: Language = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as Language
const LANGUAGE_STORAGE_KEY = process.env.NEXT_PUBLIC_LANGUAGE_STORAGE_KEY!

// Translation data cache
const translationCache: Record<Language, any> = {} as Record<Language, any>

// Load translation file
async function loadTranslations(lang: Language): Promise<any> {
  if (translationCache[lang]) {
    return translationCache[lang]
  }

  try {
    const response = await fetch(`/locales/${lang}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`)
    }
    const data = await response.json()
    translationCache[lang] = data
    return data
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error)
    // Fallback to default language
    if (lang !== DEFAULT_LANGUAGE) {
      return loadTranslations(DEFAULT_LANGUAGE)
    }
    return {}
  }
}

// Get current language from localStorage or default
export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE
  }

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
    return stored as Language
  }
  return DEFAULT_LANGUAGE
}

// Set current language
export function setCurrentLanguage(lang: Language): void {
  if (typeof window === "undefined") {
    return
  }
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  // Trigger custom event for components to re-render
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: lang }))
}

// Get translation by key (supports nested keys like "menu.dashboard")
export function getTranslation(
  key: string,
  lang?: Language,
  translations?: any
): string {
  const currentLang = lang || getCurrentLanguage()
  const trans = translations || translationCache[currentLang]

  if (!trans) {
    return key
  }

  const keys = key.split(".")
  let value: any = trans

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  return typeof value === "string" ? value : key
}

// React hook for translations
export function useTranslation() {
  const [language, setLanguage] = useState<Language>(getCurrentLanguage)
  const [translations, setTranslations] = useState<any>(translationCache[language] || {})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial translations
    loadTranslations(language).then((data) => {
      setTranslations(data)
      setIsLoading(false)
    })

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      const newLang = event.detail
      setLanguage(newLang)
      loadTranslations(newLang).then((data) => {
        setTranslations(data)
      })
    }

    window.addEventListener("languageChanged", handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
    }
  }, [])

  const t = (key: string): string => {
    return getTranslation(key, language, translations)
  }

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    setLanguage(lang)
    loadTranslations(lang).then((data) => {
      setTranslations(data)
    })
  }

  return {
    t,
    language,
    changeLanguage,
    isLoading,
  }
}

