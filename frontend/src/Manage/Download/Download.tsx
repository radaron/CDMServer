import { useState, useContext, useEffect, useCallback } from 'react'
import { Form, Button, Spinner, Container, Row, Col, Dropdown } from 'react-bootstrap'
import { useSearchParams } from "react-router"
import { manageContext } from '../Manage'
import { DeviceModel } from '../types'
import { searchWhere, searchCategory } from '../constant'
import styles from './Download.module.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'
import { PATTERN, SEARCH_WHERE, SEARCH_CATEGORY } from './constant'

interface TorrentSearchResult {
  id: number
  title: string
  category: string
  size: string
  seeders: number
  leechers: number
  url: string
}

export const Download = () => {
  const { t } = useTranslation()
  const [pattern, setPattern] = useState('')
  const [selectedSearchType, setSelectedSearchType] = useState(searchCategory[0])
  const [selectedSearchWhere, setSelectedSearchWhere] = useState(searchWhere[0])
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [isLoading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<TorrentSearchResult[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const [searchParams, setSearchParams] = useSearchParams()

  const search = useCallback(async () => {
    if (searchParams.has(PATTERN) && searchParams.has(SEARCH_CATEGORY) && searchParams.has(SEARCH_WHERE)) {
      setPattern(searchParams.get(PATTERN) || '')
      setSelectedSearchWhere(searchParams.get(SEARCH_WHERE) || '')
      setSelectedSearchType(searchParams.get(SEARCH_CATEGORY) || '')
      setLoading(true)
      try {
        const resp = await fetch(
          `/api/download/search/?pattern=${searchParams.get(PATTERN)}`
          + `&where=${searchParams.get(SEARCH_WHERE)}`
          + `&category=${searchParams.get(SEARCH_CATEGORY)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        if (resp.status === 200) {
          const data = await resp.json()
          setSearchResults(data.data.torrents)
          if (data.data.torrents.length === 0) {
            setToastData({ message: t('NO_RESULTS'), type: 'info' })
          }
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setToastData({ message: t('SEARCH_ERROR'), type: 'danger' })
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
        console.log(error)
      }
      setLoading(false)
    }
  }, [
    searchParams,
    setToastData,
    setSearchResults,
    t,
  ])

  const submitSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchParams({
      pattern,
      searchWhere: selectedSearchWhere,
      searchCategory: selectedSearchType
    })
  }, [pattern, selectedSearchType, selectedSearchWhere, setSearchParams])

  const getDevices = useCallback(async () => {
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
  }, [setToastData, t])

  const addToDownloadQueue = async (torrentId: number, deviceId: number) => {
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

  useEffect(() => {search()}, [search, searchParams])
  useEffect(() => { getDevices() }, [getDevices])

  return (
    <>
      <Form className={`shadow p-4 bg-white rounded ${styles.searchBox}`} onSubmit={submitSearch}>
        <Container>
          <Row>
            <Col xs={6}>
              <Form.Control
                type='text'
                value={pattern}
                placeholder={t('SEARCH_PLACEHOLDER')}
                onChange={(e) => setPattern(e.target.value)}
              />
            </Col>
            <Col xs>
              <Form.Select onChange={(e) => setSelectedSearchType(e.target.value)} value={selectedSearchType}>
                {searchCategory.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs>
              <Form.Select onChange={(e) => setSelectedSearchWhere(e.target.value)} value={selectedSearchWhere}>
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
      searchResults.length > 0 &&
        <Container className={`shadow p-2 pt-0 bg-white rounded ${styles.results}`} fluid='true'>
          <Row className='bg-info p-3'>
            <Col xs={6}>{t('TITLE')}</Col>
            <Col xs>{t('CATEGORY')}</Col>
            <Col xs>{t('SIZE')}</Col>
            <Col xs>{t('SEEDERS')}</Col>
            <Col xs>{t('LEECHERS')}</Col>
            <Col xs />
          </Row>
          {searchResults.map((result) => (
            <div key={result.id}>
              <hr className='m-0' />
              <Row className={`${styles.resultElement} p-2`}>
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
