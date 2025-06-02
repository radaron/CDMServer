import { useState, useContext } from 'react'
import { Box, FormControl, TextField, Button, Typography } from '@mui/material'
import { manageContext } from '../../Manage'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'

interface AddDeviceProps {
  refetch: () => void
}

export const AddDevice: React.FC<AddDeviceProps> = ({ refetch }) => {
  const { t } = useTranslation()
  const [deviceName, setDeviceName] = useState('')
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const resp = await fetch('/api/devices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deviceName,
        }),
      })
      if (resp.status === 200) {
        setDeviceName('')
        refetch()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else if (resp.status === 409) {
        setToastData({ message: t('DEVICE_NAME_EXISTS'), type: 'error' })
      } else {
        setToastData({ message: t('ADD_DEVICE_FAILED'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  return (
    <Box
      component="form"
      sx={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        display: 'grid',
        gap: 1,
      }}
      onSubmit={handleSubmit}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}
      >
        {t('ADD_DEVICE_TITLE')}
      </Typography>
      <FormControl fullWidth>
        <TextField
          type="text"
          value={deviceName}
          placeholder={t('DEVICE_NAME_PLACEHOLDER')}
          onChange={(e) => setDeviceName(e.target.value)}
          required
        />
      </FormControl>
      <Button variant="contained" type="submit" sx={{ width: '100%' }}>
        {t('ADD_DEVICE_BUTTON')}
      </Button>
    </Box>
  )
}
