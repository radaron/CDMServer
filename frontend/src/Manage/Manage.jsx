import React, { useEffect, useState, createContext } from "react"
import { Toast } from "react-bootstrap"
import { Admin } from "./Admin"
import { Header } from "./Header"
import { Device } from "./Device"
import { Download } from "./Download"
import { Status } from "./Status"
import { Settings } from "./Settings"
import { Imdb } from "./Imdb"
import { DEVICE, ADMIN, DOWNLOAD, STATUS, SETTINGS, IMDB } from "./constant"
import "./Manage.css"
import { useTranslation } from "react-i18next"
import { LOGIN_PAGE, redirectToPage } from "../util"

import BackgroundImage from "../background.png"

const tabComponents = {
  [ADMIN]: <Admin />,
  [DEVICE]: <Device />,
  [IMDB]: <Imdb />,
  [DOWNLOAD]: <Download />,
  [STATUS]: <Status />,
  [SETTINGS]: <Settings />
};

export const manageContext = createContext(null)

export const Manage = () => {

  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState({})
  const [selectedTab, setSelectedTab] = useState(DEVICE)
  const [toastData, setToastData] = useState({})

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const resp = await fetch("/api/users/me/", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (resp.status === 200) {
          const data = await resp.json()
          setUserInfo(data)
        }
        else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        }
        else {
          setUserInfo({})
        }
    } catch (error) {
      setUserInfo({})
      console.log(error)
    }
  }
  getUserInfo()
}, [])

  const logOut = async () => {
    try {
      const resp = await fetch("/api/auth/logout/", {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
      })
      if (resp.status === 200) {
        await resp.json()
        redirectToPage(LOGIN_PAGE)
      }
      else {
        console.log(t('LOGOUT_FAILED'))
      }
    } catch (error) {
      console.log(error)
    }
  }


  return (
    <div
      style={{ backgroundImage: `url(${BackgroundImage})` }}
      className="manage__wrapper"
    >
        <Toast
          delay={3000}
          show={Object.keys(toastData).length > 0}
          onClose={() => setToastData({})}
          bg={toastData?.type?.toLowerCase()}
          className="toaster"
          autohide
        >
            <Toast.Header>
              <strong className="me-auto"></strong>
            </Toast.Header>
            <Toast.Body>{toastData.message}</Toast.Body>
        </Toast>
      <manageContext.Provider value={{setToastData}}>
        <Header userInfo={userInfo} setSelectedTab={setSelectedTab} logOut={logOut}/>
        {tabComponents[selectedTab]}
      </manageContext.Provider>
    </div>
  )
}
