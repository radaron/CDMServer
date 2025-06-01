import { useEffect, useState, useContext, useCallback } from 'react'
import { Box } from '@mui/material'
import { DeviceElement } from './DeviceElement'
import { AddDevice } from './AddDevice'
import { SettingsModal } from './SettingsModal'
import { manageContext } from '../Manage'
import { DeviceModel } from '../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'

export const Device = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  setHeaderTitle(t('HEADER_DEVICES'))
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [selectedDeviceData, setSelectedDeviceData] = useState<DeviceModel>({
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

  const getDevices = useCallback(async () => {
    try {
      const resp = await fetch('/api/devices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setDevices(data.data.devices)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('FETCHING_DEVICE_ERROR'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }, [setToastData, t])

  useEffect(() => {
    getDevices()
    const intervalId = setInterval(getDevices, 5000)
    return () => clearInterval(intervalId)
  }, [selectedDeviceData, getDevices])

  return (
    <Box>
      <Box
        sx={{
          marginBottom: 2,
          padding: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          maxWidth: { sm: '1000px' },
          mx: 'auto',
        }}
      >
        <SettingsModal
          data={selectedDeviceData}
          setData={setSelectedDeviceData}
        />
        <AddDevice refetch={getDevices} />
      </Box>
      <Box
        sx={{
          maxWidth: { sm: '1000px' },
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {devices.map((device) => (
          <DeviceElement
            key={device.id}
            deviceData={device}
            refetch={getDevices}
            setSelectedDeviceData={setSelectedDeviceData}
          />
        ))}
      </Box>
    </Box>
  )
}
