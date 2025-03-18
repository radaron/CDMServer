import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { Login } from './Login'
import { Manage } from './Manage'
import { initI18next } from './translation'
import { getLanguage } from './util'
import { Admin } from './Manage/Admin'
import { Device } from './Manage/Device'
import { Download } from './Manage/Download'
import { Status } from './Manage/Status'
import { Settings } from './Manage/Settings'
import { Imdb } from './Manage/Imdb'
import { DEVICE_PAGE, ADMIN_PAGE, DOWNLOAD_PAGE, STATUS_PAGE, SETTINGS_PAGE, IMDB_PAGE } from './Manage/constant'


initI18next(getLanguage())

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' />
          <Route path='login' element={<Login/>} />
          <Route path='manage' element={<Manage/>} >
            <Route path={ADMIN_PAGE} element={<Admin/>} />
            <Route path={DEVICE_PAGE} element={<Device/>} />
            <Route path={DOWNLOAD_PAGE} element={<Download/>} />
            <Route path={IMDB_PAGE} element={<Imdb/>} />
            <Route path={SETTINGS_PAGE} element={<Settings/>} />
            <Route path={STATUS_PAGE} element={<Status/>} />
          </Route>
      </Routes>
    </BrowserRouter>
  )
}
