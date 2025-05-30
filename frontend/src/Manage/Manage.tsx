import React, { useEffect, useState, createContext } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import { Outlet } from 'react-router'
import { Header } from './Header'
import styles from './Manage.module.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../constant'
import { redirectToPage } from '../util'
import { UserInfo, ToastData } from './types'

import BackgroundImage from '../background.png'

export const manageContext = createContext<{
  setToastData: (data: { message: string; type: string }) => void
} | null>(null)

export const Manage = () => {
  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    isAdmin: false,
    name: '',
    ncoreUser: '',
    isNcoreCredentialSet: false,
  })
  const [toastData, setToastData] = useState<ToastData>({
    message: '',
    type: null,
  })

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const resp = await fetch('/api/users/me/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
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
            isNcoreCredentialSet: false,
          })
        }
      } catch (error) {
        setUserInfo({
          email: '',
          isAdmin: false,
          name: '',
          ncoreUser: '',
          isNcoreCredentialSet: false,
        })
      }
    }
    getUserInfo()
  }, [])

  const logOut = async () => {
    try {
      const resp = await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        await resp.json()
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('LOGOUT_FAILED'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('LOGOUT_FAILED'), type: 'danger' })
    }
  }

  return (
    <div
      style={{ backgroundImage: `url(${BackgroundImage})` }}
      className={styles.container}
    >
      <ToastContainer position="top-center" className="p-3">
        <Toast
          delay={4000}
          show={toastData.message.length > 0}
          onClose={() => setToastData({ message: '', type: null })}
          bg={toastData?.type?.toLowerCase()}
          className="text-center"
          autohide
        >
          <Toast.Header>
            <strong className="me-auto"></strong>
          </Toast.Header>
          <Toast.Body>{toastData.message}</Toast.Body>
        </Toast>
      </ToastContainer>
      <manageContext.Provider value={{ setToastData }}>
        <Header userInfo={userInfo} logOut={logOut} />
        <Outlet />
      </manageContext.Provider>
    </div>
  )
}
