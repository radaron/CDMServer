import { Form, Button, Spinner, Container, Row, Col } from 'react-bootstrap'
import { CameraReelsFill, Download, StarFill } from 'react-bootstrap-icons'
import { useState, useContext, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from "react-router"
import { manageContext } from '../Manage'
import { LOGIN_PAGE } from '../../constant'
import { DOWNLOAD_PAGE, searchWhere } from '../constant'
import { redirectToPage } from '../../util'
import { PATTERN } from './constant'
import styles from './Imdb.module.css'


export const Imdb = () => {
  const { t } = useTranslation()
  const [isLoading, setLoading] = useState(false)
  const [pattern, setPattern] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const { setToastData } = useContext(manageContext)
  const [searchParams, setSearchParams] = useSearchParams()

  const search = useCallback(async () => {
    if (searchParams.has(PATTERN)) {
      setPattern(searchParams.get(PATTERN))
      setLoading(true)
      try {
        const resp = await fetch(`/api/omdb/search/?pattern=${searchParams.get(PATTERN)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (resp.status === 200) {
          const data = await resp.json()
          setSearchResults(data.data)
          if (data.data.length === 0) {
            setToastData({ message: t('NO_RESULTS'), type: 'warning' })
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
  }, [searchParams, setToastData, t])

  const submitSearch = useCallback((event) => {
      event.preventDefault()
      setSearchParams({pattern})
  }, [pattern, setSearchParams])

  useEffect(() => {search()}, [search, searchParams])

  return (
    <>
      <Form className={`shadow p-4 bg-white rounded ${styles.searchBox}`} onSubmit={submitSearch}>
        <Container fluid='md'>
          <Row>
            <Col xs={10}>
              <Form.Control
                type='text'
                value={pattern}
                placeholder={t('SEARCH_PLACEHOLDER')}
                onChange={(e) => setPattern(e.target.value)}
                required={true}
              />
            </Col>
            <Col xs>
              <Button
                variant='warning'
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
          {searchResults.map((result) => (
            <div key={result.imdbId}>
              <Row className='p-2'>
                <Col className='d-flex justify-content-center'>
                  <img src={result.poster} alt={result.title} />
                </Col>
                <Col>
                  <Row>
                    <a href={`https://www.imdb.com/title/${result.imdbId}/`} target='_blank' rel='noreferrer'>
                      <h1>{result.title} ({result.year})</h1>
                    </a>
                    <p className='w-75'>{result.plot}</p>
                  </Row>
                  <Row>
                    <h3><CameraReelsFill size={20} color='#ffc107'/> {t('DIRECTOR')}: {result.director}</h3>
                    <h3><StarFill size={20} color='#ffc107'/> {t('RATE')}: {result.rating}</h3>
                    <Col className='mt-2'>
                      <Button variant='warning' onClick={() => {
                        redirectToPage(
                          `${DOWNLOAD_PAGE}`
                          + `?pattern=${result.imdbId}&searchWhere=${searchWhere[1]}&searchCategory=all_own`
                        )
                      }}>
                        <Download />
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          ))}
        </Container>
    }
    </>
  )
}
