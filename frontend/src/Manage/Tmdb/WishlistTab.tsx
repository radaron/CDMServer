import { useState, useEffect, useCallback, useContext } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../../api'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'
import { manageContext } from '../Manage'

interface WishlistItem {
  id: number
  imdbId: string
  title: string
  deviceId: number
  deviceName: string
  torrentType: string
  createdAt: string
}

export const WishlistTab = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchWishlist = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await apiFetch('/api/wishlist/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setItems(data.data)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('WISHLIST_FETCH_ERROR'), type: 'error' })
      }
    } catch {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [setToastData, t])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id)
      try {
        const resp = await apiFetch(`/api/wishlist/${id}/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        if (resp.status === 200) {
          setItems((prev) => prev.filter((item) => item.id !== id))
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setToastData({ message: t('WISHLIST_DELETE_ERROR'), type: 'error' })
        }
      } catch {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      } finally {
        setDeletingId(null)
      }
    },
    [setToastData, t]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          borderRadius: 1,
          boxShadow: 1,
          padding: 2,
          backgroundColor: 'background.paper',
          maxWidth: { sm: '1000px' },
          mx: 'auto',
        }}
      >
        <Typography sx={{ color: 'text.secondary' }}>
          {t('WISHLIST_EMPTY')}
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ maxWidth: { sm: '1000px' }, mx: 'auto' }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('TITLE')}</TableCell>
            <TableCell>{t('WISHLIST_DEVICE_LABEL')}</TableCell>
            <TableCell>{t('CATEGORY')}</TableCell>
            <TableCell>{t('WISHLIST_ADDED_DATE')}</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {item.title}
                </Typography>
              </TableCell>
              <TableCell>{item.deviceName}</TableCell>
              <TableCell>
                <Chip
                  label={item.torrentType.toUpperCase()}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '11px' }}
                />
              </TableCell>
              <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  aria-label={t('WISHLIST_REMOVE')}
                >
                  {deletingId === item.id ? (
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
  )
}
