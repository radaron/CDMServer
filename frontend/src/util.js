export const redirectToPage = (path) => {
  const fullRelativePath = `${window.location.origin}/${path}`;
  window.location = fullRelativePath
}

export const getLanguage = () => {
  const language = localStorage.getItem('language')
  if (!language) {
    setLanguage('hu')
    return 'hu'
  }
  return language
}

const setLanguage = (language) => {
  localStorage.setItem('language', language)
}

export const toggleLanguage = () => {
  const language = getLanguage()
  const newLanguage = language === 'en' ? 'hu' : 'en'
  setLanguage(newLanguage)
}
