import React, { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import MuiCard from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { MANAGE_PAGE, REDIRECT_URL } from '../constant'
import { redirectToPage } from '../util'
import { STATUS_PAGE } from '../Manage/constant'
import AppTheme from '../AppTheme'
import { neonGradient } from '../customizations/themePrimitives'

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(225, 30.80%, 5.10%, 0.53) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
}))

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
  },
  backgroundImage: neonGradient,
}))

export const Login = () => {
  const { t } = useTranslation()
  const [inputEmail, setInputEmail] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false)

  const [alertMessage, setAlertMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log(event)
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inputEmail,
          password: inputPassword,
          keepLoggedIn: keepSignedIn,
        }),
      })
      if (resp.status === 200) {
        await resp.json()
        const redirectUrl = searchParams.has(REDIRECT_URL)
          ? searchParams.get(REDIRECT_URL) || ''
          : `${MANAGE_PAGE}/${STATUS_PAGE}`
        redirectToPage(redirectUrl)
      } else {
        setAlertMessage(t('LOGIN_FAILED'))
      }
    } catch (error) {
      setAlertMessage(t('UNEXPECTED_ERROR'))
    }
    setLoading(false)
  }

  return (
    <SignInContainer direction="column" justifyContent="space-between">
      <Card>
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          {t('LOGIN')}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">{t('EMAIL_PLACEHOLDER')}</FormLabel>
            <TextField
              error={!!alertMessage}
              helperText={alertMessage}
              id="email"
              type="email"
              name="email"
              placeholder={t('EMAIL_PLACEHOLDER')}
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              onChange={(e) => setInputEmail(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">
              {t('PASSWORD_PLACEHOLDER')}
            </FormLabel>
            <TextField
              name="password"
              placeholder={t('PASSWORD_PLACEHOLDER')}
              type="password"
              id="password"
              autoComplete="current-password"
              autoFocus
              required
              fullWidth
              variant="outlined"
              onChange={(e) => setInputPassword(e.target.value)}
            />
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                color="primary"
              />
            }
            label={t('KEEP_ME_SIGNED_IN')}
          />
          {!loading ? (
            <Button variant="contained" fullWidth type="submit">
              {t('LOGIN')}
            </Button>
          ) : (
            <Button variant="contained" fullWidth type="submit" disabled>
              {t('LOGGING_IN')}...
            </Button>
          )}
        </Box>
      </Card>
    </SignInContainer>
  )
}
