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
import { copyTextToClipboard, hideKeyBoard, redirectToPage } from '../../util'
import { NCORE_PASSWORD_PLACEHOLDER } from '../constant'

interface McpClientSecretResponse {
  clientSecret: string
}

const EMPTY_USER_INFO: UserInfo = {
  email: '',
  isAdmin: false,
  name: '',
  ncoreUser: '',
  isNcoreCredentialSet: false,
  hasMcpClientSecret: false,
}

export const Settings = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  const [userInfo, setUserInfo] = useState<UserInfo>(EMPTY_USER_INFO)
  const [ncoreUserName, setNcoreUserName] = useState('')
  const [ncorePassword, setNcorePassword] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mcpClientSecret, setMcpClientSecret] = useState('')

  useEffect(() => {
    setHeaderTitle(t('HEADER_SETTINGS'))
  }, [setHeaderTitle, t])

  const getUserInfo = async () => {
    try {
      const userResp = await fetch('/api/users/me/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (userResp.status === 200) {
        const data = await userResp.json()
        setUserInfo(data)
      } else if (userResp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setUserInfo(EMPTY_USER_INFO)
      }
    } catch (error) {
      setUserInfo(EMPTY_USER_INFO)
    }
  }

  useEffect(() => {
    getUserInfo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userInfo.isNcoreCredentialSet === true) {
      setNcoreUserName(userInfo.ncoreUser || '')
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

  const regenerateMcpClientSecret = async () => {
    if (
      userInfo.hasMcpClientSecret &&
      !window.confirm(t('MCP_CLIENT_SECRET_REGENERATE_CONFIRM'))
    ) {
      return
    }

    try {
      const resp = await fetch('/api/users/me/mcp-client-secret/regenerate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (resp.status === 200) {
        const data: McpClientSecretResponse = await resp.json()
        setMcpClientSecret(data.clientSecret)
        setUserInfo((current) => ({ ...current, hasMcpClientSecret: true }))
        setToastData({ message: t('MCP_CLIENT_SECRET_GENERATED'), type: 'success' })
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({
          message: t('MCP_CLIENT_SECRET_GENERATE_ERROR'),
          type: 'error',
        })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  const copyMcpClientSecret = async () => {
    try {
      await copyTextToClipboard(mcpClientSecret)
      setToastData({ message: t('MCP_CLIENT_SECRET_COPIED'), type: 'success' })
    } catch (error) {
      setToastData({ message: t('MCP_CLIENT_SECRET_COPY_ERROR'), type: 'error' })
    }
  }

  const copyMcpClientId = async () => {
    try {
      await copyTextToClipboard(userInfo.email)
      setToastData({ message: t('MCP_CLIENT_ID_COPIED'), type: 'success' })
    } catch (error) {
      setToastData({ message: t('MCP_CLIENT_ID_COPY_ERROR'), type: 'error' })
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
        sx={{
          display: 'grid',
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          gap: 2,
        }}
      >
        <Typography variant="h6" component="div" sx={{ textAlign: 'center' }}>
          {t('MCP_CLIENT_SECRET_TITLE')}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          {t('MCP_CLIENT_ID_TITLE')}
        </Typography>
        <TextField value={userInfo.email} slotProps={{ input: { readOnly: true } }} />
        <Button
          variant="outlined"
          onClick={copyMcpClientId}
          disabled={userInfo.email.length === 0}
        >
          {t('MCP_CLIENT_ID_COPY_BUTTON')}
        </Button>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          {userInfo.hasMcpClientSecret
            ? t('MCP_CLIENT_SECRET_STATUS_SET')
            : t('MCP_CLIENT_SECRET_STATUS_NOT_SET')}
        </Typography>
        <Button variant="contained" onClick={regenerateMcpClientSecret}>
          {userInfo.hasMcpClientSecret
            ? t('MCP_CLIENT_SECRET_REGENERATE_BUTTON')
            : t('MCP_CLIENT_SECRET_GENERATE_BUTTON')}
        </Button>
        {mcpClientSecret.length > 0 && (
          <>
            <TextField
              value={mcpClientSecret}
              slotProps={{ input: { readOnly: true } }}
            />
            <Button variant="outlined" onClick={copyMcpClientSecret}>
              {t('MCP_CLIENT_SECRET_COPY_BUTTON')}
            </Button>
            <Typography
              variant="caption"
              sx={{ textAlign: 'center', color: 'warning.main' }}
            >
              {t('MCP_CLIENT_SECRET_SHOW_ONCE_WARNING')}
            </Typography>
          </>
        )}
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
