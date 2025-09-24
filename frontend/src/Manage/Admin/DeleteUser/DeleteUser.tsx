import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material'
import { useState, useContext, useEffect } from 'react'
import { manageContext } from '../../Manage'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'

interface DeleteUserProps {
  fetchUsers: () => void
  users: {
    email: string
    id: number
    name: string
  }[]
}

export const DeleteUser: React.FC<DeleteUserProps> = ({
  fetchUsers,
  users,
}) => {
  const { t } = useTranslation()
  const [selectedUser, setSelectedUser] = useState('')
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  useEffect(() => {
    setSelectedUser(users[0]?.email || '')
  }, [users])

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (window.confirm(t('DELETE_USER_CONFIRM'))) {
      const id = users.filter((user) => user.email === selectedUser)[0].id
      try {
        const resp = await fetch(`/api/users/${id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (resp.status === 200) {
          setToastData({ message: t('USER_DELETE_SUCCESS'), type: 'success' })
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setToastData({ message: t('USER_DELETE_ERROR'), type: 'error' })
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      }
      fetchUsers()
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleDelete}
      sx={{ maxWidth: 400, margin: '0 auto', gap: 1, display: 'grid' }}
    >
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        {t('DELETE_USER_TITLE')}
      </Typography>
      <FormControl>
        <Select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          displayEmpty
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.email}>
              {user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" type="submit">
        {t('DELETE_USER_BUTTON')}
      </Button>
    </Box>
  )
}
