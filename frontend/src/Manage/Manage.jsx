import React, { useEffect, useState, createContext } from "react"
import { Toast } from "react-bootstrap"
import { Admin } from "./Admin"
import { Header } from "./Header"
import { Device } from "./Device"
import { Download } from "./Download"
import { Status } from "./Status"
import { DEVICE, ADMIN, DOWNLOAD, STATUS } from "./constant"
import "./Manage.css"

import BackgroundImage from "../background.png"

export const manageContext = createContext(null)

export const Manage = () => {

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
          window.location.href = "/login"
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
      await resp.json()
      if (resp.status === 200) {
        window.location.href = "/login"
      }
      else {
        console.log("Failed to logout")
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
          show={Object.keys(toastData).length > 0}
          onClose={() => setToastData({})}
          bg={toastData?.type?.toLowerCase()}
          className="toaster"
        >
            <Toast.Header>
              <strong className="me-auto"></strong>
            </Toast.Header>
            <Toast.Body>{toastData.message}</Toast.Body>
        </Toast>
      <manageContext.Provider value={{setToastData}}>
        <Header userInfo={userInfo} setSelectedTab={setSelectedTab} logOut={logOut}/>
        {selectedTab === ADMIN && <Admin />}
        {selectedTab === DEVICE && <Device />}
        {selectedTab === DOWNLOAD && <Download />}
        {selectedTab === STATUS && <Status />}
      </manageContext.Provider>
    </div>
  )
}
