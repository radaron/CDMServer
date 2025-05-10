import { useEffect, useState, useContext, useCallback } from 'react'
import { DeviceElement } from './DeviceElement'
import { AddDevice } from './AddDevice'
import { SettingsModal } from './SettingsModal'
import { manageContext } from '../Manage'
import styles from './Device.module.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'

interface Settings {
  movies_path: string;
  series_path: string;
  musics_path: string;
  books_path: string;
  programs_path: string;
  games_path: string;
  default_path: string;
}

interface Device {
  id: number;
  token: string;
  active: boolean;
  name: string;
  settings: Settings;
  userEmails: string[];
}

export const Device = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceData, setSelectedDeviceData] = useState<Device>({
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
      default_path: ''
    },
    userEmails: [],
  })

  const getDevices = useCallback(async () => {
    try {
      const resp = await fetch('/api/devices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setDevices(data.data.devices)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('FETCHING_DEVICE_ERROR'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }, [setToastData, t])

  useEffect(() => {
    getDevices()
    const intervalId = setInterval(getDevices, 5000)
    return () => clearInterval(intervalId)
  }, [selectedDeviceData, getDevices])

  return (
    <div className={styles.device}>
      <SettingsModal data={selectedDeviceData} setData={setSelectedDeviceData} />
      {devices.map((device) => (
        <DeviceElement
          key={device.id}
          deviceData={device}
          refetch={getDevices}
          setSelectedDeviceData={setSelectedDeviceData}
        />
      ))}
      <AddDevice refetch={getDevices} />
    </div>
  )
}
