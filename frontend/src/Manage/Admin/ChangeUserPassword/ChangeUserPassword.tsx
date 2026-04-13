import {
  Box,
  Button,
  Typography,
  MenuItem,
  FormControl,
  Select,
  TextField,
} from '@mui/material'
import { useState, useContext, useEffect } from 'react'
import { manageContext } from '../../Manage'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'

interface User {
  email: string
  id: number
  name: string
}

interface ChangeUserPasswordProps {
  users: User[]
}

export const ChangeUserPassword: React.FC<ChangeUserPasswordProps> = ({
  users,
}) => {
  const { t } = useTranslation()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  useEffect(() => {
    setSelectedUserId(users[0]?.id?.toString() || '')
  }, [users])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const resp = await fetch(`/api/users/${selectedUserId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      if (resp.status === 200) {
        setToastData({
          message: t('USER_PASSWORD_UPDATE_SUCCESS'),
          type: 'success',
        })
        setNewPassword('')
        setConfirmPassword('')
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({
          message: t('USER_PASSWORD_UPDATE_ERROR'),
          type: 'error',
        })
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
        {t('CHANGE_USER_PASSWORD_TITLE')}
      </Typography>
      <FormControl>
        <Select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          displayEmpty
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id.toString()}>
              {user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <TextField
          type="password"
          value={newPassword}
          placeholder={t('NEW_PASSWORD_PLACEHOLDER')}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </FormControl>
      <FormControl>
        <TextField
          type="password"
          value={confirmPassword}
          placeholder={t('CONFIRM_PASSWORD_PLACEHOLDER')}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </FormControl>
      <Button
        variant="contained"
        type="submit"
        disabled={
          selectedUserId === '' ||
          newPassword === '' ||
          newPassword !== confirmPassword
        }
      >
        {t('CHANGE_USER_PASSWORD_BUTTON')}
      </Button>
    </Box>
  )
}
