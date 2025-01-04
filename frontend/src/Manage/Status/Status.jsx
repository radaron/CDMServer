import { useState, useEffect, useContext } from 'react'
import { Form, Container, Row, Col, ProgressBar } from 'react-bootstrap'
import { manageContext } from '../Manage'
import './Status.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from '../../util'

export const Status = () => {

  const { t } = useTranslation()
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [statusData, setStatusData] = useState([])
  const { setToastData } = useContext(manageContext)

  const colourMap = {
    'stopped': 'info',
    'check pending': 'info',
    'checking': 'info',
    'download pending': 'info',
    'downloading': 'info',
    'seed pending': 'success',
    'seeding': 'success',
  }

  const getDevices = async () => {
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
      }
      else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
      else {
        setToastData({message: t('FETCHING_DEVICE_ERROR'), type: 'danger'})
      }
    } catch (error) {
      setToastData({message: t('UNEXPECTED_ERROR'), type: 'danger'})
      console.log(error)
    }
  }

  useEffect(() => {
      getDevices()
  }, [])

  useEffect(() => {
    const getStatus = async () => {
      if (!!selectedDeviceId) {
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
          }
          else if (resp.status === 401) {
            redirectToPage(LOGIN_PAGE)
          }
          else {
            setToastData({message: t('FETCHING_STATUS_ERROR'), type: 'danger'})
          }
        } catch (error) {
          setToastData({message: t('UNEXPECTED_ERROR'), type: 'danger'})
          console.log(error)
        }
      }
    }

    getStatus()
    const intervalId = setInterval(getStatus, 5000)
    return () => clearInterval(intervalId)
  }, [selectedDeviceId, setToastData])

  return (
    <>
      <Form.Select className="shadow bg-white rounded select-box" onChange={(e) => setSelectedDeviceId(e.target.value)}>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>{device.name}</option>
            ))}
          </Form.Select>
      <Container className='shadow m-4 m-1 bg-white rounded status'>
          {statusData.map((torrent) => (
                <Row key={torrent.name} className='p-4'>
                  <Col>{torrent.name}</Col>
                  <Row>
                    <ProgressBar
                      now={torrent.progress}
                      label={`${torrent.progress}%`}
                      variant={colourMap[torrent.status]}
                      className='p-0'
                    />
                  </Row>
                </Row>
          ))}
      </Container>
    </>
  )
}