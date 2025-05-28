import { useEffect, useState, createContext } from 'react'
import { Header } from './Header'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../constant'
import { redirectToPage } from '../util'
import { UserInfo, ToastData } from './types'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import BackgroundImage from '../background.png'
import { OverridableStringUnion } from '@mui/types';
import { AlertColor } from '@mui/material/Alert';
import { AlertPropsColorOverrides } from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AppTheme from '../AppTheme';

const ManageContainer = styled(Stack)(() => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: `url(${BackgroundImage})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  },
}))


export const manageContext = createContext<{
  setToastData: (data: { message: string; type: OverridableStringUnion<AlertColor, AlertPropsColorOverrides> }) => void
} | null>(null)

export const Manage = () => {
  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    isAdmin: false,
    name: '',
    ncoreUser: '',
    isNcoreCredentialSet: false,
  })
  const [toastData, setToastData] = useState<ToastData>({
    message: 'test',
    type: 'info',
  })
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const resp = await fetch('/api/users/me/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (resp.status === 200) {
          const data = await resp.json()
          setUserInfo(data)
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setUserInfo({
            email: '',
            isAdmin: false,
            name: '',
            ncoreUser: '',
            isNcoreCredentialSet: false,
          })
        }
      } catch (error) {
        setUserInfo({
          email: '',
          isAdmin: false,
          name: '',
          ncoreUser: '',
          isNcoreCredentialSet: false,
        })
      }
    }
    getUserInfo()
  }, [])

  const logOut = async () => {
    try {
      const resp = await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        await resp.json()
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('LOGOUT_FAILED'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('LOGOUT_FAILED'), type: 'error' })
    }
  }

  return (
    <AppTheme>
      <ManageContainer>
        <Snackbar
          open={toastData.message.length > 0}
          autoHideDuration={4000}
          onClose={() => setToastData({ message: '', type: 'info' })}
          anchorOrigin={
            isMobile
              ? { vertical: 'bottom', horizontal: 'center' }
              : { vertical: 'top', horizontal: 'center' }
          }
        >
          <Alert
            severity={toastData.type}
            onClose={() => setToastData({ message: '', type: 'info' })}
          >
            {toastData.message}
          </Alert>
        </Snackbar>
        <manageContext.Provider value={{ setToastData }}>
          <Header userInfo={userInfo} logOut={logOut} />
        </manageContext.Provider>
      </ManageContainer>
    </AppTheme>
  )
}
