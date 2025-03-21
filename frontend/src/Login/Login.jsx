import React, { useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import styles from './Login.module.css'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from "react-router"
import BackgroundImage from '../background.png'
import { CloudArrowDownFill } from 'react-bootstrap-icons'
import { MANAGE_PAGE, REDIRECT_URL } from '../constant'
import { redirectToPage } from '../util'
import { STATUS_PAGE } from '../Manage/constant'

export const Login = () => {
  const { t } = useTranslation()
  const [inputEmail, setInputEmail] = useState('')
  const [inputPassword, setInputPassword] = useState('')

  const [alertMessage, setAlertMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams, ] = useSearchParams()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inputEmail,
          password: inputPassword
        })
      })
      if (resp.status === 200) {
        await resp.json()
        const redirectUrl = searchParams.has(REDIRECT_URL)
          ? searchParams.get(REDIRECT_URL)
          : `${MANAGE_PAGE}/${STATUS_PAGE}`
        redirectToPage(redirectUrl)
      } else {
        setAlertMessage(t('LOGIN_FAILED'))
      }
    } catch (error) {
      setAlertMessage(t('UNEXPECTED_ERROR'))
    }
    setLoading(false)
  }

  return (
    <div
      className={styles.logInWrapper}
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className={styles.signInBackdrop} />
      <Form className={`shadow p-4 bg-white rounded ${styles.logInWrapperForm}`} onSubmit={handleSubmit}>
        <CloudArrowDownFill size={50} className='mx-auto d-block mb-2' />
        {alertMessage && (
          <Alert
            className='mb-2'
            variant='danger'
            onClose={() => setAlertMessage('')}
            dismissible
          >
            {alertMessage}
          </Alert>
        )}
        <Form.Group className='mb-2' controlId='email'>
          <Form.Control
            type='text'
            value={inputEmail}
            placeholder={t('EMAIL_PLACEHOLDER')}
            onChange={(e) => setInputEmail(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className='mb-2' controlId='password'>
          <Form.Control
            type='password'
            value={inputPassword}
            placeholder={t('PASSWORD_PLACEHOLDER')}
            onChange={(e) => setInputPassword(e.target.value)}
            required
          />
        </Form.Group>
        {!loading
          ? (
            <Button className='w-100' variant='primary' type='submit'>
              {t('LOGIN')}
            </Button>
            )
          : (
            <Button className='w-100' variant='primary' type='submit' disabled>
              {t('LOGGING_IN')}...
            </Button>
            )}
      </Form>
    </div>
  )
}
