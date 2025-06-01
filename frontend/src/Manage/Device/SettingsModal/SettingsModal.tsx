import { useContext } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { manageContext } from '../../Manage'
import { DeviceModel } from '../../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'
import { DownloadFolders } from '../../constant'
import FormControl from '@mui/material/FormControl'

interface SettingsModalProps {
  data: DeviceModel
  setData: (data: DeviceModel) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  data,
  setData,
}) => {
  const { t } = useTranslation()
  const handleClose = () =>
    setData({
      id: 0,
      name: '',
      token: '',
      active: false,
      settings: {
        movies_path: '',
        series_path: '',
        musics_path: '',
        books_path: '',
        programs_path: '',
        games_path: '',
        default_path: '',
      },
      userEmails: [],
    })
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const resp = await fetch(`/api/devices/${data.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: data.settings,
          userEmails: data.userEmails,
        }),
      })
      if (resp.status === 200) {
        setData({
          id: 0,
          name: '',
          token: '',
          active: false,
          settings: {
            movies_path: '',
            series_path: '',
            musics_path: '',
            books_path: '',
            programs_path: '',
            games_path: '',
            default_path: '',
          },
          userEmails: [],
        })
        setToastData({
          message: t('DEVICE_SETTINGS_UPDATE_SUCCESS'),
          type: 'success',
        })
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else if (resp.status === 400) {
        setToastData({
          message: t('DEVICE_MISSING_SHARING_EMAILS'),
          type: 'error',
        })
      } else {
        setToastData({
          message: t('DEVICE_SETTINGS_UPDATE_ERROR'),
          type: 'error',
        })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  return (
    <Dialog
      open={!!data.name}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="md"
      fullWidth
    >
      <Box component="form" onSubmit={handleSave}>
        <DialogTitle id="alert-dialog-title">
          {t('DEVICE_SETTINGS_TITLE')}
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gridTemplateColumns: { md: '1fr 1fr', xs: '1fr' },
            gap: 2,
            maxHeight: '60vh',
          }}
        >
          <Box>
            {data?.settings &&
              Object.entries(data.settings).map(([key, value]) => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography>
                    {t(DownloadFolders[key as keyof typeof data.settings])}
                  </Typography>
                  <FormControl fullWidth>
                    <TextField
                      key={key}
                      value={value}
                      onChange={(event) => {
                        const newData = { ...data }
                        newData.settings[key as keyof typeof data.settings] =
                          event.target.value
                        setData(newData)
                      }}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                    />
                  </FormControl>
                </Box>
              ))}
          </Box>
          <Box>
            <Typography>{t('DEVICE_OWNERS_TITLE')}</Typography>
            {data?.userEmails &&
              data.userEmails.map((mail: string, index: number) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 2 }}
                >
                  <FormControl fullWidth>
                    <TextField
                      type="email"
                      value={mail}
                      onChange={(event) => {
                        const newData = { ...data }
                        newData.userEmails[index] = event.target.value
                        setData(newData)
                      }}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      sx={{ mt: 'auto', mb: 'auto' }}
                    />
                  </FormControl>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => {
                      const newData = { ...data }
                      newData.userEmails.splice(index, 1)
                      setData(newData)
                    }}
                  >
                    <PersonRemoveIcon />
                  </Button>
                </Box>
              ))}
            <Button
              variant="contained"
              onClick={() => {
                const newData = { ...data }
                newData.userEmails.push('')
                setData(newData)
              }}
              sx={{ width: '100%' }}
            >
              <PersonAddAlt1Icon />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary" variant="contained">
            {t('DEVICE_SETTINGS_CLOSE')}
          </Button>
          <Button type="submit" variant="contained" autoFocus>
            {t('DEVICE_SETTINGS_SAVE')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
