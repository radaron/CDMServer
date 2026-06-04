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
