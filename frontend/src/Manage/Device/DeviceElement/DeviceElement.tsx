import { useContext } from 'react'
import { manageContext } from '../../Manage'
import { DeviceModel } from '../../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Chip from '@mui/material/Chip'

interface DeviceElementProps {
  deviceData: DeviceModel
  refetch: () => void
  setSelectedDeviceData: (data: DeviceModel) => void
}

export const DeviceElement: React.FC<DeviceElementProps> = ({
  deviceData,
  refetch,
  setSelectedDeviceData,
}) => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(deviceData.token)
    setToastData({ message: t('TOKEN_COPIED'), type: 'success' })
  }

  const deleteDevice = async () => {
    if (window.confirm(t('DELETE_DEVICE_CONFIRM'))) {
      try {
        const resp = await fetch(`/api/devices/${deviceData.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (resp.status === 200) {
          refetch()
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setToastData({ message: t('DEVICE_DELETE_ERROR'), type: 'error' })
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      }
    }
  }

  return (
    <Card sx={{ minWidth: 275 }} key={deviceData.name}>
      <CardContent>
        <Typography
          variant="h6"
          component="div"
          sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
        >
          {deviceData.name}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mx: 5,
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {t('STATUS_TITLE')}:{' '}
            {deviceData.active ? (
              <Chip label={t('ACTIVE_BADGE')} color="success" />
            ) : (
              <Chip label={t('INACTIVE_BADGE')} color="error" />
            )}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {t('TOKEN_TITLE')}:{' '}
            <ContentCopyIcon onClick={copyTokenToClipboard} />
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button
          color="secondary"
          variant="contained"
          onClick={() => setSelectedDeviceData(deviceData)}
        >
          <SettingsIcon />
        </Button>
        <Button color="error" variant="contained" onClick={deleteDevice}>
          <DeleteIcon />
        </Button>
      </CardActions>
    </Card>
  )
}
