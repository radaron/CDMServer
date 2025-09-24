import { useState, useEffect, useContext, useCallback } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
} from '@mui/material'
import HourglassDisabledIcon from '@mui/icons-material/HourglassDisabled'
import { manageContext } from '../Manage'
import { DeviceModel } from '../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage, separateWords } from '../../util'
import { Torrent } from './interfaces'
import { StatusItem } from './StatusItem'


export const Status = () => {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)
  const [statusData, setStatusData] = useState<Torrent[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  const [value, setValue] = useState(0)

  useEffect(() => {
    setHeaderTitle(t('HEADER_STATUS'))
  }, [setHeaderTitle, t])

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

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
        if (data.data.devices.length > 0) {
          setDevices(data.data.devices)
          setSelectedDeviceId(data.data.devices[0].id)
        }
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
  }, [getDevices])

  useEffect(() => {
    const getStatus = async () => {
      if (selectedDeviceId) {
        try {
          const resp = await fetch(`/api/status/${selectedDeviceId}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          if (resp.status === 200) {
            const data = await resp.json()
            setStatusData(data.data.torrents)
          } else if (resp.status === 401) {
            redirectToPage(LOGIN_PAGE)
          } else {
            setToastData({
              message: t('FETCHING_STATUS_ERROR'),
              type: 'error',
            })
          }
        } catch (error) {
          setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
        }
      }
    }

    getStatus()
    const intervalId = setInterval(getStatus, 5000)
    return () => clearInterval(intervalId)
  }, [selectedDeviceId, setToastData, t])

  return (
    <>
      {devices.length > 0 && (
        <Box
          sx={{
            borderBottom: 1,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            maxWidth: { sm: '1000px' },
            mx: 'auto',
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minWidth: 0,
              width: '100%',
            }}
          >
            {devices.map((device) => (
              <Tab
                key={device.id}
                label={device.name}
                onClick={() => setSelectedDeviceId(device.id)}
              />
            ))}
          </Tabs>
        </Box>
      )}
      <Box
        sx={{
          mt: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          padding: 2,
          textAlign: statusData.length === 0 ? 'center' : 'left',
          maxWidth: { sm: '1000px' },
          mx: 'auto',
        }}
      >
        {statusData.length === 0 ? (
          <>
            <HourglassDisabledIcon sx={{ fontSize: 80 }} />
            <Typography variant="h6">{t('MISSING_TORRENTS')}</Typography>
          </>
        ) : (
          statusData.map((torrent) => (
            <Box key={torrent.name}>
              <StatusItem
                torrent={torrent}
                selectedDeviceId={selectedDeviceId!}
              />
              <Divider />
            </Box>
          ))
        )}
      </Box>
    </>
  )
}
