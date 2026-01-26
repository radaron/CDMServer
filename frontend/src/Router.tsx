import { BrowserRouter, Routes, Route } from 'react-router'
import { CssBaseline } from '@mui/material'
import AppTheme from './AppTheme'
import { Login } from './Login'
import { Manage } from './Manage'
import { initI18next } from './translation'
import { getLanguage } from './util'
import { Admin } from './Manage/Admin'
import { Device } from './Manage/Device'
import { Download } from './Manage/Download'
import { Status } from './Manage/Status'
import { Settings } from './Manage/Settings'
import { Tmdb } from './Manage/Tmdb'
import {
  DEVICE_PAGE,
  ADMIN_PAGE,
  DOWNLOAD_PAGE,
  STATUS_PAGE,
  SETTINGS_PAGE,
  TMDB_PAGE,
} from './Manage/constant'
import { LOGIN_PAGE, MANAGE_PAGE } from './constant'

initI18next(getLanguage())

export const Router = () => {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <Routes>
          <Route path="/" />
          <Route path={LOGIN_PAGE} element={<Login />} />
          <Route path={MANAGE_PAGE} element={<Manage />}>
            <Route path={ADMIN_PAGE} element={<Admin />} />
            <Route path={DEVICE_PAGE} element={<Device />} />
            <Route path={DOWNLOAD_PAGE} element={<Download />} />
            <Route path={TMDB_PAGE} element={<Tmdb />} />
            <Route path={SETTINGS_PAGE} element={<Settings />} />
            <Route path={STATUS_PAGE} element={<Status />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppTheme>
  )
}
