export const LOGIN_PAGE = 'login'
export const MANAGE_PAGE = 'manage'

export const redirectToPage = (page) => {
  const pathParts = window.location.pathname.split('/')
  pathParts[pathParts.length - 1] = page
  window.location.pathname = pathParts.join('/')
}

export const getLanguageFromUrl = () => {
  const path = window.location.pathname
  const language = path.split('/')[1]
  return language
}

const setLanguageToUrl = (language) => {
  const pathParts = window.location.pathname.split('/')
  pathParts[1] = language
  window.location.pathname = pathParts.join('/')
}

export const toggleLanguage = () => {
  const language = getLanguageFromUrl()
  const newLanguage = language === 'en' ? 'hu' : 'en'
  setLanguageToUrl(newLanguage)
}
