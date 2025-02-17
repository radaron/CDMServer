import './Settings.css'
import { useState } from 'react'
import { Form, Button, Container, Row, Col } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from '../../util'

export const Settings = () => {
  const { t } = useTranslation()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const resp = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            ncoreUser: userName,
            ncorePass: password
          }
        )
      })
      if (resp.status === 200) {
        setUserName('')
        setPassword('')
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Container>
      <Row>
        <Col className='d-flex justify-content-center'>
          <Form className='shadow p-4 bg-white rounded settings-ncore__wrapper' onSubmit={onSubmit}>
            <div className='h4 mb-2 text-center'>{t('SET_NCORE_CREDENTIALS')}</div>
            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                value={userName}
                placeholder={t('NCORE_USERNAME_PLACEHOLDER')}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='mb-2'>
              <Form.Control
                type='password'
                value={password}
                placeholder={t('NCORE_PASSWORD_PLACEHOLDER')}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button className='w-100' variant='primary' type='submit'>
              {t('SET_NCORE_CREDENTIALS')}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}
