export const redirectToPage = (path: string) => {
  const fullRelativePath = `${window.location.origin}/${path}`
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
  return text
    .split(/[\s\-.]+/)
    .flatMap((word) => {
      const chunks: string[] = []
      for (let i = 0; i < word.length; i += 10) {
        chunks.push(word.slice(i, i + 10))
      }
      return chunks.join('-')
    })
    .join(' ')
}

export const hideKeyBoard = () => {
  const activeElement = document.activeElement as HTMLElement
  if (activeElement && activeElement.blur) {
    activeElement.blur()
  }
}