import { useState, useContext, useEffect } from 'react'
import { Form, Button, Container, Row, Col } from 'react-bootstrap'
import { EraserFill } from 'react-bootstrap-icons'
import { manageContext } from '../Manage'
import { UserInfo } from '../types'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage } from '../../util'
import { NCORE_PASSWORD_PLACEHOLDER } from '../constant'

export const Settings = () => {
  const { t } = useTranslation()
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    isAdmin: false,
    name: '',
    ncoreUser: '',
    isNcoreCredentialSet: false
  })
  const [ncoreUserName, setNcoreUserName] = useState('')
  const [ncorePassword, setNcorePassword] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
          setUserInfo({
            email: '',
            isAdmin: false,
            name: '',
            ncoreUser: '',
            isNcoreCredentialSet: false
          })
        }
      } catch (error) {
        setUserInfo({
          email: '',
          isAdmin: false,
          name: '',
          ncoreUser: '',
          isNcoreCredentialSet: false
        })
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

  const updateNcoreCredential = async (event: React.FormEvent<HTMLFormElement>) => {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            {
              ncoreUser: '',
              ncorePass: ''
            })
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

  const updateLoginCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const resp = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      })
      if (resp.status === 200) {
        setToastData({ message: t('CREDENTIALS_UPDATED'), type: 'success' })
        setLoginPassword('')
        setConfirmPassword('')
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }

  return (
    <Container>
      <Row>
        <Col className='p-4 m-3 bg-white shadow rounded'>
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
        </Col>
        <Col className='p-4 m-3 bg-white shadow rounded'>
          <Row>
            <Col>
              <div className='h4 mb-2 text-center'>{t('CHANGE_LOGIN_PASSWORD')}</div>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form onSubmit={(event) => updateLoginCredential(event)}>
                <Form.Group className='mb-2'>
                  <Form.Control
                    type='text'
                    value={userInfo.email}
                    disabled={true}
                  />
                </Form.Group>
                <Form.Group className='mb-2'>
                  <Form.Control
                    type='password'
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('NEW_PASSWORD_PLACEHOLDER')}
                    required
                  />
                </Form.Group>
                <Form.Group className='mb-2'>
                  <Form.Control
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('CONFIRM_PASSWORD_PLACEHOLDER')}
                    required
                  />
                </Form.Group>
                <Button
                  className='w-100'
                  variant='primary'
                  disabled={loginPassword !== confirmPassword}
                  type='submit'
                >
                  {t('SET_NCORE_CREDENTIALS_BUTTON')}
                </Button>
              </Form>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}
