import { useState, useEffect, useContext, useCallback } from 'react'
import { Row, Col, ProgressBar } from 'react-bootstrap'
import { manageContext } from '../Manage'
import { DeviceModel } from '../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import HourglassDisabledIcon from '@mui/icons-material/HourglassDisabled';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

interface Torrent {
  name: string
  progress: number
  status: string
}

export const Status = () => {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)
  const [statusData, setStatusData] = useState<Torrent[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const [value, setValue] = useState(0)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 1,
      }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minWidth: 0,
            width: '100%',
          }}>
          {devices.map((device) => (
            <Tab
              key={device.id}
              label={device.name}
              onClick={() => setSelectedDeviceId(device.id)}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{
        maxWidth: '100%',
        mt: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        padding: 2,
        maxHeight: 'calc(100vh - 20vh)',
        overflowY: 'auto',
        textAlign: statusData.length === 0 ? 'center' : 'left',
      }}>
      {statusData.length === 0 ? (
        <>
          <HourglassDisabledIcon sx={{ fontSize: 80 }} />
          <Typography variant="h6">
            {t('MISSING_TORRENTS')}
          </Typography>
        </>
        ) : (
        statusData.map((torrent) => (
          <div key={torrent.name}>
            <LinearProgressWithLabel value={torrent.progress} />
            <p>{torrent.name.replace(/\./g, '-')}</p>
          </div>
        )))
      }
      </Box>
    </>
  )
}
