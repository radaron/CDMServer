import {
  Box,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  TextField,
  FormControl,
} from '@mui/material'
import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'

interface NewUserProps {
  fetchUsers: () => void
}

export const NewUser: React.FC<NewUserProps> = ({ fetchUsers }) => {
  const { t } = useTranslation()
  const [inputEmail, setInputEmail] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [inputName, setInputName] = useState('')
  const [inputIsAdmin, setInputIsAdmin] = useState(false)
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const resp = await fetch('/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inputEmail,
          isAdmin: inputIsAdmin,
          name: inputName,
          password: inputPassword,
        }),
      })
      if (resp.status === 200) {
        setToastData({ message: t('USER_ADD_SUCCESS'), type: 'success' })
        fetchUsers()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('USER_ADD_ERROR'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 400, margin: '0 auto', gap: 1, display: 'grid' }}
    >
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        {t('ADD_NEW_USER_TITLE')}
      </Typography>
      <FormControl>
        <TextField
          type="email"
          value={inputEmail}
          placeholder={t('EMAIL_PLACEHOLDER')}
          onChange={(e) => setInputEmail(e.target.value)}
          required
        />
      </FormControl>
      <FormControl>
        <TextField
          type="password"
          value={inputPassword}
          placeholder={t('PASSWORD_PLACEHOLDER')}
          onChange={(e) => setInputPassword(e.target.value)}
          required
        />
      </FormControl>
      <FormControl>
        <TextField
          type="text"
          value={inputName}
          placeholder={t('NAME_PLACEHOLDER')}
          onChange={(e) => setInputName(e.target.value)}
          required
        />
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={inputIsAdmin}
            onChange={(e) => setInputIsAdmin(e.target.checked)}
          />
        }
        label={t('IS_ADMIN_CHECKBOX')}
      />
      <Button variant="contained" type="submit">
        {t('CREATE_USER_BUTTON')}
      </Button>
    </Box>
  )
}
