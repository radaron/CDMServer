import { NewUser } from './NewUser'
import { useEffect, useState, useContext, useCallback } from 'react'
import { Box, Divider } from '@mui/material'
import { manageContext } from '../Manage'
import { DeleteUser } from './DeleteUser'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'

export const Admin = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  setHeaderTitle(t('HEADER_ADMIN'))

  const getUsers = useCallback(async () => {
    try {
      const resp = await fetch('/api/users/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await resp.json()
      if (resp.status === 200) {
        setUsers(data.data.users)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('USER_FETCH_ERROR'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }, [setToastData, t])

  useEffect(() => {
    getUsers()
  }, [getUsers])

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
      <NewUser fetchUsers={getUsers} />
      <Divider sx={{ my: 3 }} />
      <DeleteUser fetchUsers={getUsers} users={users} />
    </Box>
  )
}
