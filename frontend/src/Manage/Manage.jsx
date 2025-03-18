import React, { useEffect, useState, createContext } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import { Outlet } from 'react-router'
import { Header } from './Header'
import './Manage.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../constant'
import { redirectToPage } from '../util'

import BackgroundImage from '../background.png'

export const manageContext = createContext(null)

export const Manage = () => {
  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState({})
  const [toastData, setToastData] = useState({})
  const [torrentSearchResults, setTorrentSearchResults] = useState([])

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

  const logOut = async () => {
    try {
      const resp = await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (resp.status === 200) {
        await resp.json()
        window.location.pathname = 'login'
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
      className='manage__wrapper'
    >
      <ToastContainer position='top-center' className='p-3'>
        <Toast
          delay={4000}
          show={Object.keys(toastData).length > 0}
          onClose={() => setToastData({})}
          bg={toastData?.type?.toLowerCase()}
          className='text-center'
          autohide
        >
          <Toast.Header>
            <strong className='me-auto'></strong>
          </Toast.Header>
          <Toast.Body>{toastData.message}</Toast.Body>
        </Toast>
      </ToastContainer>
      <manageContext.Provider value={{ setToastData, setTorrentSearchResults, torrentSearchResults }}>
        <Header userInfo={userInfo} logOut={logOut} />
        <Outlet/>
      </manageContext.Provider>
    </div>
  )
}
