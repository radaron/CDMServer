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