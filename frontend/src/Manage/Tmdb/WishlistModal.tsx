import { useState, useEffect, useCallback, useContext } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../../api'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'
import { manageContext } from '../Manage'

interface Device {
  id: number
  name: string
}

interface Props {
  movie: { title: string; imdbId: string }
  onClose: () => void
  onSuccess: () => void
}

export const WishlistModal = ({ movie, onClose, onSuccess }: Props) => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const [devices, setDevices] = useState<Device[]>([])
  const [torrentTypes, setTorrentTypes] = useState<string[]>([])
  const [deviceId, setDeviceId] = useState<number | ''>('')
  const [torrentType, setTorrentType] = useState('hd_hun')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [devResp, typesResp] = await Promise.all([
          apiFetch('/api/devices/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }),
          apiFetch('/api/wishlist/types/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }),
        ])
        if (devResp.status === 401 || typesResp.status === 401) {
          redirectToPage(LOGIN_PAGE)
          return
        }
        if (devResp.status === 200) {
          const data = await devResp.json()
          const devList: Device[] = data.data.devices
          setDevices(devList)
          if (devList.length > 0) setDeviceId(devList[0].id)
        }
        if (typesResp.status === 200) {
          const data = await typesResp.json()
          setTorrentTypes(data.data)
        }
      } catch {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [setToastData, t])

  const handleSave = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const resp = await apiFetch('/api/wishlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imdbId: movie.imdbId,
          deviceId,
          torrentType,
        }),
      })
      if (resp.status === 200) {
        setToastData({ message: t('WISHLIST_ADDED'), type: 'success' })
        onSuccess()
        onClose()
      } else if (resp.status === 409) {
        setToastData({ message: t('WISHLIST_ALREADY_EXISTS'), type: 'warning' })
        onClose()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('WISHLIST_ADD_ERROR'), type: 'error' })
      }
    } catch {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [deviceId, torrentType, movie, onClose, onSuccess, setToastData, t])

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t('WISHLIST_MODAL_TITLE')}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {movie.title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loadingData ? (
          <CircularProgress size={24} />
        ) : devices.length === 0 ? (
          <Typography color="text.secondary">
            {t('FETCHING_DEVICE_ERROR')}
          </Typography>
        ) : (
          <>
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel>{t('WISHLIST_DEVICE_LABEL')}</InputLabel>
              <Select
                value={deviceId}
                label={t('WISHLIST_DEVICE_LABEL')}
                onChange={(e) => setDeviceId(e.target.value as number)}
              >
                {devices.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('WISHLIST_TYPE_LABEL')}</InputLabel>
              <Select
                value={torrentType}
                label={t('WISHLIST_TYPE_LABEL')}
                onChange={(e) => setTorrentType(e.target.value)}
              >
                {torrentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('DEVICE_SETTINGS_CLOSE')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || loadingData || !deviceId}
        >
          {loading ? <CircularProgress size={20} /> : t('DEVICE_SETTINGS_SAVE')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
