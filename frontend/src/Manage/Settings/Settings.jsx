import { useState, useContext, useEffect } from 'react'
import { Form, Button, Container, Row, Col } from 'react-bootstrap'
import { EraserFill } from 'react-bootstrap-icons'
import { manageContext } from '../Manage'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from '../../util'
import { NCORE_PASSWORD_PLACEHOLDER } from '../constant'
import './Settings.css'

export const Settings = () => {
  const { t } = useTranslation()
  const { setToastData } = useContext(manageContext)
  const [userInfo, setUserInfo] = useState({})
  const [ncoreUserName, setNcoreUserName] = useState('')
  const [ncorePassword, setNcorePassword] = useState('')

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const resp = await fetch('/api/users/me/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (resp.status === 200) {
          const data = await resp.json()
          setUserInfo(data)
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setUserInfo({})
        }
      } catch (error) {
        setUserInfo({})
      }
    }
    getUserInfo()
  }, [])

  useEffect(() => {
    if (userInfo.isNcoreCredentialSet === true) {
      setNcoreUserName(userInfo.ncoreUser)
      setNcorePassword(NCORE_PASSWORD_PLACEHOLDER)
    }
  }, [userInfo])

  const updateNcoreCredential = async (event) => {
    event.preventDefault()
    try {
      const resp = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            ncoreUser: ncoreUserName,
            ncorePass: ncorePassword === NCORE_PASSWORD_PLACEHOLDER ? null : ncorePassword
          }
        )
      })
      if (resp.status === 200) {
        setToastData({ message: t('CREDENTIALS_UPDATED'), type: 'success' })
        setNcorePassword(NCORE_PASSWORD_PLACEHOLDER)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }

  const deleteNcoreCredential = async () => {
    if (window.confirm(t('DELETE_NCORE_CREDENTIALS_CONFIRM'))) {
      try {
        const resp = await fetch('/api/users/me/', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              ncoreUser: '',
              ncorePass: ''
            }
          )
        })
        if (resp.status === 200) {
          setToastData({ message: t('CREDENTIALS_DELETED'), type: 'success' })
          setNcoreUserName('')
          setNcorePassword('')
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
      }
    }
  }

  return (
    <Container className='shadow p-4 bg-white rounded settings-ncore__wrapper'>
      <Row>
        <Col />
        <Col xs={8} className='mb-2'>
          <div className='h4 mb-2 text-center'>{t('SET_NCORE_CREDENTIALS')}</div>
        </Col>
        <Col>
          <Button variant='outline-danger' onClick={() => deleteNcoreCredential()}>
            <EraserFill />
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form onSubmit={updateNcoreCredential}>
            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                value={ncoreUserName}
                onChange={(e) => setNcoreUserName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Control
                type='password'
                value={ncorePassword}
                onChange={(e) => setNcorePassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button
              className='w-100'
              variant='primary'
              disabled={ncoreUserName === '' || ncorePassword === '' || ncorePassword === NCORE_PASSWORD_PLACEHOLDER}
              type='submit'
            >
              {t('SET_NCORE_CREDENTIALS_BUTTON')}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}
