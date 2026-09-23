export const redirectToPage = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, '')
  const fullRelativePath = `${window.location.origin}/${normalizedPath}`
  window.location.href = fullRelativePath
}

export const getLanguage = () => {
  const language = localStorage.getItem('language')
  if (!language) {
    setLanguage('hu')
    return 'hu'
  }
  return language
}

const setLanguage = (language: string) => {
  localStorage.setItem('language', language)
}

export const toggleLanguage = () => {
  const language = getLanguage()
  const newLanguage = language === 'en' ? 'hu' : 'en'
  setLanguage(newLanguage)
}

export const separateWords = (text: string): string => {
  return text.split(/[\s\-.]+/).join(' ')
}

export const hideKeyBoard = () => {
  const activeElement = document.activeElement as HTMLElement
  if (activeElement && activeElement.blur) {
    activeElement.blur()
  }
}

export const copyTextToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const promptResult = window.prompt('Copy to clipboard:', text)
  if (promptResult === null) {
    throw new Error('clipboard unavailable')
  }
}

export const formatDate = (value: string, language: string): string =>
  new Date(value).toLocaleDateString(language, { dateStyle: 'medium' })

export const formatDateTime = (value: string, language: string): string =>
  new Date(value).toLocaleString(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

export const formatRelativeTime = (value: string, language: string): string => {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  const [unit, unitSeconds] =
    RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ??
    RELATIVE_UNITS[RELATIVE_UNITS.length - 1]
  return formatter.format(Math.round(seconds / unitSeconds), unit)
}
