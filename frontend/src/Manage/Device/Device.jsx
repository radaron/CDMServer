import { useEffect, useState, useContext, useCallback } from 'react'
import { DeviceElement } from './DeviceElement'
import { AddDevice } from './AddDevice'
import { SettingsModal } from './SettingsModal'
import { manageContext } from '../Manage'
import styles from './Device.module.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'

export const Device = () => {
  const { t } = useTranslation()
  const { setToastData } = useContext(manageContext)
  const [devices, setDevices] = useState([])
  const [selectedDeviceData, setSelectedDeviceData] = useState({})

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
