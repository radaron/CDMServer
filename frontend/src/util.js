export const LOGIN_PAGE = 'login'
export const MANAGE_PAGE = 'manage'

export const redirectToPage = (page) => {
  window.location.pathname = page
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
