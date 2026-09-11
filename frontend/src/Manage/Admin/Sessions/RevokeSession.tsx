import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../../../api'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'
import { manageContext } from '../../Manage'

interface Session {
  jti: string
  userId: number
  userEmail: string
  userName: string
  clientType: string
  createdAt: string
  lastUsedAt: string
}

export const RevokeSession = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<Session[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const getSessions = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/sessions/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await resp.json()
      if (resp.status === 200) {
        setSessions(data.data.sessions)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('SESSION_FETCH_ERROR'), type: 'error' })
      }
    } catch {
      setToastData({ message: t('SESSION_FETCH_ERROR'), type: 'error' })
    }
  }, [setToastData, t])

  useEffect(() => {
    getSessions()
  }, [getSessions])

  const handleRevoke = async (jti: string) => {
    try {
      const resp = await apiFetch(`/api/sessions/${jti}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (resp.status === 200) {
        setToastData({ message: t('SESSION_REVOKE_SUCCESS'), type: 'success' })
        getSessions()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('SESSION_REVOKE_ERROR'), type: 'error' })
      }
    } catch {
      setToastData({ message: t('SESSION_REVOKE_ERROR'), type: 'error' })
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        {t('SESSION_TITLE')}
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('SESSION_USER')}</TableCell>
              <TableCell>{t('SESSION_CLIENT')}</TableCell>
              <TableCell>{t('SESSION_CREATED')}</TableCell>
              <TableCell>{t('SESSION_LAST_USED')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.jti}>
                <TableCell>
                  {s.userName} ({s.userEmail})
                </TableCell>
                <TableCell>{s.clientType}</TableCell>
                <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                <TableCell>{new Date(s.lastUsedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleRevoke(s.jti)}
                  >
                    {t('SESSION_REVOKE_BUTTON')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
