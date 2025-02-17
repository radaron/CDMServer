import { useState, useContext, useEffect } from 'react'
import { Form, Button, Spinner, Container, Row, Col, Dropdown } from 'react-bootstrap'
import { manageContext } from '../Manage'
import { searchWhere, searchCategory } from '../constant'
import './Download.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from '../../util'

export const Download = () => {
  const { t } = useTranslation()
  const [pattern, setPattern] = useState('')
  const [selectedSearchType, setSelectedSearchType] = useState(searchCategory[0])
  const [selectedSearchWhere, setSelectedSearchWhere] = useState(searchWhere[0])
  const [devices, setDevices] = useState([])
  const [isLoading, setLoading] = useState(false)
  const { setToastData, setTorrentSearchResults, torrentSearchResults } = useContext(manageContext)

  const search = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch(
        `/api/download/search/?pattern=${pattern}&where=${selectedSearchWhere}&category=${selectedSearchType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (resp.status === 200) {
        const data = await resp.json()
        setTorrentSearchResults(data.data.torrents)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('SEARCH_ERROR'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
    setLoading(false)
  }

  const getDevices = async () => {
    try {
      const resp = await fetch('/api/devices/',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (resp.status === 200) {
        const data = await resp.json()
        setDevices(data.data.devices)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('GET_DEVICES_ERROR'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }

  const addToDownloadQueue = async (torrentId, deviceId) => {
    try {
      const resp = await fetch('/api/download/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            torrentId,
            deviceId
          })
        }
      )
      if (resp.status === 200) {
        await resp.json()
        setToastData({ message: t('DOWNLOAD_ADDED'), type: 'success' })
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('DOWNLOAD_FAILED'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }

  useEffect(() => { getDevices() }, [])

  return (
    <>
      <Form className='shadow p-4 bg-white rounded search-box' onSubmit={search}>
        <Container>
          <Row>
            <Col xs={6}>
              <Form.Control
                type='text'
                value={pattern}
                placeholder={t('SEARCH_PLACEHOLDER')}
                onChange={(e) => setPattern(e.target.value)}
                required
              />
            </Col>
            <Col xs>
              <Form.Select onChange={(e) => setSelectedSearchType(e.target.value)}>
                {searchCategory.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs>
              <Form.Select onChange={(e) => setSelectedSearchWhere(e.target.value)}>
                {searchWhere.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs>
              <Button
                variant='info'
                type='submit'
                disabled={isLoading}
                className='w-100'
              >
                {isLoading
                  ? (
                    <Spinner animation='border' role='status' size='sm'>
                      <span className='visually-hidden'>{t('LOADING')}...</span>
                    </Spinner>)
                  : t('SEARCH')}
              </Button>
            </Col>
          </Row>
        </Container>
      </Form>
      {
      torrentSearchResults.length > 0 &&
        <Container className='shadow p-2 pt-0 bg-white rounded results' fluid='true'>
          <Row className='bg-info p-3'>
            <Col xs={6}>{t('TITLE')}</Col>
            <Col xs>{t('CATEGORY')}</Col>
            <Col xs>{t('SIZE')}</Col>
            <Col xs>{t('SEEDERS')}</Col>
            <Col xs>{t('LEECHERS')}</Col>
            <Col xs />
          </Row>
          {torrentSearchResults.map((result) => (
            <div key={result.id}>
              <hr className='m-0' />
              <Row className='result-element p-2'>
                <Col xs={6}>
                  <a href={result.url} target='_blank' rel='noreferrer'>{result.title}</a>
                </Col>
                <Col xs>{result.category}</Col>
                <Col xs>{result.size}</Col>
                <Col xs>{result.seeders}</Col>
                <Col xs>{result.leechers}</Col>
                <Col xs>
                  {Object.keys(devices).length > 1
                    ? (
                      <Dropdown>
                        <Dropdown.Toggle variant='success' size='sm'>
                          {t('DOWNLOAD')}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {devices.map((device) => (
                            <Dropdown.Item
                              key={device.id}
                              onClick={() => addToDownloadQueue(result.id, device.id)}
                            >
                              {device.name}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      )
                    : (
                      <Button
                        disabled={devices.length === 0}
                        variant={devices.length === 0 ? 'secondary' : 'success'}
                        size='sm'
                        onClick={() => addToDownloadQueue(result.id, devices[0]?.id)}
                      >
                        {t('DOWNLOAD_BUTTON')}
                      </Button>
                      )}
                </Col>
              </Row>
            </div>
          ))}
        </Container>
    }
    </>
  )
}
