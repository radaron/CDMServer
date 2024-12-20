import React, { useEffect, useState } from "react"
import { Admin } from "./Admin"
import { Header } from "./Header"
import { Device } from "./Device"
import { Download } from "./Download"
import { Status } from "./Status"
import { DEVICE, ADMIN, DOWNLOAD, STATUS } from "./constant"
import "./Manage.css"

import BackgroundImage from "../background.png"

export const Manage = () => {

  const [userInfo, setUserInfo] = useState({})
  const [selectedTab, setSelectedTab] = useState(DEVICE)

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const resp = await fetch("/api/manage/me/", {
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
    >
      <Header userInfo={userInfo} setSelectedTab={setSelectedTab} logOut={logOut}/>
      <div className="manage__wrapper">
        {selectedTab === ADMIN && <Admin />}
        {selectedTab === DEVICE && <Device />}
        {selectedTab === DOWNLOAD && <Download />}
        {selectedTab === STATUS && <Status />}
      </div>
    </div>
  )
}
