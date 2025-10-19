import { useEffect, useState, createContext } from 'react'
import { Outlet } from 'react-router'
import {
  Box,
  Stack,
  Snackbar,
  Alert,
  useMediaQuery,
  AlertPropsColorOverrides,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import { OverridableStringUnion } from '@mui/types'
import { AlertColor } from '@mui/material/Alert'
import { Header } from './Header'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../constant'
import { DRAWER_WIDTH } from './constant'
import { redirectToPage } from '../util'
import { UserInfo, ToastData } from './types'
import { neonGradient } from '../customizations/themePrimitives'

const ManageContainer = styled(Stack)(({ theme }) => ({
  position: 'relative',
  minHeight: '100%',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: neonGradient,
  },
}))

export const manageContext = createContext<{
  setToastData: (data: {
    message: string
    type: OverridableStringUnion<AlertColor, AlertPropsColorOverrides>
  }) => void
  setHeaderTitle: (title: string) => void
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
    message: '',
    type: 'info',
  })
  const [headerTitle, setHeaderTitle] = useState<string>('')
  const theme = useTheme()

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
    <ManageContainer>
      <Snackbar
        open={toastData.message.length > 0}
        autoHideDuration={4000}
        onClose={() => setToastData({ message: '', type: 'info' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toastData.type}
          onClose={() => setToastData({ message: '', type: 'info' })}
        >
          {toastData.message}
        </Alert>
      </Snackbar>
      <manageContext.Provider value={{ setToastData, setHeaderTitle }}>
        <Header userInfo={userInfo} logOut={logOut} headerTitle={headerTitle}>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 1,
              width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
              pt: { xs: 8, sm: 9 },
              maxWidth: '100vw',
            }}
          >
            <Outlet />
          </Box>
        </Header>
      </manageContext.Provider>
    </ManageContainer>
  )
}
