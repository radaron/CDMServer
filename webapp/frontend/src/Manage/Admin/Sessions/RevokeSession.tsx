import DeleteIcon from '@mui/icons-material/Delete'
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../../../api'
import { LOGIN_PAGE } from '../../../constant'
import {
  formatDateTime,
  formatRelativeTime,
  redirectToPage,
} from '../../../util'
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

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export const RevokeSession = () => {
  const { t, i18n } = useTranslation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingJti, setRevokingJti] = useState<string | null>(null)
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const language = i18n.language

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
    } finally {
      setLoading(false)
    }
  }, [setToastData, t])

  useEffect(() => {
    getSessions()
  }, [getSessions])

  const handleRevoke = async (jti: string) => {
    setRevokingJti(jti)
    try {
      const resp = await apiFetch(`/api/sessions/${jti}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (resp.status === 200) {
        setToastData({ message: t('SESSION_REVOKE_SUCCESS'), type: 'success' })
        await getSessions()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('SESSION_REVOKE_ERROR'), type: 'error' })
      }
    } catch {
      setToastData({ message: t('SESSION_REVOKE_ERROR'), type: 'error' })
    } finally {
      setRevokingJti(null)
    }
  }

  const sessionsByUser = sessions.reduce<Record<number, Session[]>>(
    (acc, s) => {
      if (!acc[s.userId]) acc[s.userId] = []
      acc[s.userId].push(s)
      return acc
    },
    {}
  )

  const userGroups = Object.values(sessionsByUser)
    .map((userSessions) =>
      [...userSessions].sort(
        (a, b) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      )
    )
    .sort((a, b) => a[0].userName.localeCompare(b[0].userName))

  const renderTimeCell = (value: string) => (
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      <Typography variant="body2">{formatDateTime(value, language)}</Typography>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', display: 'block' }}
      >
        {formatRelativeTime(value, language)}
      </Typography>
    </TableCell>
  )

  return (
    <Box sx={{ maxWidth: { sm: '1000px' }, mx: 'auto', width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        {t('SESSION_TITLE')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : userGroups.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            borderRadius: 1,
            boxShadow: 1,
            padding: 2,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography sx={{ color: 'text.secondary' }}>
            {t('SESSION_EMPTY')}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {userGroups.map((userSessions) => {
            const { userId, userName, userEmail } = userSessions[0]
            return (
              <Paper
                key={userId}
                variant="outlined"
                sx={{ overflow: 'hidden' }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ px: 2, py: 1.5, alignItems: 'center' }}
                >
                  <Avatar sx={{ width: 36, height: 36, fontSize: '14px' }}>
                    {getInitials(userName)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {userName}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: 'text.secondary', display: 'block' }}
                    >
                      {userEmail}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={t('SESSION_COUNT', { count: userSessions.length })}
                  />
                </Stack>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('SESSION_CLIENT')}</TableCell>
                        <TableCell>{t('SESSION_CREATED')}</TableCell>
                        <TableCell>{t('SESSION_LAST_USED')}</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userSessions.map((s) => (
                        <TableRow key={s.jti} hover>
                          <TableCell>
                            <Chip
                              label={s.clientType.toUpperCase()}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: '11px' }}
                            />
                          </TableCell>
                          {renderTimeCell(s.createdAt)}
                          {renderTimeCell(s.lastUsedAt)}
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRevoke(s.jti)}
                              disabled={revokingJti === s.jti}
                              aria-label={t('SESSION_REVOKE_BUTTON')}
                            >
                              {revokingJti === s.jti ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteIcon fontSize="small" color="error" />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
