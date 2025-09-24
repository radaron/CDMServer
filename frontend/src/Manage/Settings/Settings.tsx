import { useState, useContext, useEffect } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Divider,
  Button,
  TextField,
  FormControl,
  Box,
  Typography,
} from '@mui/material'
import { manageContext } from '../Manage'
import { UserInfo } from '../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { hideKeyBoard, redirectToPage } from '../../util'
import { NCORE_PASSWORD_PLACEHOLDER } from '../constant'

export const Settings = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    isAdmin: false,
    name: '',
    ncoreUser: '',
    isNcoreCredentialSet: false,
  })
  const [ncoreUserName, setNcoreUserName] = useState('')
  const [ncorePassword, setNcorePassword] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setHeaderTitle(t('HEADER_SETTINGS'))
  }, [setHeaderTitle, t])

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

  useEffect(() => {
    if (userInfo.isNcoreCredentialSet === true) {
      setNcoreUserName(userInfo.ncoreUser)
      setNcorePassword(NCORE_PASSWORD_PLACEHOLDER)
    }
  }, [userInfo])

  const updateNcoreCredential = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    hideKeyBoard()
    try {
      const resp = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ncoreUser: ncoreUserName,
          ncorePass:
            ncorePassword === NCORE_PASSWORD_PLACEHOLDER ? null : ncorePassword,
        }),
      })
      if (resp.status === 200) {
        setToastData({ message: t('CREDENTIALS_UPDATED'), type: 'success' })
        setNcorePassword(NCORE_PASSWORD_PLACEHOLDER)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  const deleteNcoreCredential = async () => {
    if (window.confirm(t('DELETE_NCORE_CREDENTIALS_CONFIRM'))) {
      try {
        const resp = await fetch('/api/users/me/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ncoreUser: '',
            ncorePass: '',
          }),
        })
        if (resp.status === 200) {
          setToastData({ message: t('CREDENTIALS_DELETED'), type: 'warning' })
          setNcoreUserName('')
          setNcorePassword('')
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      }
    }
  }

  const updateLoginCredential = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    hideKeyBoard()
    try {
      const resp = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      })
      if (resp.status === 200) {
        setToastData({ message: t('CREDENTIALS_UPDATED'), type: 'success' })
        setLoginPassword('')
        setConfirmPassword('')
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        mt: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        padding: 2,
      }}
    >
      <Box
        component="form"
        sx={{
          display: 'grid',
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          gap: 2,
        }}
        onSubmit={updateNcoreCredential}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" component="div" sx={{ textAlign: 'center' }}>
            {t('SET_NCORE_CREDENTIALS')}
          </Typography>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteNcoreCredential()}
          >
            <DeleteIcon />
          </Button>
        </Box>
        <FormControl>
          <TextField
            type="text"
            value={ncoreUserName}
            onChange={(e) => setNcoreUserName(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <TextField
            type="password"
            value={ncorePassword}
            onChange={(e) => setNcorePassword(e.target.value)}
            required
          />
        </FormControl>
        <Button
          variant="contained"
          type="submit"
          disabled={
            ncoreUserName === '' ||
            ncorePassword === '' ||
            ncorePassword === NCORE_PASSWORD_PLACEHOLDER
          }
        >
          {t('SET_NCORE_CREDENTIALS_BUTTON')}
        </Button>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Box
        component="form"
        sx={{ display: 'grid', maxWidth: 400, margin: '0 auto', gap: 2 }}
        onSubmit={(event) => updateLoginCredential(event)}
      >
        <Typography variant="h6" component="div" sx={{ textAlign: 'center' }}>
          {t('CHANGE_LOGIN_PASSWORD')}
        </Typography>
        <FormControl>
          <TextField type="text" value={userInfo.email} disabled={true} />
        </FormControl>
        <FormControl>
          <TextField
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder={t('NEW_PASSWORD_PLACEHOLDER')}
            required
          />
        </FormControl>
        <FormControl>
          <TextField
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('CONFIRM_PASSWORD_PLACEHOLDER')}
            required
          />
        </FormControl>
        <Button
          variant="contained"
          disabled={loginPassword !== confirmPassword}
          type="submit"
        >
          {t('SET_NCORE_CREDENTIALS_BUTTON')}
        </Button>
      </Box>
    </Box>
  )
}
